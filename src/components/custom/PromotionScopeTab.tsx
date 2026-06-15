'use client';

import { useState, useEffect } from 'react';
import { updatePromotionBranches } from '@/app/actions/promotions';
import { getBranches, createBranch, updateBranch, deleteBranch, toggleBranchActive } from '@/app/actions/branches';
import Modal from './Modal';
import { useRouter } from 'next/navigation';

export default function PromotionScopeTab({ promotion }: { promotion: any }) {
  const router = useRouter();
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<number[]>(
    promotion.promotion_branches?.map((b: any) => b.branch_id) || []
  );
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Branch CRUD Modal
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({ id: 0, branch_code: '', branch_name: '', address: '', is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      const res = await getBranches();
      setBranches(res);
    };
    fetchBranches();
  }, [refreshKey]);

  const handleSave = async () => {
    setLoading(true);
    const res = await updatePromotionBranches(promotion.id, selectedBranches);
    setLoading(false);
    if (res.success) {
      alert('Đã cập nhật phạm vi áp dụng (Chi nhánh) thành công!');
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const toggleBranch = (id: number) => {
    if (selectedBranches.includes(id)) {
      setSelectedBranches(selectedBranches.filter(bId => bId !== id));
    } else {
      setSelectedBranches([...selectedBranches, id]);
    }
  };

  const handleOpenBranchModal = (branch: any = null) => {
    if (branch) {
      setBranchForm({
        id: branch.id,
        branch_code: branch.branch_code || '',
        branch_name: branch.branch_name || '',
        address: branch.address || '',
        is_active: branch.is_active ?? true
      });
    } else {
      setBranchForm({ id: 0, branch_code: '', branch_name: '', address: '', is_active: true });
    }
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let res;
    if (branchForm.id === 0) {
      res = await createBranch({
        branch_code: branchForm.branch_code,
        branch_name: branchForm.branch_name,
        address: branchForm.address,
        is_active: branchForm.is_active
      });
    } else {
      res = await updateBranch(branchForm.id, {
        branch_code: branchForm.branch_code,
        branch_name: branchForm.branch_name,
        address: branchForm.address,
        is_active: branchForm.is_active
      });
    }
    setIsSubmitting(false);

    if (res.success) {
      setIsBranchModalOpen(false);
      setRefreshKey(k => k + 1);
    } else {
      alert(res.error);
    }
  };

  const handleDeleteBranch = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Bạn có chắc chắn muốn xóa chi nhánh này? Mọi dữ liệu liên quan có thể bị ảnh hưởng.')) {
      const res = await deleteBranch(id);
      if (res.success) {
        setRefreshKey(k => k + 1);
        if (selectedBranches.includes(id)) {
          setSelectedBranches(selectedBranches.filter(bId => bId !== id));
        }
      } else {
        alert(res.error);
      }
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleBranchActive(id, !currentStatus);
    if (res.success) {
      setRefreshKey(k => k + 1);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="text-lg font-bold text-slate-800">Phạm vi áp dụng (Chi nhánh)</h3>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </button>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-500">Chọn các chi nhánh được phép áp dụng chương trình khuyến mãi này. Nếu không chọn chi nhánh nào, chương trình sẽ không khả dụng ở bất kỳ đâu.</p>
          <button 
            onClick={() => handleOpenBranchModal()} 
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline whitespace-nowrap ml-4"
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span> Thêm Chi nhánh mới
          </button>
        </div>
        
        {branches.length === 0 ? (
          <p className="text-sm italic text-slate-400">Đang tải danh sách chi nhánh...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map(branch => (
              <label 
                key={branch.id} 
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${selectedBranches.includes(branch.id) ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-primary/30'}`}
              >
                <div className="flex items-center gap-3 w-full justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary disabled:opacity-50"
                      checked={selectedBranches.includes(branch.id)}
                      onChange={() => toggleBranch(branch.id)}
                      disabled={!branch.is_active}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium block ${branch.is_active ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{branch.branch_name}</span>
                        {!branch.is_active && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">Đã tắt</span>}
                      </div>
                      <span className="text-xs text-slate-400 font-normal">Mã: {branch.branch_code}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.preventDefault()}>
                    <button 
                      onClick={(e) => handleToggleActive(branch.id, branch.is_active, e)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${branch.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      title={branch.is_active ? "Tắt chi nhánh" : "Bật chi nhánh"}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${branch.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button 
                      onClick={(e) => { e.preventDefault(); handleOpenBranchModal(branch); }}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteBranch(branch.id, e)}
                      className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isBranchModalOpen} onClose={() => setIsBranchModalOpen(false)} title={branchForm.id === 0 ? "Thêm Chi nhánh mới" : "Sửa thông tin Chi nhánh"}>
        <form onSubmit={handleSaveBranch} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Mã Chi nhánh <span className="text-error">*</span></label>
            <input 
              required
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-700 bg-white"
              value={branchForm.branch_code}
              onChange={e => setBranchForm({...branchForm, branch_code: e.target.value})}
              placeholder="VD: CN01"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Tên Chi nhánh <span className="text-error">*</span></label>
            <input 
              required
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-700 bg-white"
              value={branchForm.branch_name}
              onChange={e => setBranchForm({...branchForm, branch_name: e.target.value})}
              placeholder="VD: Chi nhánh Quận 1"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Vị trí / Địa chỉ</label>
            <input 
              className="w-full h-11 px-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-700 bg-white"
              value={branchForm.address}
              onChange={e => setBranchForm({...branchForm, address: e.target.value})}
              placeholder="VD: 123 Nguyễn Huệ, Quận 1"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2 group">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
              checked={branchForm.is_active}
              onChange={(e) => setBranchForm({ ...branchForm, is_active: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">Đang hoạt động</span>
          </label>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={() => setIsBranchModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium shadow-sm hover:bg-primary/90 flex items-center gap-2"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
