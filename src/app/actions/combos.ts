'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getCombos(search = '') {
  try {
    let whereClause: any = { is_active: true };
    if (search) {
      const terms = search.trim().split(/\s+/).filter(t => t.length > 0);
      if (terms.length > 0) {
        whereClause.AND = terms.map(term => ({
          combo_name: { contains: term }
        }));
      }
    }

    const combos = await prisma.combos.findMany({
      where: whereClause,
      orderBy: { id: 'desc' }
    });
    // Convert decimal to number for NextJS
    const mappedCombos = combos.map((c: any) => ({
      ...c,
      combo_price: Number(c.combo_price),
      original_total_price: Number(c.original_total_price)
    }));
    return JSON.parse(JSON.stringify(mappedCombos));
  } catch (error) {
    console.error('Error fetching combos:', error);
    return [];
  }
}

export async function createCombo(promotion_id: number, data: any) {
  try {
    const combo = await prisma.combos.create({
      data: {
        promotion_id,
        combo_name: data.combo_name,
        original_total_price: data.original_total_price,
        combo_price: data.combo_price,
        max_slots: data.max_slots || null,
        is_active: data.is_active ?? true,
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error creating combo:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCombo(id: number, data: any) {
  try {
    const combo = await prisma.combos.update({
      where: { id },
      data: {
        combo_name: data.combo_name,
        original_total_price: data.original_total_price,
        combo_price: data.combo_price,
        max_slots: data.max_slots || null,
        is_active: data.is_active,
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating combo:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteCombo(id: number) {
  try {
    await prisma.combos.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting combo:', error);
    return { success: false, error: error.message };
  }
}

// Combo Items
export async function addComboItem(combo_id: number, service_id: number, quantity: number, allocated_price?: number) {
  try {
    const item = await prisma.combo_items.create({
      data: {
        combo_id,
        service_id,
        quantity,
        allocated_price,
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error adding combo item:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteComboItem(id: number) {
  try {
    await prisma.combo_items.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting combo item:', error);
    return { success: false, error: error.message };
  }
}
