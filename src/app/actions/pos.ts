'use server';

import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * Evaluate a single condition
 */
function evaluateCondition(cond: any, context: any) {
  const op = cond.operator || 'EQ';
  const compare = (actual: number, expected: number) => {
    switch (op) {
      case 'EQ': return actual === expected;
      case 'GTE': return actual >= expected;
      case 'LTE': return actual <= expected;
      case 'GT': return actual > expected;
      case 'LT': return actual < expected;
      default: return false;
    }
  };

  switch (cond.criteria_type) {
    case 'TOTAL_BILL':
      return compare(context.subTotal, Number(cond.value_num || 0));
    case 'GROUP_SIZE':
      return compare(context.groupSize || 1, Number(cond.value_num || 1));
    case 'SERVICE_SELECTED':
      return context.item && context.item.id === cond.target_service_id;
    case 'COMBINED_SERVICE_VALUE': {
      if (!context.cartItems || !context.item) return false;
      let otherTotal = 0;
      context.cartItems.forEach((cartItem: any) => {
        if (cartItem.id !== context.item.id || cartItem.type !== context.item.type) {
           otherTotal += cartItem.price * cartItem.quantity;
        }
      });
      return compare(otherTotal, Number(cond.value_num || 0));
    }
    case 'DOCTOR_SELECTED':
      return context.item && context.item.doctor_id === Number(cond.value_num);
    case 'CUSTOMER_TYPE':
      return context.customer?.customer_type === cond.value_text;
    case 'CUSTOMER_ATTRIBUTE':
      if (cond.value_text === 'FIRST_TIME') return context.customer?.customer_type === 'NEW';
      if (cond.value_text === 'BIRTHDAY') return false; // To be implemented with dob
      return false;
    default:
      return false;
  }
}



