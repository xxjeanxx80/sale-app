'use server';

import prisma from '@/lib/db';

export async function getBranches() {
  try {
    const branches = await prisma.branches.findMany({
      orderBy: { branch_name: 'asc' }
    });
    return branches;
  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
}

export async function createBranch(data: { branch_code: string, branch_name: string, address?: string, is_active?: boolean }) {
  try {
    const branch = await prisma.branches.create({ data });
    return { success: true, branch };
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return { success: false, error: error.message };
  }
}

export async function updateBranch(id: number, data: { branch_code: string, branch_name: string, address?: string, is_active?: boolean }) {
  try {
    const branch = await prisma.branches.update({
      where: { id },
      data
    });
    return { success: true, branch };
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteBranch(id: number) {
  try {
    await prisma.branches.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return { success: false, error: 'Không thể xóa chi nhánh này vì đang có dữ liệu liên kết.' };
  }
}

export async function toggleBranchActive(id: number, is_active: boolean) {
  try {
    const branch = await prisma.branches.update({
      where: { id },
      data: { is_active }
    });
    return { success: true, branch };
  } catch (error: any) {
    console.error('Error toggling branch active state:', error);
    return { success: false, error: error.message };
  }
}
