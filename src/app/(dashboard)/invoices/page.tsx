import InvoiceTable from '@/components/custom/InvoiceTable';

export default function InvoicesPage() {
  return (
    <div className="max-w-7xl mx-auto w-full p-6 space-y-6 h-[calc(100vh-4rem)] overflow-y-auto pb-24 md:pb-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
            Quản lý Hóa đơn & Công nợ
          </h1>
          <p className="text-slate-500 mt-1">Theo dõi danh sách hóa đơn, lịch sử thanh toán và thu nợ khách hàng.</p>
        </div>
      </div>

      <InvoiceTable />
    </div>
  );
}