export async function calculateInvoice(
  cartItems: any[],
  customerId: number | null,
  applyPromotions: boolean = true
) {
  let subTotal = 0;
  cartItems.forEach(item => {
    subTotal += (item.price * item.quantity);
  });

  const evaluatedCartItems = cartItems.map(i => ({ ...i, discount_amount: 0, final_price: i.price }));

  if (!applyPromotions) {
    return {
      subTotal,
      totalDiscount: 0,
      finalTotal: subTotal,
      appliedPromotions: [],
      evaluatedCartItems
    };
  }

  let customer = null;
  if (customerId) {
    customer = await prisma.customers.findUnique({ where: { id: customerId } });
  }

  // 1. Fetch active promotions and rules
  const now = new Date();
  const activePromos = await prisma.promotions.findMany({
    where: { is_active: true, start_date: { lte: now }, end_date: { gte: now } },
    include: {
      promo_rules: {
        include: {
          rule_conditions: true,
          rule_rewards: true
        }
      }
    }
  });

  const promoMap = new Map();
  activePromos.forEach(p => promoMap.set(p.id, p));

  const allRules: any[] = [];
  activePromos.forEach(promo => {
    promo.promo_rules.forEach(rule => {
      allRules.push({ ...rule, promotion_name: promo.promotion_name });
    });
  });

  const globalRules = allRules.filter(r => !r.is_exclusive_rule);
  const specificRules = allRules.filter(r => r.is_exclusive_rule);

  interface DiscountAction {
    promotion_id: number;
    promotion_name: string;
    is_stackable: boolean;
    rule_name: string;
    amount: number;
    giftText: string;
    consumed_items?: { id: number, qty: number }[];
  }
  const discountActions: DiscountAction[] = [];

  // 2. Evaluate Specific Rules (Combos) using Greedy Algorithm
  let availableItems = cartItems.map(i => ({ ...i }));
  
  while (true) {
    let bestRule: any = null;
    let bestDiscount = 0;
    let bestConsumed: { id: number, qty: number }[] = [];
    let bestRewardText = '';

    for (const rule of specificRules) {
      const groupedConditions = rule.rule_conditions.reduce((acc: any, cond: any) => {
        const group = cond.condition_group || 1;
        if (!acc[group]) acc[group] = [];
        acc[group].push(cond);
        return acc;
      }, {});

      for (const groupKey of Object.keys(groupedConditions)) {
        const group = groupedConditions[groupKey];
        let tempItems = availableItems.map(i => ({ ...i }));
        let consumed = new Map<number, number>();
        let matched = true;

        for (const cond of group) {
          if (cond.criteria_type === 'SERVICE_SELECTED') {
            const targetId = cond.target_service_id;
            const found = tempItems.find(i => i.id === targetId && i.quantity > 0);
            if (found) {
              found.quantity -= 1;
              consumed.set(targetId, (consumed.get(targetId) || 0) + 1);
            } else {
              matched = false; break;
            }
          } else if (cond.criteria_type === 'COMBINED_SERVICE_VALUE') {
            const requiredValue = Number(cond.value_num || 0);
            let currentValue = 0;
            for (const item of tempItems) {
              if (currentValue >= requiredValue) break;
              while (item.quantity > 0 && currentValue < requiredValue) {
                item.quantity -= 1;
                currentValue += item.price;
                consumed.set(item.id, (consumed.get(item.id) || 0) + 1);
              }
            }
            if (currentValue < requiredValue) {
              matched = false; break;
            }
          } else if (cond.criteria_type === 'CATEGORY_SELECTED') {
            const targetCatId = cond.target_category_id;
            const minQty = Number(cond.value_num || 1);
            const maxQty = cond.value_num_max ? Number(cond.value_num_max) : Infinity;

            let currentQty = 0;
            for (const item of tempItems) {
               if (item.category_id === targetCatId) {
                  while (item.quantity > 0 && currentQty < maxQty) {
                     item.quantity -= 1;
                     currentQty += 1;
                     consumed.set(item.id, (consumed.get(item.id) || 0) + 1);
                  }
               }
            }
            
            if (currentQty < minQty) {
               matched = false; break;
            }
          } else if (cond.criteria_type === 'TOTAL_BILL') {
             if (subTotal < Number(cond.value_num || 0)) { matched = false; break; }
          } else if (cond.criteria_type === 'CUSTOMER_TYPE') {
             if (customer?.customer_type !== cond.value_text) { matched = false; break; }
          }
        }

        if (matched) {
          let currentDiscount = 0;
          let giftText = '';
          let consumedItemsList = Array.from(consumed.entries()).map(([id, qty]) => ({ id, qty }));
          
          rule.rule_rewards.forEach((reward: any) => {
            if (reward.reward_type === 'DISCOUNT_FIXED' || reward.reward_type === 'FIXED_PRICE') {
              currentDiscount += Number(reward.reward_value || 0);
            } else if (reward.reward_type === 'FIXED_PRICE_PER_ITEM') {
              const totalConsumed = consumedItemsList.reduce((sum, ci) => sum + ci.qty, 0);
              currentDiscount += Number(reward.reward_value || 0) * totalConsumed;
            } else if (reward.reward_type === 'DISCOUNT_PERCENT') {
              let consumedValue = 0;
              consumedItemsList.forEach(ci => {
                 const originalItem = cartItems.find(i => i.id === ci.id);
                 if (originalItem) consumedValue += originalItem.price * ci.qty;
              });
              currentDiscount += consumedValue * (Number(reward.reward_value || 0) / 100);
            } else if (['FREE_SERVICE', 'FREE_PRODUCT', 'CUSTOM_NOTE'].includes(reward.reward_type)) {
              giftText = reward.gift_description || 'Quà tặng';
            }
          });

          if (currentDiscount > bestDiscount) {
            bestDiscount = currentDiscount;
            bestRule = rule;
            bestConsumed = consumedItemsList;
            bestRewardText = giftText;
          }
        }
      }
    }

    if (bestRule && bestDiscount > 0) {
      discountActions.push({
        promotion_id: bestRule.promotion_id,
        promotion_name: bestRule.promotion_name,
        is_stackable: promoMap.get(bestRule.promotion_id)?.is_stackable ?? true,
        rule_name: bestRule.rule_name,
        amount: bestDiscount,
        giftText: bestRewardText,
        consumed_items: bestConsumed
      });
      bestConsumed.forEach(ci => {
        const found = availableItems.find(i => i.id === ci.id);
        if (found) found.quantity -= ci.qty;
      });
    } else {
      break;
    }
  }

  const specificDiscountPerPromo: Record<number, number> = {};
  discountActions.forEach(a => {
    specificDiscountPerPromo[a.promotion_id] = (specificDiscountPerPromo[a.promotion_id] || 0) + a.amount;
  });

  const totalSpecificStackable = discountActions.filter(a => a.is_stackable).reduce((sum, a) => sum + a.amount, 0);

  // 3. Evaluate Global Rules
  const globalActionsByPromo: Record<number, any[]> = {};

  globalRules.forEach(rule => {
    const isStackable = promoMap.get(rule.promotion_id)?.is_stackable ?? true;
    const specificDiscountToSubtract = isStackable ? totalSpecificStackable : (specificDiscountPerPromo[rule.promotion_id] || 0);
    const currentTotalAfterSpecific = subTotal - specificDiscountToSubtract;
    // We recreate evaluateCondition globally for GLOBAL rules
    const evaluateGlobalCondition = (cond: any) => {
      if (cond.criteria_type === 'TOTAL_BILL') return currentTotalAfterSpecific >= Number(cond.value_num || 0);
      if (cond.criteria_type === 'GROUP_SIZE') return true; // not implemented
      if (cond.criteria_type === 'CUSTOMER_TYPE') return customer?.customer_type === cond.value_text;
      if (cond.criteria_type === 'CUSTOMER_ATTRIBUTE') {
        if (cond.value_text === 'FIRST_TIME') return customer?.customer_type === 'NEW';
        return false;
      }
      return false;
    };

    const evaluateGlobalRule = (r: any) => {
      if (!r.rule_conditions || r.rule_conditions.length === 0) return true;
      const groups = r.rule_conditions.reduce((acc: any, c: any) => {
        const g = c.condition_group || 1;
        if (!acc[g]) acc[g] = [];
        acc[g].push(c);
        return acc;
      }, {});
      for (const g of Object.keys(groups)) {
        if (groups[g].every((c: any) => evaluateGlobalCondition(c))) return true;
      }
      return false;
    };

    if (evaluateGlobalRule(rule)) {
      let currentRuleDiscount = 0;
      let giftText = '';
      rule.rule_rewards.forEach((reward: any) => {
        if (reward.reward_type === 'DISCOUNT_FIXED' || reward.reward_type === 'FIXED_PRICE') {
          currentRuleDiscount += Number(reward.reward_value || 0);
        } else if (reward.reward_type === 'FIXED_PRICE_PER_ITEM') {
          const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
          currentRuleDiscount += Number(reward.reward_value || 0) * totalItems;
        } else if (reward.reward_type === 'DISCOUNT_PERCENT') {
          currentRuleDiscount += currentTotalAfterSpecific * (Number(reward.reward_value || 0) / 100);
        } else if (['FREE_SERVICE', 'FREE_PRODUCT', 'CUSTOM_NOTE'].includes(reward.reward_type)) {
          giftText = reward.gift_description || 'Quà tặng';
        }
      });
      if (!globalActionsByPromo[rule.promotion_id]) globalActionsByPromo[rule.promotion_id] = [];
      globalActionsByPromo[rule.promotion_id].push({ rule, discount: currentRuleDiscount, giftText });
    }
  });

  // Apply promo rules with stackable_with_others logic inside each promotion
  for (const promoIdStr of Object.keys(globalActionsByPromo)) {
    const promoId = Number(promoIdStr);
    const evaluated = globalActionsByPromo[promoId];
    evaluated.sort((a, b) => b.discount - a.discount);
    
    const bestUnstackable = evaluated.find(e => e.rule.is_stackable_with_others === false);
    const rulesToApply = bestUnstackable ? [evaluated[0]] : evaluated;

    rulesToApply.forEach(e => {
      discountActions.push({
        promotion_id: promoId,
        promotion_name: e.rule.promotion_name,
        is_stackable: promoMap.get(promoId)?.is_stackable ?? true,
        rule_name: e.rule.rule_name,
        amount: e.discount,
        giftText: e.giftText
      });
    });
  }

  // 4. Apply Promotion Caps
  const promoTotals: Record<number, number> = {};
  discountActions.forEach(a => {
    promoTotals[a.promotion_id] = (promoTotals[a.promotion_id] || 0) + a.amount;
  });

  activePromos.forEach(promo => {
    if ((promoTotals[promo.id] || 0) > 0 && promo.max_discount_percent_cap) {
      const capAmount = subTotal * (Number(promo.max_discount_percent_cap) / 100);
      if (promoTotals[promo.id] > capAmount) {
        const excess = promoTotals[promo.id] - capAmount;
        discountActions.push({
          promotion_id: promo.id,
          promotion_name: promo.promotion_name,
          is_stackable: promo.is_stackable ?? true,
          rule_name: 'Vượt hạn mức giảm',
          amount: -excess,
          giftText: ''
        });
        promoTotals[promo.id] -= excess;
      }
    }
  });

  // 5. Decide Winners: Stackable vs Unstackable Promotions
  const stackableTotal = activePromos.filter(p => p.is_stackable !== false).reduce((sum, p) => sum + (promoTotals[p.id] || 0), 0);
  
  let bestUnstackablePromoId = -1;
  let maxUnstackableTotal = 0;
  activePromos.filter(p => p.is_stackable === false).forEach(p => {
    if ((promoTotals[p.id] || 0) > maxUnstackableTotal) {
      maxUnstackableTotal = promoTotals[p.id];
      bestUnstackablePromoId = p.id;
    }
  });

  const winningPromoIds = new Set<number>();
  if (maxUnstackableTotal > stackableTotal) {
    winningPromoIds.add(bestUnstackablePromoId);
  } else {
    activePromos.filter(p => p.is_stackable !== false).forEach(p => winningPromoIds.add(p.id));
  }

  // 6. Build Final Results
  const finalActions = discountActions.filter(a => winningPromoIds.has(a.promotion_id));

  let totalDiscount = 0;
  const appliedPromotions: { name: string, amount: number, giftText?: string }[] = [];
  const addPromo = (name: string, amount: number, giftText?: string) => {
    const existing = appliedPromotions.find(p => p.name === name);
    if (existing) {
      existing.amount += amount;
      if (giftText && !existing.giftText?.includes(giftText)) {
        existing.giftText = existing.giftText ? `${existing.giftText}, ${giftText}` : giftText;
      }
    } else {
      appliedPromotions.push({ name, amount, giftText });
    }
  };


  finalActions.forEach(a => {
    totalDiscount += a.amount;
    const promoDesc = `[${a.promotion_name}] ${a.rule_name}`;
    addPromo(promoDesc, a.amount, a.giftText);

    if (a.consumed_items) {
      let totalConsumedValue = 0;
      a.consumed_items.forEach((ci: any) => {
         const cartItem = evaluatedCartItems.find((i: any) => i.id === ci.id);
         if (cartItem) totalConsumedValue += cartItem.price * ci.qty;
      });
      
      a.consumed_items.forEach((ci: any) => {
         const cartItem = evaluatedCartItems.find((i: any) => i.id === ci.id);
         if (cartItem && totalConsumedValue > 0) {
            const proportion = (cartItem.price * ci.qty) / totalConsumedValue;
            const discountForThisItem = a.amount * proportion;
            cartItem.discount_amount += discountForThisItem;
            cartItem.final_price = cartItem.price - (cartItem.discount_amount / cartItem.quantity);
         }
      });
    }
  });

  return {
    subTotal,
    totalDiscount,
    finalTotal: subTotal - totalDiscount,
    evaluatedCartItems,
    appliedPromotions
  };
}

