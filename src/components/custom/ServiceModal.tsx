import { useState, useEffect } from 'react';
import Modal from './Modal';
import { createService, updateService } from '@/app/actions/services';
import { getAllCategoriesMin } from '@/app/actions/categories';
import SearchableSelect from './SearchableSelect';

export default function ServiceModal({ isOpen, onClose, service, onSuccess }: { isOpen: boolean; onClose: () => void; service?: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ 
    item_code: '', 
    item_name: '', 
    category_id: 0, 
    base_price: '', 
    is_active: true 
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (service) {
        setFormData({
          item_code: service.item_code || '',
          item_name: service.item_name || '',
          category_id: service.category_id || 0,
          base_price: service.service_prices?.[0]?.base_price?.toString() || '0',
          is_active: service.is_active ?? true,
        });
      } else {
        setFormData({ item_code: '', item_name: '', category_id: 0, base_price: '', is_active: true });
      }
      setError('');
      getAllCategoriesMin().then(setCategories);
    }
  }, [isOpen, service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) {
      setError('Vui lòng chọn danh mục.');
      return;
    }
    setLoading(true);
    setError('');

    const dataToSubmit = {
      ...formData,
      base_price: Number(formData.base_price) || 0,
    };

    try {
      let res;
      if (service) {
        res = await updateService(service.id, dataToSubmit);
      } else {
        res = await createService(dataToSubmit);
      }
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={service ? 'Sửa Dịch vụ' : 'Thêm Dịch vụ mới'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-error-container/20 text-error rounded-lg text-sm font-medium border border-error/20">{error}</div>}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-on-surface mb-1">Mã Dịch vụ (HIS)</label>
            <input required type="text" className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none font-body-md" value={formData.item_code} onChange={e => setFormData({...formData, item_code: e.target.value})} placeholder="Ví dụ: SRV01" />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-on-surface mb-1">Giá tiền (VNĐ)</label>
            <input required type="number" min="0" step="1000" className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none font-body-md" value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} placeholder="0" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Tên Dịch vụ</label>
          <input required type="text" className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none font-body-md" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} placeholder="Ví dụ: Triệt lông nách" />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Danh mục</label>
          <SearchableSelect 
            options={categories.map(c => ({ value: c.id, label: c.category_name }))}
            value={formData.category_id} 
            onChange={(val) => setFormData({...formData, category_id: Number(val)})}
            placeholder="-- Tìm và chọn danh mục --"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input type="checkbox" id="isActive" className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
          <label htmlFor="isActive" className="text-sm font-medium text-on-surface cursor-pointer">Trạng thái hoạt động</label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20 mt-6">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">Hủy</button>
          <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? 'Đang lưu...' : 'Lưu lại'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
