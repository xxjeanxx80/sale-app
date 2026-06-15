'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to recursively convert Prisma Decimals to Numbers
function serializePrisma(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object') {
    if (typeof obj.toNumber === 'function') {
      return obj.toNumber();
    }
    if (obj instanceof Date) {
      return obj; // Next.js handles Date objects in Server-to-Client props fine
    }
    if (Array.isArray(obj)) {
      return obj.map(serializePrisma);
    }
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = serializePrisma(obj[key]);
    }
    return newObj;
  }
  return obj;
}

export async function getPromotions(page: number = 1, limit: number = 10, search: string = '') {
  try {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    
    if (search) {
      whereClause.promotion_name = { contains: search };
    }

    const [promotions, totalCount] = await Promise.all([
      prisma.promotions.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { promo_rules: true }
          }
        }
      }),
      prisma.promotions.count({ where: whereClause })
    ]);

    return {
      promotions: serializePrisma(promotions),
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    };
  } catch (error) {
    console.error('Error fetching promotions:', error);
    throw new Error('Failed to fetch promotions');
  }
}

export async function getPromotionById(id: number) {
  try {
    const promo = await prisma.promotions.findUnique({
      where: { id },
      include: {
        promo_rules: {
          include: {
            rule_conditions: true,
            rule_rewards: true
          }
        },
        combos: {
          include: {
            combo_items: {
              include: { services: true }
            }
          }
        },
        promotion_branches: {
          include: { branches: true }
        },
        promotion_categories: {
          include: { service_categories: true }
        }
      }
    });
    return serializePrisma(promo);
  } catch (error) {
    console.error('Error fetching promotion by id:', error);
    return null;
  }
}

export async function createPromotion(data: any) {
  try {
    const newPromo = await prisma.promotions.create({
      data: {
        promotion_name: data.promotion_name,
        promotion_type: data.promotion_type,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        applicable_days: data.applicable_days || null,
        max_discount_percent_cap: data.max_discount_percent_cap || null,
        is_stackable: data.is_stackable ?? true,
        description: data.description || null,
        is_active: data.is_active ?? true,
      }
    });
    return { success: true, data: newPromo };
  } catch (error: any) {
    console.error('Error creating promotion:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePromotion(id: number, data: any) {
  try {
    const updateData: any = {
      promotion_name: data.promotion_name,
      promotion_type: data.promotion_type,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      applicable_days: data.applicable_days || null,
      max_discount_percent_cap: data.max_discount_percent_cap || null,
      is_stackable: data.is_stackable ?? true,
      description: data.description || null,
      is_active: data.is_active ?? true,
      updated_at: new Date()
    };

    const updated = await prisma.promotions.update({
      where: { id },
      data: updateData
    });
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error updating promotion:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePromotion(id: number) {
  try {
    await prisma.promotions.delete({
      where: { id }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting promotion:', error);
    return { success: false, error: 'Không thể xóa chương trình khuyến mãi này do đang có dữ liệu liên quan.' };
  }
}

export async function togglePromotionActive(id: number, is_active: boolean) {
  try {
    await prisma.promotions.update({
      where: { id },
      data: { is_active }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling promotion active state:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePromotionBranches(promotion_id: number, branch_ids: number[]) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.promotion_branches.deleteMany({
        where: { promotion_id }
      });
      if (branch_ids.length > 0) {
        await tx.promotion_branches.createMany({
          data: branch_ids.map(branch_id => ({
            promotion_id,
            branch_id
          }))
        });
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating promotion branches:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePromotionCategories(promotion_id: number, category_ids: number[]) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.promotion_categories.deleteMany({
        where: { promotion_id }
      });
      if (category_ids.length > 0) {
        await tx.promotion_categories.createMany({
          data: category_ids.map(category_id => ({
            promotion_id,
            category_id
          }))
        });
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating promotion categories:', error);
    return { success: false, error: error.message };
  }
}
