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
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-48 shrink-0">
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
          <div className="relative w-full sm:w-72 shrink-0">
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
        <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-end shrink-0">
          <div className="font-label-sm text-label-sm text-on-surface-variant hidden sm:block whitespace-nowrap">
            Trang {page} / {totalPages}
          </div>
          <button onClick={handleAdd} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg px-4 h-10 font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow shrink-0 w-full sm:w-auto">
            <span className="material-symbols-outlined text-lg">add</span>
            Thêm Mới
          </button>
        </div>
      </div>

      {/* Mobile Card View (Hybrid Layout) */}
      <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-3xl text-slate-300">search_off</span>
            </div>
            <div className="text-sm font-medium">Không tìm thấy dịch vụ nào.</div>
          </div>
        ) : (
          services.map((service) => {
            const price = service.service_prices?.[0]?.base_price || 0;
            return (
              <div key={service.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-bold text-slate-800 text-base">{service.item_name}</div>
                    <div className="text-xs text-slate-500 font-medium mt-1">Mã: {service.item_code} {service.unit && <span className="mx-1 text-slate-300">•</span>} {service.unit && <span className="text-slate-600">Đơn vị: {service.unit}</span>}</div>
                  </div>
                  <div className="shrink-0 flex gap-1.5">
                    <button onClick={() => handleEdit(service)} className="w-8 h-8 rounded-lg text-slate-600 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors border border-slate-100 bg-slate-50">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => handleDelete(service.id)} className="w-8 h-8 rounded-lg text-slate-600 hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors border border-slate-100 bg-slate-50">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-end border-t border-slate-100 pt-3 mt-1">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-1.5">
                      <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold bg-purple-100 text-purple-800">
                        <span className="material-symbols-outlined text-[14px] mr-1">category</span>
                        {service.service_categories?.category_name || 'Chưa phân nhóm'}
                      </span>
                    </div>
                    {service.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">Hoạt động</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">Đã khóa</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">Giá dịch vụ</div>
                    <div className="font-bold text-primary text-base">{Number(price).toLocaleString('vi-VN')} ₫</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Mã HIS</th>
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Tên Dịch Vụ</th>
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Đơn Vị</th>
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">Giá tiền</th>
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider hidden sm:table-cell">Nhóm</th>
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-right">Trạng Thái</th>
              <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 px-6 text-center text-on-surface-variant">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 px-6 text-center text-on-surface-variant">
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
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">
                      {service.unit || '-'}
                    </td>
                    <td className="py-4 px-6 font-label-md text-label-md text-primary font-semibold">
                      {Number(price).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        {service.service_categories?.category_name || 'Chưa phân nhóm'}
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
