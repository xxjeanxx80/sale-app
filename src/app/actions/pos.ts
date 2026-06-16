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

/**
 * Calculate Discount based on cart items, customer and promo_rules engine.
 */
export async function calculateInvoice(
  cartItems: any[],
  customerId: number | null
) {
  let subTotal = 0;
  cartItems.forEach(item => {
    subTotal += (item.price * item.quantity);
  });

  let totalDiscount = 0;
  const promoDiscountTotals: Record<number, number> = {};
  let customer = null;
  if (customerId) {
    customer = await prisma.customers.findUnique({ where: { id: customerId } });
  }

  let appliedPromotions: { name: string, amount: number, giftText?: string }[] = [];

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

  // Split into global vs specific rules
  const allRules: any[] = [];
  activePromos.forEach(promo => {
    promo.promo_rules.forEach(rule => {
      allRules.push({ ...rule, promotion_name: promo.promotion_name });
    });
  });

  const globalRules = allRules.filter(r => !r.is_exclusive_rule);
  const specificRules = allRules.filter(r => r.is_exclusive_rule);

  // 2. Evaluate cart items for Specific Rules
  const evaluatedCartItems = cartItems.map(item => {
    let itemDiscount = 0;
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
          itemDiscount += currentDiscount;
          const promoDesc = `[${rule.promotion_name}] ${rule.rule_name}`;
          addPromo(promoDesc, currentDiscount, giftText);
          promoDiscountTotals[rule.promotion_id] = (promoDiscountTotals[rule.promotion_id] || 0) + currentDiscount;
        });
      }
    });

    totalDiscount += itemDiscount;

    return {
      ...item,
      discount_amount: itemDiscount,
      final_price: item.price - (itemDiscount / item.quantity)
    };
  });

  // 3. Evaluate Global Rules (on the whole bill)
  const currentTotalAfterSpecific = subTotal - totalDiscount;
  const globalContext = { subTotal: currentTotalAfterSpecific, customer };
  
  const promoGlobalRules: Record<number, { rule: any, discount: number, giftText: string }[]> = {};

  globalRules.forEach(rule => {
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
      if (!promoGlobalRules[rule.promotion_id]) promoGlobalRules[rule.promotion_id] = [];
      promoGlobalRules[rule.promotion_id].push({ rule, discount: currentRuleDiscount, giftText });
    }
  });

  // Apply global rules with stackable logic
  for (const promoIdStr of Object.keys(promoGlobalRules)) {
    const promoId = Number(promoIdStr);
    const evaluated = promoGlobalRules[promoId];
    
    // Sort by discount descending
    evaluated.sort((a, b) => b.discount - a.discount);
    
    let rulesToApply = [];
    const bestUnstackable = evaluated.find(e => e.rule.is_stackable_with_others === false);
    
    if (bestUnstackable) {
       rulesToApply = [evaluated[0]]; // Pick highest discount rule
    } else {
       rulesToApply = evaluated; // All are stackable
    }

    rulesToApply.forEach(e => {
        totalDiscount += e.discount;
        const promoDesc = `[${e.rule.promotion_name}] ${e.rule.rule_name}`;
        addPromo(promoDesc, e.discount, e.giftText);
        promoDiscountTotals[promoId] = (promoDiscountTotals[promoId] || 0) + e.discount;
    });
  }

  // 4. Apply Promotion Caps
  for (const promo of activePromos) {
    const pid = promo.id;
    if (promoDiscountTotals[pid] > 0 && promo.max_discount_percent_cap) {
      const capAmount = subTotal * (Number(promo.max_discount_percent_cap) / 100);
      if (promoDiscountTotals[pid] > capAmount) {
        const excess = promoDiscountTotals[pid] - capAmount;
        totalDiscount -= excess;
        addPromo(`[${promo.promotion_name}] Vượt hạn mức giảm`, -excess);
      }
    }
  }

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
