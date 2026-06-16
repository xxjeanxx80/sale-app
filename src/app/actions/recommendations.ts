'use server';

import prisma from '@/lib/db';

export interface Recommendation {
  id: string;
  type: 'UPSELL' | 'CROSS_SELL' | 'PROMO';
  title: string;
  message: string;
  actionText?: string;
  suggestedServiceId?: number;
}

export async function getRecommendations(cartItems: any[], currentTotalAfterSpecific: number): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  if (!cartItems || cartItems.length === 0) return recommendations;

  const subTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  try {
    // 1. CHEAPER ALTERNATIVES (Downsell/Cross-sell in same category)
    const serviceIds = cartItems.filter(i => i.type === 'SERVICE').map(i => i.id);
    
    if (serviceIds.length > 0) {
      const cartServices = await prisma.services.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, item_name: true, category_id: true }
      });

      for (const cartSvc of cartServices) {
        const itemInCart = cartItems.find(i => i.id === cartSvc.id && i.type === 'SERVICE');
        if (!itemInCart) continue;

        // Find cheaper services in the same category
        const alternatives = await prisma.services.findMany({
          where: {
            category_id: cartSvc.category_id,
            is_active: true,
            id: { not: cartSvc.id }
          },
          include: {
            service_prices: {
              where: { is_current: true }
            }
          }
        });

        const cheaperAlts = alternatives.filter(alt => {
          const price = alt.service_prices[0]?.base_price ? Number(alt.service_prices[0].base_price) : 0;
          return price > 0 && price < itemInCart.price;
        });

        // Add max 1 cheaper alt per cart item to avoid spam
        if (cheaperAlts.length > 0) {
          // Sort by price descending (closest to current price)
          cheaperAlts.sort((a, b) => Number(b.service_prices[0].base_price) - Number(a.service_prices[0].base_price));
          const alt = cheaperAlts[0];
          const altPrice = Number(alt.service_prices[0].base_price);
          
          recommendations.push({
            id: `alt_${cartSvc.id}_${alt.id}`,
            type: 'UPSELL', // using UPSELL icon for alternatives
            title: 'Dịch vụ cùng danh mục',
            message: `Thay vì "${cartSvc.item_name}", bạn có thể tham khảo "${alt.item_name}" với giá rẻ hơn (${altPrice.toLocaleString()}đ).`,
            suggestedServiceId: alt.id
          });
        }
      }
    }

    // 2. PROMOTION CROSS-SELL
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

    for (const promo of activePromos) {
      for (const rule of promo.promo_rules) {
        if (!rule.rule_conditions || rule.rule_conditions.length === 0) continue;

        // Group conditions by condition_group
        const groupedConditions = rule.rule_conditions.reduce((acc: any, cond: any) => {
          const group = cond.condition_group || 1;
          if (!acc[group]) acc[group] = [];
          acc[group].push(cond);
          return acc;
        }, {});

        for (const groupKey of Object.keys(groupedConditions)) {
          const conditions = groupedConditions[groupKey];
          
          let metConditions = 0;
          let unmetConditions: any[] = [];

          for (const cond of conditions) {
            let isMet = false;
            if (cond.criteria_type === 'SERVICE_SELECTED') {
              isMet = cartItems.some(i => i.id === cond.target_service_id && i.type === 'SERVICE');
            } else if (cond.criteria_type === 'TOTAL_BILL') {
              isMet = currentTotalAfterSpecific >= Number(cond.value_num || 0);
            } else if (cond.criteria_type === 'COMBINED_SERVICE_VALUE') {
              const serviceSelectedCond = conditions.find((c: any) => c.criteria_type === 'SERVICE_SELECTED');
              if (serviceSelectedCond) {
                let otherTotal = 0;
                cartItems.forEach(cartItem => {
                  if (cartItem.id !== serviceSelectedCond.target_service_id) {
                     otherTotal += cartItem.price * cartItem.quantity;
                  }
                });
                isMet = otherTotal >= Number(cond.value_num || 0);
              } else {
                isMet = false;
              }
            } else {
               isMet = true; 
            }

            if (isMet) metConditions++;
            else unmetConditions.push(cond);
          }

          // Case 1: Single condition rule (e.g. Global rule with TOTAL_BILL)
          if (conditions.length === 1 && unmetConditions.length === 1 && subTotal > 0) {
            const missing = unmetConditions[0];
            const reward = rule.rule_rewards[0];
            let rewardText = '';
            if (reward) {
               if (reward.reward_type === 'DISCOUNT_FIXED' || reward.reward_type === 'FIXED_PRICE' || reward.reward_type === 'FIXED_PRICE_PER_ITEM') {
                   rewardText = `giảm ${Number(reward.reward_value).toLocaleString()}đ`;
               } else if (reward.reward_type === 'DISCOUNT_PERCENT') {
                   rewardText = `giảm ${reward.reward_value}%`;
               } else {
                   rewardText = `nhận ${reward.gift_description || 'quà tặng'}`;
               }
            }

            if (missing.criteria_type === 'TOTAL_BILL') {
               const target = Number(missing.value_num || 0);
               const diff = target - currentTotalAfterSpecific;
               // Only suggest if they have something in cart and difference is less than the whole target (e.g., they made some progress)
               if (diff > 0 && diff < target) {
                 if (!recommendations.some(r => r.id.includes('missing_total'))) {
                   recommendations.push({
                     id: `promo_${rule.id}_missing_total_global`,
                     type: 'PROMO',
                     title: `Gợi ý nâng hạng Bill: ${promo.promotion_name}`,
                     message: `Chỉ cần mua thêm ${diff.toLocaleString()}đ nữa để được ${rewardText}!`
                   });
                 }
               }
            }
          }
          
          // Case 2: Multi-condition cross-sell (e.g. Mũi + Dịch vụ khác >= 5tr)
          if (conditions.length > 1 && metConditions > 0 && unmetConditions.length === 1) {
            const missing = unmetConditions[0];
            const reward = rule.rule_rewards[0];
            let rewardText = '';
            
            if (reward) {
               if (reward.reward_type === 'DISCOUNT_FIXED' || reward.reward_type === 'FIXED_PRICE' || reward.reward_type === 'FIXED_PRICE_PER_ITEM') {
                   rewardText = `giảm ${Number(reward.reward_value).toLocaleString()}đ`;
               } else if (reward.reward_type === 'DISCOUNT_PERCENT') {
                   rewardText = `giảm ${reward.reward_value}%`;
               } else {
                   rewardText = `nhận ${reward.gift_description || 'quà tặng'}`;
               }
            }

            if (missing.criteria_type === 'COMBINED_SERVICE_VALUE') {
               const target = Number(missing.value_num || 0);
               recommendations.push({
                 id: `promo_${rule.id}_missing_combined`,
                 type: 'PROMO',
                 title: `Gợi ý mua kèm: ${promo.promotion_name}`,
                 message: `Chỉ cần mua thêm dịch vụ khác để đạt tổng ${target.toLocaleString()}đ, bạn sẽ được ${rewardText}!`
               });
            } else if (missing.criteria_type === 'SERVICE_SELECTED') {
               // We need to fetch service name inside a Promise.all or similar, but since we are in a loop we can await directly.
               // It's ok since it's limited to active promos
            } else if (missing.criteria_type === 'TOTAL_BILL') {
               const target = Number(missing.value_num || 0);
               const diff = target - currentTotalAfterSpecific;
               if (diff > 0) {
                 if (!recommendations.some(r => r.id.includes('missing_total'))) {
                   recommendations.push({
                     id: `promo_${rule.id}_missing_total`,
                     type: 'PROMO',
                     title: `Gợi ý mua kèm: ${promo.promotion_name}`,
                     message: `Chỉ cần mua thêm ${diff.toLocaleString()}đ nữa để được ${rewardText}!`
                   });
                 }
               }
            }
          }
        }
      }
    }

    const finalRecs = recommendations;
    
    // Fill in missing service names
    for (const rec of finalRecs) {
       if (rec.id.includes('missing_svc')) {
          const ruleIdMatch = rec.id.match(/promo_(\d+)_missing_svc/);
          if (ruleIdMatch) {
             const rId = Number(ruleIdMatch[1]);
             const promo = activePromos.find(p => p.promo_rules.some(r => r.id === rId));
             const rule = promo?.promo_rules.find(r => r.id === rId);
             const svcCond = rule?.rule_conditions.find(c => c.criteria_type === 'SERVICE_SELECTED');
             if (svcCond && svcCond.target_service_id) {
                const svc = await prisma.services.findUnique({ where: { id: svcCond.target_service_id } });
                if (svc) {
                   rec.message = `Mua kèm "${svc.item_name}" để được nhận phần thưởng!`;
                }
             }
          }
       }
    }
    
    return finalRecs;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}
