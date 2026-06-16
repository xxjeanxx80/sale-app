'use client';

import { useState, useEffect } from 'react';
import { getPromotions, deletePromotion, duplicatePromotion } from '@/app/actions/promotions';
import PromotionModal from '@/components/custom/PromotionModal';
import { useRouter } from 'next/navigation';

export default function PromotionTable() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true);
      try {
        const data = await getPromotions(page, 15, search);
        setPromotions(data.promotions);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPromotions, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, page, refreshKey]);

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa chương trình khuyến mãi này? Mọi quy tắc và dữ liệu liên quan sẽ bị xóa!')) {
      const res = await deletePromotion(id);
      if (res.success) {
        setRefreshKey(k => k + 1);
      } else {
        alert(res.error);
      }
    }
  };

  const handleEdit = (promo: any) => {
    router.push(`/promotions/${promo.id}`);
  };

  const handleDuplicate = async (id: number) => {
    if (confirm('Tạo một bản sao của chương trình khuyến mãi này? (Bản sao sẽ mặc định ở trạng thái Tắt)')) {
      const res = await duplicatePromotion(id);
      if (res.success) {
        setRefreshKey(k => k + 1);
      } else {
        alert(res.error);
      }
    }
  };

  const handleAdd = () => {
    setEditingPromotion(null);
    setIsModalOpen(true);
  };

  const getPromoTypeName = (type: string) => {
    const types: any = {
      'REGULAR': 'Thông thường',
      'WEEKEND': 'Cuối tuần',
      'FLASH_SALE': 'Flash Sale',
      'EVENT': 'Sự kiện',
      'COMBO_DEAL': 'Gói Combo'
    };
    return types[type] || type;
  };

  const getPromoTypeColor = (type: string) => {
    const colors: any = {
      'REGULAR': 'bg-blue-100 text-blue-700',
      'WEEKEND': 'bg-purple-100 text-purple-700',
      'FLASH_SALE': 'bg-red-100 text-red-700',
      'EVENT': 'bg-orange-100 text-orange-700',
      'COMBO_DEAL': 'bg-emerald-100 text-emerald-700'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Danh sách Khuyến Mãi</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-1/2">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              className="h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium text-slate-700 w-full transition-all outline-none"
              placeholder="Tìm khuyến mãi..."
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button onClick={handleAdd} className="bg-gradient-to-r from-primary to-teal-500 text-white rounded-xl px-4 h-10 font-medium text-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow shrink-0">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Thêm Mới</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên Khuyến Mãi</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loại</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Thời Gian Áp Dụng</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Trạng Thái</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Quy Tắc</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-slate-400">card_giftcard</span>
                    </div>
                    Chưa có chương trình khuyến mãi nào.
                  </div>
                </td>
              </tr>
            ) : (
              promotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{promo.promotion_name}</div>
                    {promo.description && (
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xs" title={promo.description}>
                        {promo.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getPromoTypeColor(promo.promotion_type)}`}>
                      {getPromoTypeName(promo.promotion_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">
                      <span className="text-slate-400 text-xs">Từ:</span> {new Date(promo.start_date).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-sm text-slate-700 mt-0.5">
                      <span className="text-slate-400 text-xs">Đến:</span> {new Date(promo.end_date).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {promo.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Đang bật
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Đã tắt
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                      {promo._count?.promo_rules || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDuplicate(promo.id)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors border border-transparent hover:border-amber-200" title="Tạo bản sao">
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                      <button onClick={() => handleEdit(promo)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors border border-transparent hover:border-primary/20" title="Chỉnh sửa">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(promo.id)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors border border-transparent hover:border-error/20" title="Xóa">
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

      <PromotionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        promotion={editingPromotion} 
        onSuccess={() => setRefreshKey(k => k + 1)} 
      />
    </div>
  );
}
