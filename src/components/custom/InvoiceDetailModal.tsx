'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { getInvoiceDetail, addPaymentToInvoice } from '@/app/actions/invoices';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number | null;
  onPaymentSuccess: () => void;
}

export default function InvoiceDetailModal({ isOpen, onClose, invoiceId, onPaymentSuccess }: InvoiceDetailModalProps) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [isPaying, setIsPaying] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchDetail();
    } else {
      setInvoice(null);
      setIsPaying(false);
    }
  }, [isOpen, invoiceId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await getInvoiceDetail(invoiceId!);
      setInvoice(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);
  const formatDate = (d: Date | string) => new Date(d).toLocaleString('vi-VN');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">ĐÃ THANH TOÁN</span>;
      case 'PARTIAL': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-bold">ĐANG NỢ</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold">ĐÃ HỦY</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">{status}</span>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch(method) {
      case 'CASH': return 'Tiền mặt';
      case 'TRANSFER': return 'Chuyển khoản';
      case 'CARD': return 'Quẹt thẻ';
      default: return method;
    }
  };

  const handlePay = async () => {
    const amount = typeof paymentAmount === 'string' ? parseFloat(paymentAmount.replace(/,/g, '')) || 0 : paymentAmount;
    if (amount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await addPaymentToInvoice(invoiceId!, amount, paymentMethod);
      if (res.success) {
        setIsPaying(false);
        fetchDetail();
        onPaymentSuccess();
        alert("Thanh toán thành công!");
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết Hóa đơn #${invoiceId}`}>
      {loading || !invoice ? (
        <div className="py-20 flex justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm text-slate-500 mb-1">Khách hàng</p>
              <p className="font-semibold text-slate-800">{invoice.customers?.full_name}</p>
              <p className="text-sm text-slate-600">{invoice.customers?.phone_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Ngày tạo</p>
              <p className="font-semibold text-slate-800">{formatDate(invoice.created_at)}</p>
              <div className="mt-1">{getStatusBadge(invoice.status)}</div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">medical_services</span>
              Chi tiết Dịch vụ
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Tên dịch vụ</th>
                    <th className="px-4 py-3 text-center">SL</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.invoice_items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.services?.item_name || 'Dịch vụ'}</td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.base_price)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(item.final_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              Lịch sử Thanh toán
            </h3>
            {invoice.invoice_payments.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Chưa có giao dịch thanh toán nào.</p>
            ) : (
              <div className="space-y-2">
                {invoice.invoice_payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg bg-white">
                    <div>
                      <p className="font-semibold text-slate-800">{formatCurrency(p.amount)} ₫</p>
                      <p className="text-xs text-slate-500">{formatDate(p.payment_date)}</p>
                    </div>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                      {getPaymentMethodLabel(p.payment_method)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="bg-primary/5 p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Tổng tiền:</span>
              <span className="font-semibold">{formatCurrency(invoice.final_price)} ₫</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Đã thanh toán:</span>
              <span className="font-semibold">{formatCurrency(invoice.amount_paid)} ₫</span>
            </div>
            <div className="h-px bg-primary/10 my-2"></div>
            <div className="flex justify-between text-red-500 font-bold text-lg">
              <span>Còn nợ:</span>
              <span>{formatCurrency(Math.max(0, invoice.final_price - invoice.amount_paid))} ₫</span>
            </div>
          </div>

          {/* Pay Remaining Action */}
          {invoice.status === 'PARTIAL' && (
            <div className="pt-4 border-t border-slate-100">
              {!isPaying ? (
                <button 
                  onClick={() => {
                    setIsPaying(true);
                    setPaymentAmount(Math.max(0, invoice.final_price - invoice.amount_paid));
                  }}
                  className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold shadow-md hover:bg-amber-600 transition-colors flex justify-center items-center gap-2"
                >
                  <span className="material-symbols-outlined">payments</span>
                  Thanh toán công nợ
                </button>
              ) : (
                <div className="space-y-4 bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-2">Thanh toán nợ</h4>
                  
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Phương thức</label>
                    <select 
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 outline-none focus:border-amber-500"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                      <option value="CASH">Tiền mặt</option>
                      <option value="TRANSFER">Chuyển khoản</option>
                      <option value="CARD">Quẹt thẻ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Số tiền khách đưa</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 h-10 px-3 text-right rounded-lg border border-slate-300 outline-none focus:border-amber-500 font-bold"
                        value={paymentAmount}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setPaymentAmount(raw ? parseInt(raw, 10) : '');
                        }}
                      />
                      <span className="font-semibold text-slate-600">₫</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => setIsPaying(false)}
                      className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={handlePay}
                      disabled={submitting}
                      className="flex-1 py-2 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 disabled:opacity-50"
                    >
                      {submitting ? 'Đang xử lý...' : 'Xác nhận thu tiền'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