export async function checkout(data: {
  customerId: number;
  branchId?: number;
  consultantId?: number; // employee id
  cartItems: any[];
  subTotal: number;
  totalDiscount: number;
  finalTotal: number;
  amountPaid: number;
  paymentMethod: string;
}) {
  try {
    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const inv = await tx.invoices.create({
        data: {
          customer_id: data.customerId,
          branch_id: data.branchId || null,
          consultant_id: data.consultantId || null,
          total_original_price: data.subTotal,
          total_discount: data.totalDiscount,
          final_price: data.finalTotal,
          amount_paid: data.amountPaid,
          status: data.amountPaid >= data.finalTotal ? 'PAID' : 'PARTIAL'
        }
      });

      // 2. Create Payment Record
      if (data.amountPaid > 0) {
        await tx.invoice_payments.create({
          data: {
            invoice_id: inv.id,
            amount: data.amountPaid,
            payment_method: data.paymentMethod
          }
        });
      }

      // 2. Create Invoice Items
      const itemsData = data.cartItems.map(item => ({
        invoice_id: inv.id,
        service_id: item.type === 'SERVICE' ? item.id : 1, // MOCK: if combo, we should ideally expand it to service_id or handle combos in invoice_items schema. Schema expects service_id! So if it's a combo, we need its items.
        quantity: item.quantity,
        base_price: item.price,
        discount_amount: item.discount_amount,
        final_price: item.final_price,
      }));

      // NOTE: Our schema invoice_items currently requires `service_id`. 
      // If a combo is bought, we should ideally expand combo_items into invoice_items.
      // For simplicity in this mock, if it's a COMBO, we will fetch its services and insert them, 
      // or just assume we only select SERVICES for now. Let's expand combo items if needed.
      
      // Let's expand combo items:
      let finalItemsToInsert: any[] = [];
      for (const item of data.cartItems) {
        if (item.type === 'SERVICE') {
          finalItemsToInsert.push({
            invoice_id: inv.id,
            service_id: item.id,
            doctor_id: item.doctor_id || null,
            quantity: item.quantity,
            base_price: item.price,
            discount_amount: item.discount_amount,
            final_price: item.final_price
          });
        } else if (item.type === 'COMBO') {
           const comboItems = await tx.combo_items.findMany({ where: { combo_id: item.id } });
           // distribute combo price to services
           const perServicePrice = item.price / (comboItems.length || 1);
           const perServiceDiscount = item.discount_amount / (comboItems.length || 1);
           
           for (const ci of comboItems) {
             finalItemsToInsert.push({
                invoice_id: inv.id,
                service_id: ci.service_id,
                quantity: (ci.quantity || 1) * item.quantity,
                base_price: perServicePrice,
                discount_amount: perServiceDiscount,
                final_price: perServicePrice - perServiceDiscount
             });
           }
        }
      }

      await tx.invoice_items.createMany({
        data: finalItemsToInsert
      });

      return inv;
    });

    return { success: true, invoiceId: invoice.id };
  } catch (error: any) {
    console.error('Checkout error:', error);
    return { success: false, error: error.message };
  }
}
