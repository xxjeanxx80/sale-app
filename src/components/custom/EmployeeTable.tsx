'use client';

import { useState, useEffect } from 'react';
import { getEmployees, deleteEmployee } from '@/app/actions/employees';
import EmployeeModal from './EmployeeModal';

export default function EmployeeTable() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const data = await getEmployees(page, 15, search);
        setEmployees(data.employees);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, page, refreshKey]);

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      const res = await deleteEmployee(id);
      if (res.success) {
        setRefreshKey(k => k + 1);
      } else {
        alert(res.error);
      }
    }
  };

  const handleEdit = (emp: any) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const getRoleName = (role: string) => {
    const roles: any = {
      'DOCTOR': 'Bác sĩ',
      'CONSULTANT': 'Tư vấn viên',
      'CASHIER': 'Thu ngân',
      'MANAGER': 'Quản lý',
      'ADMIN': 'Quản trị viên'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: any = {
      'DOCTOR': 'bg-blue-100 text-blue-700',
      'CONSULTANT': 'bg-indigo-100 text-indigo-700',
      'CASHIER': 'bg-amber-100 text-amber-700',
      'MANAGER': 'bg-emerald-100 text-emerald-700',
      'ADMIN': 'bg-red-100 text-red-700'
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Danh sách Nhân Viên</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-1/2">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              className="h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium text-slate-700 w-full transition-all outline-none"
              placeholder="Tìm tên, SĐT, mã NV..."
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

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-label-md">
              <th className="px-6 py-4 font-semibold text-sm">Mã NV</th>
              <th className="px-6 py-4 font-semibold text-sm">Họ và tên</th>
              <th className="px-6 py-4 font-semibold text-sm">Số điện thoại</th>
              <th className="px-6 py-4 font-semibold text-sm">Chức vụ</th>
              <th className="px-6 py-4 font-semibold text-sm">Chi nhánh</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">Trạng thái</th>
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
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-3xl text-slate-300">group_off</span>
                    </div>
                    Không tìm thấy nhân viên nào phù hợp.
                  </div>
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-700">{emp.employee_code}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{emp.full_name}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{emp.phone_number || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getRoleColor(emp.role)}`}>
                      {getRoleName(emp.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {emp.branches ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">storefront</span>
                        {emp.branches.branch_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Toàn hệ thống</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {emp.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Đang làm việc
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Tạm nghỉ
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(emp)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors border border-transparent hover:border-primary/20">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors border border-transparent hover:border-error/20">
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

      <EmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        employee={editingEmployee} 
        onSuccess={() => setRefreshKey(k => k + 1)} 
      />
    </div>
  );
}
