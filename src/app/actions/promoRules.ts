'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rules
export async function createPromoRule(promotion_id: number, data: any) {
  try {
    const rule = await prisma.promo_rules.create({
      data: {
        promotion_id,
        rule_name: data.rule_name,
        is_exclusive_rule: data.is_exclusive_rule ?? false,
        is_stackable_with_others: data.is_stackable_with_others ?? true,
        max_applications: data.max_applications || null,
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error creating promo rule:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePromoRule(id: number, data: any) {
  try {
    const rule = await prisma.promo_rules.update({
      where: { id },
      data: {
        rule_name: data.rule_name,
        is_exclusive_rule: data.is_exclusive_rule ?? false,
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating promo rule:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePromoRule(id: number) {
  try {
    await prisma.promo_rules.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting promo rule:', error);
    return { success: false, error: error.message };
  }
}

// Conditions
export async function addRuleCondition(rule_id: number, data: any) {
  try {
    const condition = await prisma.rule_conditions.create({
      data: {
        rule_id,
        condition_group: data.condition_group || 1,
        criteria_type: data.criteria_type,
        operator: data.operator || 'EQ',
        value_num: data.value_num || null,
        value_num_max: data.value_num_max || null,
        value_text: data.value_text || null,
        target_service_id: data.target_service_id || null,
        target_category_id: data.target_category_id || null,
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error adding condition:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteRuleCondition(id: number) {
  try {
    await prisma.rule_conditions.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting condition:', error);
    return { success: false, error: error.message };
  }
}

// Rewards
export async function addRuleReward(rule_id: number, data: any) {
  try {
    const reward = await prisma.rule_rewards.create({
      data: {
        rule_id,
        reward_type: data.reward_type,
        reward_value: data.reward_value || null,
        target_service_id: data.target_service_id || null,
        gift_description: data.gift_description || null,
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error adding reward:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteRuleReward(id: number) {
  try {
    await prisma.rule_rewards.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting reward:', error);
    return { success: false, error: error.message };
  }
}
