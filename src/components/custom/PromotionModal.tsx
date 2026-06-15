import { useState, useEffect } from 'react';
import Modal from './Modal';
import { createPromotion, updatePromotion } from '@/app/actions/promotions';

export default function PromotionModal({ isOpen, onClose, promotion, onSuccess }: { isOpen: boolean; onClose: () => void; promotion?: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    promotion_name: '',
    promotion_type: 'REGULAR',
    start_date: '',
    end_date: '',
    applicable_days: '',
    max_discount_percent_cap: 50,
    is_stackable: true,
    description: '',
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (promotion) {
        setFormData({
          promotion_name: promotion.promotion_name || '',
          promotion_type: promotion.promotion_type || 'REGULAR',
          start_date: promotion.start_date ? new Date(promotion.start_date).toISOString().split('T')[0] : '',
          end_date: promotion.end_date ? new Date(promotion.end_date).toISOString().split('T')[0] : '',
          applicable_days: promotion.applicable_days || '',
          max_discount_percent_cap: promotion.max_discount_percent_cap || 50,
          is_stackable: promotion.is_stackable ?? true,
          description: promotion.description || '',
          is_active: promotion.is_active ?? true
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0];
        setFormData({
          promotion_name: '',
          promotion_type: 'REGULAR',
          start_date: today,
          end_date: nextMonth,
          applicable_days: '',
          max_discount_percent_cap: 50,
          is_stackable: true,
          description: '',
          is_active: true
        });
      }
      setError('');
    }
  }, [isOpen, promotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu!');
      }

      const res = promotion
        ? await updatePromotion(promotion.id, formData)
        : await createPromotion(formData);

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Có lỗi xảy ra!');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={promotion ? 'Sửa Khuyến Mãi' : 'Thêm Khuyến Mãi Mới'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-error/10 text-error p-3 text-sm rounded-lg border border-error/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Tên Chương trình <span className="text-error">*</span></label>
            <input
              required
              type="text"
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
              value={formData.promotion_name}
              onChange={(e) => setFormData({ ...formData, promotion_name: e.target.value })}
              placeholder="VD: Tri ân khách hàng tháng 11"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Loại Khuyến mãi</label>
            <div className="relative">
              <select
                className="w-full h-11 px-4 pr-10 appearance-none rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
                value={formData.promotion_type}
                onChange={(e) => setFormData({ ...formData, promotion_type: e.target.value })}
              >
                <option value="REGULAR">Thông thường</option>
                <option value="WEEKEND">Cuối tuần</option>
                <option value="FLASH_SALE">Flash Sale</option>
                <option value="EVENT">Sự kiện lễ/Tết</option>
                <option value="COMBO_DEAL">Gói Combo</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Giới hạn giảm tối đa (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
              value={formData.max_discount_percent_cap}
              onChange={(e) => setFormData({ ...formData, max_discount_percent_cap: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Ngày bắt đầu <span className="text-error">*</span></label>
            <input
              required
              type="date"
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Ngày kết thúc <span className="text-error">*</span></label>
            <input
              required
              type="date"
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
          
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Ngày áp dụng trong tuần</label>
            <input
              type="text"
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
              value={formData.applicable_days}
              onChange={(e) => setFormData({ ...formData, applicable_days: e.target.value })}
              placeholder="VD: Thứ 2, Thứ 3, Thứ 4 (để trống nếu áp dụng tất cả)"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Mô tả chương trình</label>
            <textarea
              className="w-full p-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập ghi chú hoặc mô tả chi tiết..."
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">Bật hoạt động</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                checked={formData.is_stackable}
                onChange={(e) => setFormData({ ...formData, is_stackable: e.target.checked })}
              />
              <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">Cho phép cộng dồn với KM khác</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium shadow-sm hover:bg-primary/90 hover:shadow disabled:opacity-70 flex items-center gap-2 transition-all"
          >
            {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : null}
            Lưu Khuyến Mãi
          </button>
        </div>
      </form>
    </Modal>
  );
}
