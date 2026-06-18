'use server';

import prisma from '@/lib/db';

export async function getServices(page = 1, pageSize = 20, search = '', categoryId?: number) {
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    let whereClause: any = {};
    if (search) {
      const terms = search.trim().split(/\s+/).filter(t => t.length > 0);
      if (terms.length > 0) {
        whereClause = {
          AND: terms.map(term => ({
            OR: [
              { item_name: { contains: term } },
              { item_code: { contains: term } },
            ]
          }))
        };
      }
    }

    if (categoryId && categoryId > 0) {
      // Find direct subcategories to include their services as well
      const subCats = await prisma.service_categories.findMany({
        where: { parent_id: categoryId },
        select: { id: true }
      });
      const catIds = [categoryId, ...subCats.map(c => c.id)];
      whereClause.category_id = { in: catIds };
    }

    const [services, totalCount] = await Promise.all([
      prisma.services.findMany({
        where: whereClause,
        skip,
        take,
        include: {
          service_categories: {
            include: {
              service_categories: true
            }
          },
          service_prices: {
            where: { is_current: true },
            take: 1,
          },
        },
        orderBy: {
          id: 'desc',
        },
      }),
      prisma.services.count({
        where: whereClause,
      }),
    ]);

    // Convert Decimal values to Number to avoid Next.js Server Component serialization error
    const serializedServices = services.map(service => ({
      ...service,
      service_prices: service.service_prices.map(price => ({
        ...price,
        base_price: Number(price.base_price),
      }))
    }));

    return {
      services: JSON.parse(JSON.stringify(serializedServices)),
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching services:', error);
    throw new Error('Failed to fetch services');
  }
}

export async function createService(data: { item_code: string; item_name: string; category_id: number; base_price: number; is_active: boolean; unit?: string }) {
  try {
    const service = await prisma.services.create({
      data: {
        item_code: data.item_code,
        item_name: data.item_name,
        unit: data.unit || null,
        category_id: data.category_id,
        is_active: data.is_active,
        service_prices: {
          create: {
            base_price: data.base_price,
            price_type: 'STANDARD',
            effective_date: new Date(),
            is_current: true,
          }
        }
      }
    });
    return { success: true, service };
  } catch (error: any) {
    console.error('Error creating service:', error);
    return { success: false, error: error.message || 'Lỗi khi tạo dịch vụ' };
  }
}

export async function updateService(id: number, data: { item_code: string; item_name: string; category_id: number; base_price: number; is_active: boolean; unit?: string }) {
  try {
    const currentPrice = await prisma.service_prices.findFirst({
      where: { service_id: id, is_current: true }
    });

    const updateData: any = {
      item_code: data.item_code,
      item_name: data.item_name,
      unit: data.unit || null,
      category_id: data.category_id,
      is_active: data.is_active,
      updated_at: new Date()
    };

    if (!currentPrice) {
      updateData.service_prices = {
        create: {
          base_price: data.base_price,
          price_type: 'STANDARD',
          effective_date: new Date(),
          is_current: true,
        }
      };
    } else if (Number(currentPrice.base_price) !== Number(data.base_price)) {
      updateData.service_prices = {
        update: {
          where: { id: currentPrice.id },
          data: { base_price: data.base_price }
        }
      };
    }

    const service = await prisma.services.update({
      where: { id },
      data: updateData
    });

    return { success: true, service };
  } catch (error: any) {
    console.error('Error updating service:', error);
    return { success: false, error: error.message || 'Lỗi khi cập nhật dịch vụ' };
  }
}

export async function deleteService(id: number) {
  try {
    await prisma.services.delete({
      where: { id }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting service:', error);
    return { success: false, error: 'Không thể xóa dịch vụ này vì đã được sử dụng trong hóa đơn.' };
  }
}

