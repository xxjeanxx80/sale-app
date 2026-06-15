'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getCombos(search = '') {
  try {
    const combos = await prisma.combos.findMany({
      where: {
        is_active: true,
        combo_name: { contains: search }
      },
      orderBy: { id: 'desc' }
    });
    // Convert decimal to number for NextJS
    return combos.map((c: any) => ({
      ...c,
      combo_price: Number(c.combo_price),
      original_total_price: Number(c.original_total_price)
    }));
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
        allow_extra_rules: data.allow_extra_rules ?? false,
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
        allow_extra_rules: data.allow_extra_rules,
        max_slots: data.max_slots,
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
