'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string, customerTendered: number) => void;
  finalTotal: number;
  isCheckingOut: boolean;
}

export default function CheckoutModal({ isOpen, onClose, onConfirm, finalTotal, isCheckingOut }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [tenderedAmount, setTenderedAmount] = useState<number | string>('');

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('CASH');
      setTenderedAmount(finalTotal);
    }
  }, [isOpen, finalTotal]);

  const numTendered = typeof tenderedAmount === 'string' ? parseFloat(tenderedAmount.replace(/,/g, '')) || 0 : tenderedAmount;
  const change = numTendered - finalTotal;

  const handleConfirm = () => {
    onConfirm(paymentMethod, numTendered);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thanh toán hóa đơn">
      <div className="space-y-6 py-2">
        {/* Total to pay */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
          <p className="text-slate-500 font-semibold mb-1">Khách cần thanh toán</p>
          <p className="text-4xl font-black text-primary">{formatCurrency(finalTotal)} ₫</p>
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-2">Phương thức thanh toán</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'CASH' 
                  ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">payments</span>
              <span className="text-xs font-semibold">Tiền mặt</span>
            </button>
            <button
              onClick={() => setPaymentMethod('TRANSFER')}
              className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'TRANSFER' 
                  ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
              <span className="text-xs font-semibold">Chuyển khoản</span>
            </button>
            <button
              onClick={() => setPaymentMethod('CARD')}
              className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'CARD' 
                  ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">credit_card</span>
              <span className="text-xs font-semibold">Quẹt thẻ</span>
            </button>
          </div>
        </div>

        {/* Tendered Amount (CASH or TRANSFER) */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700">Tiền khách đưa / cọc</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="w-40 h-10 px-3 text-right rounded-lg border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-800"
                value={tenderedAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setTenderedAmount(raw ? parseInt(raw, 10) : '');
                }}
              />
              <span className="text-slate-500 font-medium">₫</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700">
              {change >= 0 ? 'Tiền thừa trả khách' : 'Còn thiếu (Ghi nợ)'}
            </label>
            <span className={`font-bold text-lg ${change < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatCurrency(Math.abs(change))} ₫
            </span>
          </div>
          
          {/* Quick cash buttons */}
          <div className="flex flex-wrap gap-2 justify-end mt-2">
            {[finalTotal, 500000, 1000000, 2000000, 5000000].map((amount, idx) => (
              <button
                key={idx}
                onClick={() => setTenderedAmount(amount)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary transition-colors"
              >
                {amount === finalTotal ? 'Trả đủ' : formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            disabled={isCheckingOut}
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            disabled={isCheckingOut || numTendered <= 0}
            className={`px-8 py-2.5 rounded-xl text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all ${
              change < 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-primary to-teal-500'
            }`}
          >
            {isCheckingOut ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">
                {change < 0 ? 'handshake' : 'check_circle'}
              </span>
            )}
            {change < 0 ? 'Thanh toán cọc' : 'Hoàn tất thanh toán'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
