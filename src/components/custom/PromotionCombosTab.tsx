'use client';

import { useState, useEffect } from 'react';
import { createCombo, updateCombo, deleteCombo, addComboItem, deleteComboItem } from '@/app/actions/combos';
import { getServices } from '@/app/actions/services';
import { useRouter } from 'next/navigation';
import SearchableSelect from './SearchableSelect';

export default function PromotionCombosTab({ promotion }: { promotion: any }) {
  const router = useRouter();
  const [combos, setCombos] = useState<any[]>(promotion.combos || []);
  const [expandedCombos, setExpandedCombos] = useState<Set<number>>(new Set());

  const toggleCombo = (id: number) => {
    const newSet = new Set(expandedCombos);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCombos(newSet);
  };
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<any>(null);
  const [comboForm, setComboForm] = useState({
    combo_name: '',
    original_total_price: 0,
    combo_price: 0,
    allow_extra_rules: false,
    max_slots: 0,
    is_active: true
  });

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedComboId, setSelectedComboId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({
    service_id: 0,
    quantity: 1,
    allocated_price: 0
  });

  useEffect(() => {
    const fetchServices = async () => {
      const res = await getServices(1, 10000);
      setServices(res.services);
    };
    fetchServices();
  }, []);

  // Sync combos on promotion refresh (simplified)
  useEffect(() => {
    if (promotion.combos) {
      setCombos(promotion.combos);
    }
  }, [promotion, refreshKey]);

  // Combo Handlers
  const handleAddCombo = () => {
    setEditingCombo(null);
    setComboForm({ combo_name: '', original_total_price: 0, combo_price: 0, allow_extra_rules: false, max_slots: 0, is_active: true });
    setIsComboModalOpen(true);
  };

  const handleEditCombo = (c: any) => {
    setEditingCombo(c);
    setComboForm({
      combo_name: c.combo_name,
      original_total_price: Number(c.original_total_price),
      combo_price: Number(c.combo_price),
      allow_extra_rules: c.allow_extra_rules,
      max_slots: c.max_slots || 0,
      is_active: c.is_active
    });
    setIsComboModalOpen(true);
  };

  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data = {
      ...comboForm,
      max_slots: comboForm.max_slots === 0 ? null : comboForm.max_slots
    };

    const res = editingCombo
      ? await updateCombo(editingCombo.id, data)
      : await createCombo(promotion.id, data);

    setLoading(false);
    if (res.success) {
      setIsComboModalOpen(false);
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteCombo = async (id: number) => {
    if (confirm('Xóa gói Combo này?')) {
      const res = await deleteCombo(id);
      if (res.success) router.refresh();
      else alert(res.error);
    }
  };

  // Item Handlers
  const handleAddItem = (comboId: number) => {
    setSelectedComboId(comboId);
    setItemForm({ service_id: 0, quantity: 1, allocated_price: 0 });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComboId || itemForm.service_id === 0) return;
    setLoading(true);
    const res = await addComboItem(selectedComboId, itemForm.service_id, itemForm.quantity, itemForm.allocated_price);
    setLoading(false);
    if (res.success) {
      setIsItemModalOpen(false);
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (confirm('Xóa dịch vụ này khỏi Combo?')) {
      await deleteComboItem(id);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Danh sách Gói Combo</h3>
        <button onClick={handleAddCombo} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tạo Gói Mới
        </button>
      </div>

      {combos.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="material-symbols-outlined text-4xl text-slate-300">view_cozy</span>
          <p className="mt-2 text-slate-500">Chưa có gói Combo nào được thiết lập.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {combos.map((combo) => {
            const isExpanded = expandedCombos.has(combo.id);

            return (
            <div key={combo.id} className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-white shadow-sm">
              <div 
                className="bg-indigo-50/30 hover:bg-indigo-50/80 p-4 border-b border-slate-200 flex justify-between items-center cursor-pointer transition-colors group"
                onClick={() => toggleCombo(combo.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary/10 text-primary' : 'bg-white border border-slate-200 text-slate-400 group-hover:text-primary'}`}>
                    <span className="material-symbols-outlined text-[20px] transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>chevron_right</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{combo.combo_name}</h4>
                    <div className="text-sm text-slate-500 mt-1 flex gap-4">
                      <span>Giá gốc: <span className="line-through">{Number(combo.original_total_price).toLocaleString()}đ</span></span>
                      <span className="text-primary font-semibold">Giá Combo: {Number(combo.combo_price).toLocaleString()}đ</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleEditCombo(combo)} className="p-2 text-blue-500 hover:bg-blue-100 bg-white rounded-lg border border-slate-100 shadow-sm transition-colors">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button onClick={() => handleDeleteCombo(combo.id)} className="p-2 text-error hover:bg-error/10 bg-white rounded-lg border border-slate-100 shadow-sm transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-sm text-slate-700">Các dịch vụ trong gói:</h5>
                    <button onClick={() => handleAddItem(combo.id)} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                      <span className="material-symbols-outlined text-[16px]">add_circle</span> Thêm dịch vụ
                    </button>
                  </div>
                  {combo.combo_items && combo.combo_items.length > 0 ? (
                    <table className="w-full text-sm text-left border border-slate-100 rounded-lg overflow-hidden">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Dịch vụ</th>
                          <th className="px-3 py-2 font-medium text-center">Số lượng</th>
                          <th className="px-3 py-2 font-medium text-right">Phân bổ giá</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {combo.combo_items.map((item: any) => (
                          <tr key={item.id} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-medium text-slate-700">{item.services?.item_name || 'Dịch vụ đã xóa'}</td>
                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">{Number(item.allocated_price || 0).toLocaleString()}đ</td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={() => handleDeleteItem(item.id)} className="text-slate-400 hover:text-error transition-colors"><span className="material-symbols-outlined text-[16px]">close</span></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-400 italic">Chưa có dịch vụ nào trong gói này.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Combo Modal */}
      {isComboModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[600px] max-w-[95vw] p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">{editingCombo ? 'Sửa Gói' : 'Tạo Gói Mới'}</h3>
            <form onSubmit={handleSaveCombo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên Gói Combo</label>
                <input required type="text" className="w-full h-11 px-4 border rounded-xl" value={comboForm.combo_name} onChange={e => setComboForm({ ...comboForm, combo_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Giá gốc</label>
                  <input required type="number" className="w-full h-11 px-4 border rounded-xl" value={comboForm.original_total_price} onChange={e => setComboForm({ ...comboForm, original_total_price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá bán Combo</label>
                  <input required type="number" className="w-full h-11 px-4 border rounded-xl" value={comboForm.combo_price} onChange={e => setComboForm({ ...comboForm, combo_price: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsComboModalOpen(false)} className="px-4 py-2 border rounded-xl text-slate-600">Hủy</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-xl">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[500px] max-w-[95vw] p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Thêm dịch vụ vào Combo</h3>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chọn Dịch vụ</label>
                <SearchableSelect
                  options={services.map(s => ({ value: s.id, label: `${s.item_name} - ${Number(s.service_prices?.[0]?.base_price || 0).toLocaleString()}đ` }))}
                  value={itemForm.service_id}
                  onChange={(val) => {
                    const selectedId = Number(val);
                    const selectedSvc = services.find(s => s.id === selectedId);
                    const basePrice = selectedSvc?.service_prices?.[0]?.base_price || 0;
                    setItemForm({ ...itemForm, service_id: selectedId, allocated_price: basePrice });
                  }}
                  placeholder="-- Tìm và chọn dịch vụ --"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Số lượng</label>
                  <input required type="number" min="1" className="w-full h-11 px-4 border rounded-xl" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá phân bổ</label>
                  <input type="number" className="w-full h-11 px-4 border rounded-xl" value={itemForm.allocated_price} onChange={e => setItemForm({ ...itemForm, allocated_price: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 border rounded-xl text-slate-600">Hủy</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-xl">Thêm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
