'use server';

import prisma from '@/lib/db';
import { employees_role, employees_status } from '@prisma/client';

export async function getEmployees(page = 1, pageSize = 20, search = '') {
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    const whereClause = search
      ? {
          OR: [
            { full_name: { contains: search } },
            { employee_code: { contains: search } },
            { phone_number: { contains: search } }
          ],
        }
      : {};

    const [employees, totalCount] = await Promise.all([
      prisma.employees.findMany({
        where: whereClause,
        include: { branches: true },
        skip,
        take,
        orderBy: { id: 'desc' },
      }),
      prisma.employees.count({ where: whereClause }),
    ]);

    return {
      employees,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error) {
    console.error('Error fetching employees:', error);
    return { employees: [], totalPages: 0, totalCount: 0 };
  }
}

export async function getDoctors() {
  try {
    return await prisma.employees.findMany({
      where: { role: 'DOCTOR', status: 'ACTIVE' },
      orderBy: { full_name: 'asc' }
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

export async function createEmployee(data: {
  employee_code: string;
  full_name: string;
  phone_number?: string;
  role: employees_role;
  branch_id?: number | null;
  status?: employees_status;
}) {
  if (!data.phone_number || !/^(0)[0-9]{9}$/.test(data.phone_number)) {
    return { success: false, error: 'Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có đúng 10 chữ số.' };
  }

  try {
    const existingPhone = await prisma.employees.findFirst({
      where: { phone_number: data.phone_number }
    });
    if (existingPhone) {
      return { success: false, error: 'Số điện thoại này đã được sử dụng cho nhân viên khác!' };
    }

    const employee = await prisma.employees.create({ data });
    return { success: true, employee };
  } catch (error: any) {
    console.error('Error creating employee:', error);
    if (error.code === 'P2002') return { success: false, error: 'Mã nhân viên đã tồn tại!' };
    return { success: false, error: error.message };
  }
}

export async function updateEmployee(
  id: number,
  data: {
    employee_code: string;
    full_name: string;
    phone_number?: string;
    role: employees_role;
    branch_id?: number | null;
    status?: employees_status;
  }
) {
  if (!data.phone_number || !/^(0)[0-9]{9}$/.test(data.phone_number)) {
    return { success: false, error: 'Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có đúng 10 chữ số.' };
  }

  try {
    const existingPhone = await prisma.employees.findFirst({
      where: { 
        phone_number: data.phone_number,
        id: { not: id }
      }
    });
    if (existingPhone) {
      return { success: false, error: 'Số điện thoại này đã được sử dụng cho nhân viên khác!' };
    }

    const employee = await prisma.employees.update({
      where: { id },
      data,
    });
    return { success: true, employee };
  } catch (error: any) {
    console.error('Error updating employee:', error);
    if (error.code === 'P2002') return { success: false, error: 'Mã nhân viên đã tồn tại!' };
    return { success: false, error: error.message };
  }
}

export async function deleteEmployee(id: number) {
  try {
    await prisma.employees.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return { success: false, error: 'Không thể xóa nhân viên do có dữ liệu liên kết (ví dụ: hóa đơn).' };
  }
}
