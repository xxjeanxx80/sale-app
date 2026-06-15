'use server';

import prisma from '@/lib/db';
import { customers_gender } from '@prisma/client';

export async function getCustomers(page = 1, pageSize = 20, search = '') {
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    const whereClause = search
      ? {
          OR: [
            { full_name: { contains: search } },
            { phone_number: { contains: search } },
          ],
        }
      : {};

    const [customers, totalCount] = await Promise.all([
      prisma.customers.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { id: 'desc' },
      }),
      prisma.customers.count({ where: whereClause }),
    ]);

    return {
      customers,
      totalPages: Math.ceil(totalCount / pageSize),
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return { customers: [], totalPages: 0, totalCount: 0 };
  }
}

export async function createCustomer(data: {
  full_name: string;
  phone_number?: string;
  date_of_birth?: Date | null;
  gender?: customers_gender | null;
  occupation?: string;
  customer_type?: string;
}) {
  if (data.phone_number && !/^(0)[0-9]{9}$/.test(data.phone_number)) {
    return { success: false, error: 'Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có đúng 10 chữ số.' };
  }

  try {
    if (data.phone_number) {
      const existing = await prisma.customers.findFirst({
        where: { phone_number: data.phone_number }
      });
      if (existing) {
        return { success: false, error: 'Số điện thoại này đã được đăng ký cho khách hàng khác!' };
      }
    }

    const customer = await prisma.customers.create({ data });
    return { success: true, customer };
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCustomer(
  id: number,
  data: {
    full_name: string;
    phone_number?: string;
    date_of_birth?: Date | null;
    gender?: customers_gender | null;
    occupation?: string;
    customer_type?: string;
  }
) {
  if (data.phone_number && !/^(0)[0-9]{9}$/.test(data.phone_number)) {
    return { success: false, error: 'Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có đúng 10 chữ số.' };
  }

  try {
    if (data.phone_number) {
      const existing = await prisma.customers.findFirst({
        where: { 
          phone_number: data.phone_number,
          id: { not: id }
        }
      });
      if (existing) {
        return { success: false, error: 'Số điện thoại này đã được đăng ký cho khách hàng khác!' };
      }
    }

    const customer = await prisma.customers.update({
      where: { id },
      data,
    });
    return { success: true, customer };
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteCustomer(id: number) {
  try {
    await prisma.customers.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return { success: false, error: 'Không thể xóa khách hàng do có hóa đơn hoặc dữ liệu liên kết.' };
  }
}
