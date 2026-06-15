'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { createEmployee, updateEmployee } from '@/app/actions/employees';
import { getBranches } from '@/app/actions/branches';

export default function EmployeeModal({ isOpen, onClose, employee, onSuccess }: { isOpen: boolean; onClose: () => void; employee?: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    phone_number: '',
    role: 'CONSULTANT',
    branch_id: '',
    status: 'ACTIVE'
  });
  
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getBranches().then(res => setBranches(res));
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setFormData({
          employee_code: employee.employee_code || '',
          full_name: employee.full_name || '',
          phone_number: employee.phone_number || '',
          role: employee.role || 'CONSULTANT',
          branch_id: employee.branch_id?.toString() || '',
          status: employee.status || 'ACTIVE'
        });
      } else {
        setFormData({
          employee_code: '',
          full_name: '',
          phone_number: '',
          role: 'CONSULTANT',
          branch_id: '',
          status: 'ACTIVE'
        });
      }
      setError('');
    }
  }, [isOpen, employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSave = {
        ...formData,
        role: formData.role as any,
        status: formData.status as any,
        branch_id: formData.branch_id ? parseInt(formData.branch_id) : null
      };

      const res = employee
        ? await updateEmployee(employee.id, dataToSave)
        : await createEmployee(dataToSave);

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

  const roles = [
    { value: 'DOCTOR', label: 'Bác sĩ' },
    { value: 'CONSULTANT', label: 'Tư vấn viên' },
    { value: 'CASHIER', label: 'Thu ngân' },
    { value: 'MANAGER', label: 'Quản lý' },
    { value: 'ADMIN', label: 'Quản trị viên' }
  ];

  const statuses = [
    { value: 'ACTIVE', label: 'Đang làm việc' },
    { value: 'INACTIVE', label: 'Tạm nghỉ' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Sửa Nhân Viên' : 'Thêm Nhân Viên Mới'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 text-error p-3 text-sm rounded-lg border border-error/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Mã Nhân viên <span className="text-error">*</span></label>
            <input
              required
              type="text"
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
              value={formData.employee_code}
              onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
              placeholder="VD: NV001"
            />
          </div>

          <div className="space-y-1.5">
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
            <label className="text-sm font-semibold text-slate-700">Chức vụ <span className="text-error">*</span></label>
            <div className="relative">
              <select
                className="w-full h-11 px-4 pr-10 appearance-none rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Chi nhánh trực thuộc</label>
            <div className="relative">
              <select
                className="w-full h-11 px-4 pr-10 appearance-none rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              >
                <option value="">-- Không chọn / Toàn hệ thống --</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Trạng thái <span className="text-error">*</span></label>
            <div className="relative">
              <select
                className="w-full h-11 px-4 pr-10 appearance-none rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 bg-white"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
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
            Lưu Thông Tin
          </button>
        </div>
      </form>
    </Modal>
  );
}
