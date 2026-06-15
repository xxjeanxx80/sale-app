'use server';

import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function getAppointments(date: Date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointments.findMany({
      where: {
        appointment_time: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        customers: true,
        services: true,
        employees: true
      },
      orderBy: {
        appointment_time: 'asc'
      }
    });

    return appointments;
  } catch (error) {
    console.error('getAppointments error:', error);
    throw new Error('Failed to fetch appointments');
  }
}

export async function createAppointment(data: {
  customerId: number;
  serviceId?: number;
  employeeId?: number;
  appointmentTime: Date;
  notes?: string;
}) {
  try {
    const appt = await prisma.appointments.create({
      data: {
        customer_id: data.customerId,
        service_id: data.serviceId || null,
        employee_id: data.employeeId || null,
        appointment_time: data.appointmentTime,
        status: 'SCHEDULED',
        notes: data.notes
      }
    });
    return { success: true, appointment: appt };
  } catch (error: any) {
    console.error('createAppointment error:', error);
    return { success: false, error: error.message };
  }
}
