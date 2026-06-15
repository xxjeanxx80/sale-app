'use server';

import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { invoices_status } from '@prisma/client';

export async function getInvoices(
  page: number = 1,
  pageSize: number = 10,
  search: string = '',
  statusFilter?: invoices_status | 'ALL'
) {
  try {
    const whereClause: Prisma.invoicesWhereInput = {};

    if (search) {
      whereClause.customers = {
        OR: [
          { full_name: { contains: search } },
          { phone_number: { contains: search } }
        ]
      };
    }

    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    const [invoices, totalCount] = await Promise.all([
      prisma.invoices.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          customers: true
        }
      }),
      prisma.invoices.count({ where: whereClause })
    ]);

    // Serialize Decimal for Client
    const serialized = invoices.map(inv => ({
      ...inv,
      total_original_price: Number(inv.total_original_price),
      total_discount: Number(inv.total_discount),
      final_price: Number(inv.final_price),
      amount_paid: Number(inv.amount_paid)
    }));

    return {
      invoices: serialized,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error) {
    console.error('getInvoices error:', error);
    throw new Error('Failed to fetch invoices');
  }
}

export async function getInvoiceDetail(id: number) {
  try {
    const inv = await prisma.invoices.findUnique({
      where: { id },
      include: {
        customers: true,
        invoice_items: {
          include: {
            services: true
          }
        },
        invoice_payments: {
          orderBy: { payment_date: 'asc' }
        }
      }
    });

    if (!inv) return null;

    return {
      ...inv,
      total_original_price: Number(inv.total_original_price),
      total_discount: Number(inv.total_discount),
      final_price: Number(inv.final_price),
      amount_paid: Number(inv.amount_paid),
      invoice_items: inv.invoice_items.map(item => ({
        ...item,
        base_price: Number(item.base_price),
        discount_amount: Number(item.discount_amount),
        final_price: Number(item.final_price)
      })),
      invoice_payments: inv.invoice_payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    };
  } catch (error) {
    console.error('getInvoiceDetail error:', error);
    throw new Error('Failed to fetch invoice detail');
  }
}

export async function addPaymentToInvoice(invoiceId: number, amount: number, paymentMethod: string) {
  try {
    const inv = await prisma.invoices.findUnique({ where: { id: invoiceId } });
    if (!inv) return { success: false, error: 'Không tìm thấy hóa đơn' };

    const currentPaid = Number(inv.amount_paid);
    const finalPrice = Number(inv.final_price);
    const newPaid = currentPaid + amount;

    await prisma.$transaction(async (tx) => {
      // 1. Add payment record
      await tx.invoice_payments.create({
        data: {
          invoice_id: invoiceId,
          amount,
          payment_method: paymentMethod
        }
      });

      // 2. Update invoice status & amount_paid
      await tx.invoices.update({
        where: { id: invoiceId },
        data: {
          amount_paid: newPaid,
          status: newPaid >= finalPrice ? 'PAID' : 'PARTIAL'
        }
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error('addPaymentToInvoice error:', error);
    return { success: false, error: error.message };
  }
}
