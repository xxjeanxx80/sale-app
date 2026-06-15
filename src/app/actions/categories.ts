'use server';

import prisma from '@/lib/db';

export async function getCategories(page = 1, pageSize = 20, search = '') {
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    const whereClause = search
      ? {
          OR: [
            { category_name: { contains: search } },
            { category_code: { contains: search } },
          ],
        }
      : {};

    const [categories, totalCount] = await Promise.all([
      prisma.service_categories.findMany({
        where: whereClause,
        skip,
        take,
        include: {
          _count: {
            select: { services: true }
          }
        },
        orderBy: {
          category_level: 'asc', // Display top-level categories first
        },
      }),
      prisma.service_categories.count({
        where: whereClause,
      }),
    ]);

    return {
      categories,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }
}

export async function getAllCategoriesMin() {
  try {
    const categories = await prisma.service_categories.findMany({
      select: {
        id: true,
        category_name: true,
        parent_id: true,
        category_level: true,
      },
      orderBy: [
        { category_level: 'asc' },
        { category_name: 'asc' }
      ]
    });

    // Build full path names for categories (e.g., "Root -> Child -> SubChild")
    const categoryMap = new Map();
    categories.forEach(c => categoryMap.set(c.id, c));

    const formattedCategories = categories.map(c => {
      let current = c;
      let path = [];
      while (current) {
        path.unshift(current.category_name);
        current = current.parent_id ? categoryMap.get(current.parent_id) : null;
      }
      return {
        id: c.id,
        category_name: path.join(' / '),
        level: c.category_level,
        parent_id: c.parent_id
      };
    });

    // Sort by the new full path name for better alphabetical grouping
    formattedCategories.sort((a, b) => a.category_name.localeCompare(b.category_name));

    return formattedCategories;
  } catch (error) {
    console.error('Error fetching min categories:', error);
    return [];
  }
}

export async function createCategory(data: { category_name: string; category_code: string; parent_id?: number | null; category_level: number }) {
  try {
    const category = await prisma.service_categories.create({
      data: {
        category_name: data.category_name,
        category_code: data.category_code,
        parent_id: data.parent_id || null,
        category_level: data.category_level,
      }
    });
    return { success: true, category };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { success: false, error: error.message || 'Lỗi khi tạo danh mục' };
  }
}

export async function updateCategory(id: number, data: { category_name: string; category_code: string; parent_id?: number | null; category_level: number }) {
  try {
    const category = await prisma.service_categories.update({
      where: { id },
      data: {
        category_name: data.category_name,
        category_code: data.category_code,
        parent_id: data.parent_id || null,
        category_level: data.category_level,
      }
    });
    return { success: true, category };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message || 'Lỗi khi cập nhật danh mục' };
  }
}

export async function deleteCategory(id: number) {
  try {
    await prisma.service_categories.delete({
      where: { id }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Không thể xóa danh mục này vì đang được sử dụng hoặc có chứa dịch vụ.' };
  }
}

export async function getCategoriesTree() {
  try {
    const categories = await prisma.service_categories.findMany({
      orderBy: [
        { category_level: 'asc' },
        { category_name: 'asc' }
      ],
      include: {
        _count: {
          select: { services: true }
        }
      }
    });
    
    const tree: any[] = [];
    const map = new Map();
    
    categories.forEach((cat: any) => {
      map.set(cat.id, { ...cat, children: [] });
    });
    
    categories.forEach((cat: any) => {
      const node = map.get(cat.id);
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id).children.push(node);
      } else {
        tree.push(node);
      }
    });
    
    const calculateTotalServices = (node: any) => {
      let total = node._count?.services || 0;
      for (const child of node.children) {
        total += calculateTotalServices(child);
      }
      node.total_services = total;
      return total;
    };
    
    tree.forEach(calculateTotalServices);
    
    return tree;
  } catch (error) {
    console.error('Error fetching categories tree:', error);
    return [];
  }
}


