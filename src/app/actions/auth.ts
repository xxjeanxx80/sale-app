'use server';

import prisma from '@/lib/db';

export async function loginWithPhone(phone: string) {
  try {
    if (!phone || phone.trim() === '') {
      return { success: false, message: 'Vui lòng nhập số điện thoại' };
    }

    const employee = await prisma.employees.findFirst({
      where: { phone_number: phone.trim() }
    });

    if (!employee) {
      return { success: false, message: 'Số điện thoại không tồn tại trong hệ thống nhân sự' };
    }

    if (employee.status !== 'ACTIVE') {
      return { success: false, message: 'Tài khoản của bạn đã bị vô hiệu hóa' };
    }

    if (employee.role !== 'CONSULTANT') {
      return { success: false, message: 'Chỉ nhân viên Sales (Tư vấn viên) mới có quyền truy cập trang này' };
    }

    return { 
      success: true, 
      user: {
        id: employee.id,
        full_name: employee.full_name,
        phone_number: employee.phone_number,
        role: employee.role,
        branch_id: employee.branch_id
      } 
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: 'Đã xảy ra lỗi hệ thống, vui lòng thử lại' };
  }
}
