import { useState, useEffect } from 'react';
import Modal from './Modal';
import { createCategory, updateCategory, getAllCategoriesMin } from '@/app/actions/categories';
import SearchableSelect from './SearchableSelect';

export default function CategoryModal({ isOpen, onClose, category, initialParentId = 0, onSuccess }: { isOpen: boolean; onClose: () => void; category?: any; initialParentId?: number; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ category_name: '', category_code: '', parent_id: 0, category_level: 1 });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          category_name: category.category_name || '',
          category_code: category.category_code || '',
          parent_id: category.parent_id || 0,
          category_level: category.category_level || 1,
        });
      } else {
        setFormData({ category_name: '', category_code: '', parent_id: initialParentId, category_level: initialParentId ? 2 : 1 });
      }
      setError('');
      getAllCategoriesMin().then(setCategories);
    }
  }, [isOpen, category, initialParentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Auto calculate level based on parent
    const parentLevel = formData.parent_id ? (categories.find(c => c.id === formData.parent_id)?.level || 1) : 0;
    const dataToSubmit = {
      ...formData,
      category_level: formData.parent_id ? parentLevel + 1 : 1,
      parent_id: formData.parent_id || undefined,
    };

    try {
      let res;
      if (category) {
        res = await updateCategory(category.id, dataToSubmit);
      } else {
        res = await createCategory(dataToSubmit);
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
    <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Sửa Danh mục' : 'Thêm Danh mục'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-error-container/20 text-error rounded-lg text-sm font-medium border border-error/20">{error}</div>}
        
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Mã Danh mục</label>
          <input required type="text" className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none font-body-md" value={formData.category_code} onChange={e => setFormData({...formData, category_code: e.target.value})} placeholder="Ví dụ: CATE01" />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Tên Danh mục</label>
          <input required type="text" className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none font-body-md" value={formData.category_name} onChange={e => setFormData({...formData, category_name: e.target.value})} placeholder="Ví dụ: Chăm sóc da" />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Danh mục cha</label>
          <SearchableSelect
            options={[
              { value: 0, label: '-- Không có (Danh mục gốc) --' },
              ...categories
                .filter(c => !(category && c.id === category.id))
                .map(c => ({ value: c.id, label: c.category_name }))
            ]}
            value={formData.parent_id}
            onChange={(val) => setFormData({...formData, parent_id: Number(val)})}
            placeholder="-- Tìm danh mục cha --"
          />
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
