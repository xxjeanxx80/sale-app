'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { createCustomer, updateCustomer } from '@/app/actions/customers';

export default function CustomerModal({ isOpen, onClose, customer, onSuccess }: { isOpen: boolean; onClose: () => void; customer?: any; onSuccess: (cus?: any) => void }) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    date_of_birth: '',
    gender: 'OTHER',
    occupation: 'OTHER',
    customer_type: 'NEW'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          full_name: customer.full_name || '',
          phone_number: customer.phone_number || '',
          date_of_birth: customer.date_of_birth ? new Date(customer.date_of_birth).toISOString().split('T')[0] : '',
          gender: customer.gender || 'OTHER',
          occupation: customer.occupation || 'OTHER',
          customer_type: customer.customer_type || 'NEW'
        });
      } else {
        setFormData({
          full_name: '',
          phone_number: '',
          date_of_birth: '',
          gender: 'OTHER',
          occupation: 'OTHER',
          customer_type: 'NEW'
        });
      }
      setError('');
    }
  }, [isOpen, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSave = {
        ...formData,
        gender: formData.gender as any,
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth) : null,
      };

      const res = customer
        ? await updateCustomer(customer.id, dataToSave)
        : await createCustomer(dataToSave);

      if (res.success) {
        onSuccess(res.customer);
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
    <Modal isOpen={isOpen} onClose={onClose} title={customer ? 'Sửa Khách Hàng' : 'Thêm Khách Hàng Mới'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 text-error p-3 text-sm rounded-lg border border-error/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Họ và tên <span className="text-error">*</span></label>
            <input
              required
              type="text"
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="VD: Nguyễn Văn A"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Số điện thoại <span className="text-error">*</span></label>
            <input
              required
              type="tel"
              pattern="[0-9]{10}"
              title="Vui lòng nhập đúng 10 chữ số"
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="VD: 0987654321"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
              <span>Ngày sinh</span>
              <div className="flex items-center gap-1.5 font-normal">
                <span className="text-xs text-slate-500 italic">Nhập tuổi:</span>
                <input 
                  type="number" 
                  min="1"
                  max="120"
                  className="w-14 h-6 px-1 text-xs rounded border border-slate-300 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-center bg-slate-50"
                  placeholder="25"
                  onChange={(e) => {
                    const age = parseInt(e.target.value);
                    if (!isNaN(age) && age > 0) {
                      const year = new Date().getFullYear() - age;
                      setFormData({ ...formData, date_of_birth: `${year}-01-01` });
                    }
                  }}
                />
              </div>
            </label>
            <input
              type="date"
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Giới tính</label>
            <div className="relative">
              <select
                className="w-full h-11 px-4 pr-10 appearance-none rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Nghề nghiệp</label>
            <div className="relative">
              <select
                className="w-full h-11 px-4 pr-10 appearance-none rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              >
                <option value="STUDENT">Học sinh / Sinh viên</option>
                <option value="WORKING">Người đi làm</option>
                <option value="FREELANCER">Tự do</option>
                <option value="OTHER">Khác</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Nhóm khách hàng</label>
            <div className="relative">
              <select
                className="w-full h-11 px-4 pr-10 appearance-none rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
                value={formData.customer_type}
                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
              >
                <option value="NEW">Khách mới</option>
                <option value="REGULAR">Khách quen</option>
                <option value="VIP">Khách VIP</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
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
            Lưu Thông Tin
          </button>
        </div>
      </form>
    </Modal>
  );
}
