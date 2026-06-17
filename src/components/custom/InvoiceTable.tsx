'use client';

import { useState, useEffect } from 'react';
import { getInvoices } from '@/app/actions/invoices';
import InvoiceDetailModal from './InvoiceDetailModal';

export default function InvoiceTable() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getInvoices(page, 10, search, statusFilter as any);
      setInvoices(res.invoices);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchList, 300);
    return () => clearTimeout(timer);
  }, [page, search, statusFilter]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);
  const formatDate = (d: Date | string) => new Date(d).toLocaleDateString('vi-VN');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">ĐÃ THANH TOÁN</span>;
      case 'PARTIAL': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-bold">ĐANG NỢ</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold">ĐÃ HỦY</span>;
      case 'DRAFT': return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">NHÁP</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            placeholder="Tìm theo tên hoặc SĐT khách..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Trạng thái:</label>
          <select 
            className="h-10 px-3 rounded-xl border border-slate-300 outline-none focus:border-primary text-sm font-semibold"
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả</option>
            <option value="PAID">Đã thanh toán đủ</option>
            <option value="PARTIAL">Khách đang nợ (Cọc)</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Unified Grid View (1-2-3 Columns) */}
      <div className="p-4 md:p-6 bg-slate-50/50 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-medium">Không tìm thấy hóa đơn nào</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {invoices.map(inv => (
              <div 
                key={inv.id} 
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 hover:shadow-md hover:border-primary/40 cursor-pointer transition-all active:scale-[0.98] group" 
                onClick={() => setSelectedInvoiceId(inv.id)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 text-base mb-1 group-hover:text-primary transition-colors">#{inv.id} - {inv.customers?.full_name}</div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">call</span>
                      {inv.customers?.phone_number}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {formatDate(inv.created_at)}
                    </div>
                  </div>
                  <div className="shrink-0">{getStatusBadge(inv.status)}</div>
                </div>
                
                <div className="flex justify-between items-end border-t border-slate-100 pt-3 mt-auto">
                  <div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Tổng tiền</div>
                    <div className="font-bold text-slate-800 text-base">{formatCurrency(inv.final_price)} ₫</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Đã thanh toán</div>
                    <div className={`font-bold text-base ${inv.amount_paid < inv.final_price ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {formatCurrency(inv.amount_paid)} ₫
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
        <span className="text-sm text-slate-600">
          Tổng cộng <span className="font-bold">{totalCount}</span> hóa đơn
        </span>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"
          >
            Trang trước
          </button>
          <button 
            disabled={invoices.length < 10}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      </div>

      <InvoiceDetailModal 
        isOpen={!!selectedInvoiceId}
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        onPaymentSuccess={fetchList}
      />
    </div>
  );
}
