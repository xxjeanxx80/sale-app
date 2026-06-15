'use server';

import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * MOCK: Calculate Discount based on cart items and customer.
 * In a real scenario, this would evaluate `promo_rules`.
 */
export async function calculateInvoice(
  cartItems: any[],
  customerId: number | null
) {
  // Let's implement a simplified total_bill discount rule check for now.
  let subTotal = 0;
  cartItems.forEach(item => {
    subTotal += (item.price * item.quantity);
  });

  let totalDiscount = 0;
  let finalTotal = subTotal;

  // Let's fetch the customer to know their occupation/type if customerId is provided
  let customer = null;
  if (customerId) {
    customer = await prisma.customers.findUnique({ where: { id: customerId } });
  }

  let appliedPromotions: string[] = [];

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

  // 2. Evaluate cart items
  const evaluatedCartItems = cartItems.map(item => {
    let itemDiscount = 0;
    
    // Check DOCTOR_SELECTED rules
    if (item.type === 'SERVICE' && item.doctor_id) {
      activePromos.forEach(promo => {
        promo.promo_rules.forEach(rule => {
          const doctorCondition = rule.rule_conditions.find(c => c.criteria_type === 'DOCTOR_SELECTED' && Number(c.value_num) === item.doctor_id);
          if (doctorCondition) {
            const reward = rule.rule_rewards[0];
            if (reward) {
              if (reward.reward_type === 'DISCOUNT_AMOUNT') {
                itemDiscount += Number(reward.reward_value || 0);
              } else if (reward.reward_type === 'DISCOUNT_PERCENT') {
                itemDiscount += (item.price * item.quantity) * (Number(reward.reward_value || 0) / 100);
              }
              appliedPromotions.push(`[${promo.promotion_name}] ${rule.rule_name}`);
            }
          }
        });
      });
    }

    // Basic Mock Logic: If customer is STUDENT -> 10% discount on total.
    if (customer?.occupation === 'STUDENT') {
       const studentDiscount = (item.price * item.quantity) * 0.1;
       itemDiscount += studentDiscount;
       if (!appliedPromotions.includes('Giảm 10% Khách hàng Học sinh / Sinh viên')) {
         appliedPromotions.push('Giảm 10% Khách hàng Học sinh / Sinh viên');
       }
    }
    
    totalDiscount += itemDiscount;

    return {
      ...item,
      discount_amount: itemDiscount,
      final_price: item.price - (itemDiscount / item.quantity)
    };
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
