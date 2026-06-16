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

/**
 * Evaluate a rule with AND/OR logic using condition_group
 */
function evaluateRule(rule: any, context: any) {
  if (!rule.rule_conditions || rule.rule_conditions.length === 0) return true; // No conditions = always true

  // Group conditions by condition_group
  const groupedConditions = rule.rule_conditions.reduce((acc: any, cond: any) => {
    const group = cond.condition_group || 1;
    if (!acc[group]) acc[group] = [];
    acc[group].push(cond);
    return acc;
  }, {});

  // OR across groups: At least one group must be true
  const groupKeys = Object.keys(groupedConditions);
  for (const key of groupKeys) {
    const group = groupedConditions[key];
    // AND within group: All conditions in this group must be true
    const groupResult = group.every((cond: any) => evaluateCondition(cond, context));
    if (groupResult) {
      return true; // Found a matching group
    }
  }

  return false; // No group matched
}

export async function calculateInvoice(
  cartItems: any[],
  customerId: number | null
) {
  let subTotal = 0;
  cartItems.forEach(item => {
    subTotal += (item.price * item.quantity);
  });

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
    item_id?: number;
    item_type?: string;
  }
  const discountActions: DiscountAction[] = [];

  // 2. Evaluate cart items for Specific Rules
  cartItems.forEach(item => {
    const context = { subTotal, item, customer, cartItems };
    
    specificRules.forEach(rule => {
      if (evaluateRule(rule, context)) {
        rule.rule_rewards.forEach((reward: any) => {
          let currentDiscount = 0;
          let giftText = '';
          if (reward.reward_type === 'DISCOUNT_FIXED' || reward.reward_type === 'FIXED_PRICE') {
            currentDiscount = Number(reward.reward_value || 0);
          } else if (reward.reward_type === 'FIXED_PRICE_PER_ITEM') {
            currentDiscount = Number(reward.reward_value || 0) * item.quantity;
          } else if (reward.reward_type === 'DISCOUNT_PERCENT') {
            currentDiscount = (item.price * item.quantity) * (Number(reward.reward_value || 0) / 100);
          } else if (['FREE_SERVICE', 'FREE_PRODUCT', 'CUSTOM_NOTE'].includes(reward.reward_type)) {
            giftText = reward.gift_description || 'Quà tặng';
          }
          
          discountActions.push({
            promotion_id: rule.promotion_id,
            promotion_name: rule.promotion_name,
            is_stackable: promoMap.get(rule.promotion_id)?.is_stackable ?? true,
            rule_name: rule.rule_name,
            amount: currentDiscount,
            giftText,
            item_id: item.id,
            item_type: item.type
          });
        });
      }
    });
  });

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
    const globalContext = { subTotal: currentTotalAfterSpecific, customer };

    if (evaluateRule(rule, globalContext)) {
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

  const evaluatedCartItems = cartItems.map(item => ({ ...item, discount_amount: 0, final_price: item.price }));

  finalActions.forEach(a => {
    totalDiscount += a.amount;
    const promoDesc = `[${a.promotion_name}] ${a.rule_name}`;
    addPromo(promoDesc, a.amount, a.giftText);

    if (a.item_id && a.item_type) {
      const cartItem = evaluatedCartItems.find(i => i.id === a.item_id && i.type === a.item_type);
      if (cartItem) {
        cartItem.discount_amount += a.amount;
        cartItem.final_price = cartItem.price - (cartItem.discount_amount / cartItem.quantity);
      }
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
