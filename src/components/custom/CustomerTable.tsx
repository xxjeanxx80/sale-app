'use client';

import { useState, useEffect } from 'react';
import { getCustomers, deleteCustomer } from '@/app/actions/customers';
import CustomerModal from './CustomerModal';

export default function CustomerTable() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const data = await getCustomers(page, 15, search);
        setCustomers(data.customers);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, page, refreshKey]);

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      const res = await deleteCustomer(id);
      if (res.success) {
        setRefreshKey(k => k + 1);
      } else {
        alert(res.error);
      }
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      'NEW': 'bg-blue-100 text-blue-700',
      'REGULAR': 'bg-emerald-100 text-emerald-700',
      'VIP': 'bg-amber-100 text-amber-700'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const getTypeName = (type: string) => {
    const names: any = {
      'NEW': 'Khách mới',
      'REGULAR': 'Khách quen',
      'VIP': 'Khách VIP'
    };
    return names[type] || type;
  };

  const formatGender = (gender: string) => {
    if (gender === 'MALE') return 'Nam';
    if (gender === 'FEMALE') return 'Nữ';
    return 'Khác';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatOccupation = (occ: string) => {
    const names: any = {
      'STUDENT': 'Học sinh / Sinh viên',
      'WORKING': 'Người đi làm',
      'FREELANCER': 'Tự do',
      'OTHER': 'Khác'
    };
    return names[occ] || occ || '—';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Danh sách Khách Hàng</h3>
        <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              className="h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium text-slate-700 w-full transition-all outline-none"
              placeholder="Tìm tên, SĐT..."
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button onClick={handleAdd} className="bg-gradient-to-r from-primary to-teal-500 text-white rounded-xl px-4 h-10 font-medium text-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow shrink-0">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Thêm Mới</span>
          </button>
        </div>
      </div>

      {/* Mobile Card View (Hybrid Layout) */}
      <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-3xl text-slate-300">person_off</span>
            </div>
            <div className="text-sm font-medium">Không tìm thấy khách hàng nào.</div>
          </div>
        ) : (
          customers.map((cus) => (
            <div key={cus.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative overflow-hidden">
              {/* Highlight bar base on type */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${cus.customer_type === 'VIP' ? 'bg-amber-500' : cus.customer_type === 'NEW' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
              
              <div className="flex justify-between items-start pl-2">
                <div>
                  <div className="font-bold text-slate-800 text-base">{cus.full_name}</div>
                  <div className="text-sm text-primary font-bold mt-0.5">{cus.phone_number || 'Chưa cập nhật SĐT'}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => handleEdit(cus)} className="w-8 h-8 rounded-lg text-slate-600 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors border border-slate-100 bg-slate-50">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button onClick={() => handleDelete(cus.id)} className="w-8 h-8 rounded-lg text-slate-600 hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors border border-slate-100 bg-slate-50">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pl-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${getTypeColor(cus.customer_type)}`}>
                  {getTypeName(cus.customer_type)}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                  <span className="material-symbols-outlined text-[14px] mr-1">wc</span>
                  {formatGender(cus.gender)}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                  <span className="material-symbols-outlined text-[14px] mr-1">cake</span>
                  {formatDate(cus.date_of_birth)}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                  <span className="material-symbols-outlined text-[14px] mr-1">work</span>
                  {formatOccupation(cus.occupation)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-label-md">
              <th className="px-6 py-4 font-semibold text-sm">Họ và tên</th>
              <th className="px-6 py-4 font-semibold text-sm">Số điện thoại</th>
              <th className="px-6 py-4 font-semibold text-sm">Giới tính</th>
              <th className="px-6 py-4 font-semibold text-sm">Ngày sinh</th>
              <th className="px-6 py-4 font-semibold text-sm">Nghề nghiệp</th>
              <th className="px-6 py-4 font-semibold text-sm">Phân loại</th>
              <th className="px-6 py-4 font-semibold text-sm text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-3xl text-slate-300">person_off</span>
                    </div>
                    Không tìm thấy khách hàng nào.
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((cus) => (
                <tr key={cus.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{cus.full_name}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium text-sm">{cus.phone_number || '—'}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{formatGender(cus.gender)}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(cus.date_of_birth)}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{formatOccupation(cus.occupation)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getTypeColor(cus.customer_type)}`}>
                      {getTypeName(cus.customer_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(cus)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors border border-transparent hover:border-primary/20">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(cus.id)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors border border-transparent hover:border-error/20">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center gap-1 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          Trước
        </button>
        <span className="text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          Trang <span className="text-primary font-bold">{page}</span> / {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading}
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center gap-1 shadow-sm"
        >
          Sau
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>

      <CustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        customer={editingCustomer} 
        onSuccess={() => setRefreshKey(k => k + 1)} 
      />
    </div>
  );
}
