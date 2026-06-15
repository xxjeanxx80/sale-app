'use client';

import { useState, useEffect } from 'react';
import { getServices, deleteService } from '@/app/actions/services';
import { getAllCategoriesMin } from '@/app/actions/categories';
import ServiceModal from './ServiceModal';
import SearchableSelect from './SearchableSelect';

export default function ServiceTable() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<{id: number, category_name: string}[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const cats = await getAllCategoriesMin();
      setCategories(cats);
    };
    fetchInitialData();
  }, [refreshKey]); // Refresh categories too if needed

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const data = await getServices(page, 15, search, categoryId);
        setServices(data.services);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchServices, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, page, categoryId, refreshKey]);

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      const res = await deleteService(id);
      if (res.success) {
        setRefreshKey(k => k + 1);
      } else {
        alert(res.error);
      }
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
      {/* Table Header/Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <SearchableSelect
              options={[{ value: 0, label: 'Tất cả Danh mục' }, ...categories.map(c => ({ value: c.id, label: c.category_name }))]}
              value={categoryId}
              onChange={(val) => {
                setCategoryId(Number(val));
                setPage(1);
              }}
              placeholder="Chọn Danh mục"
            />
          </div>
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-lg">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
              placeholder="Tìm theo tên hoặc mã..."
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="font-label-sm text-label-sm text-on-surface-variant hidden sm:block">
            Trang {page} / {totalPages}
          </div>
          <button onClick={handleAdd} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg px-4 h-10 font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow shrink-0 w-full sm:w-auto">
            <span className="material-symbols-outlined text-lg">add</span>
            Thêm Mới
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Mã HIS</th>
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Tên Dịch Vụ</th>
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Giá tiền</th>
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider hidden sm:table-cell">Nhóm</th>
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-right">Trạng Thái</th>
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-6 px-6 text-center text-on-surface-variant">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 px-6 text-center text-on-surface-variant">
                  Không tìm thấy dịch vụ nào.
                </td>
              </tr>
            ) : (
              services.map((service) => {
                const price = service.service_prices?.[0]?.base_price || 0;
                return (
                  <tr key={service.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant font-medium">
                      {service.item_code}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-label-md text-label-md text-on-background font-semibold">{service.item_name}</div>
                    </td>
                    <td className="py-4 px-6 font-label-md text-label-md text-primary font-semibold">
                      {Number(price).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        {service.service_categories?.category_name || service.service_group_code}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {service.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">Khóa</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(service)} className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-lowest shadow-sm border border-transparent hover:border-outline-variant/20">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(service.id)} className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-error-container/50 shadow-sm border border-transparent hover:border-error/20">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
          Trước
        </button>
        <span className="text-on-surface-variant sm:hidden">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading}
          className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md disabled:opacity-50"
        >
          Sau
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>

      <ServiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        service={editingService} 
        onSuccess={() => setRefreshKey(k => k + 1)} 
      />
    </div>
  );
}
