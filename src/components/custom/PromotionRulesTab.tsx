'use client';

import { useState, useEffect } from 'react';
import { createPromoRule, updatePromoRule, deletePromoRule, addRuleCondition, addRuleReward, deleteRuleCondition, deleteRuleReward } from '@/app/actions/promoRules';
import { getServices } from '@/app/actions/services';
import { getAllCategoriesMin } from '@/app/actions/categories';
import { useRouter } from 'next/navigation';
import SearchableSelect from './SearchableSelect';

export default function PromotionRulesTab({ promotion, ruleType }: { promotion: any, ruleType?: 'GLOBAL' | 'SPECIFIC' }) {
  const router = useRouter();
  const [rules, setRules] = useState<any[]>(promotion.promo_rules || []);
  const [loading, setLoading] = useState(false);

  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const resServices = await getServices(1, 10000);
      setServices(resServices.services || []);
      const resCats = await getAllCategoriesMin();
      setCategories(resCats || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (promotion.promo_rules) {
      setRules(promotion.promo_rules);
    }
  }, [promotion]);

  // Rule
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({ id: 0, rule_name: '', is_exclusive_rule: false, max_applications: '' as number | string });
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set());

  const toggleRule = (id: number) => {
    const newSet = new Set(expandedRules);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRules(newSet);
  };

  // Condition
  const [isCondModalOpen, setIsCondModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [condForm, setCondForm] = useState({
    criteria_type: 'TOTAL_BILL',
    operator: 'GTE',
    value_num: 0,
    target_service_id: 0,
    target_category_id: 0,
    value_text: '',
    condition_group: 1
  });

  // Reward
  const [isRewModalOpen, setIsRewModalOpen] = useState(false);
  const [rewForm, setRewForm] = useState({
    reward_type: 'DISCOUNT_PERCENT',
    reward_value: 0,
    target_service_id: 0,
    gift_description: ''
  });

  // Handlers Rule
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let res;
    if (ruleForm.id) {
      res = await updatePromoRule(ruleForm.id, ruleForm);
    } else {
      res = await createPromoRule(promotion.id, ruleForm);
    }

    setLoading(false);
    if (res.success) {
      setIsRuleModalOpen(false);
      router.refresh();
    } else alert(res.error);
  };

  const handleDeleteRule = async (id: number) => {
    if (confirm('Bạn chắc chắn muốn xóa Quy tắc này cùng mọi điều kiện bên trong?')) {
      const res = await deletePromoRule(id);
      if (res.success) router.refresh();
    }
  };

  // Handlers Condition
  const handleSaveCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;
    setLoading(true);
    const data = {
      ...condForm,
      value_num: condForm.value_num === 0 ? null : condForm.value_num,
      target_service_id: condForm.target_service_id === 0 ? null : condForm.target_service_id,
      target_category_id: condForm.target_category_id === 0 ? null : condForm.target_category_id,
      value_text: condForm.value_text.trim() === '' ? null : condForm.value_text
    };
    const res = await addRuleCondition(selectedRule.id, data);
    setLoading(false);
    if (res.success) {
      setIsCondModalOpen(false);
      router.refresh();
    } else alert(res.error);
  };

  const handleDeleteCond = async (id: number) => {
    if (confirm('Xóa điều kiện này?')) {
      await deleteRuleCondition(id);
      router.refresh();
    }
  };

  // Handlers Reward
  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;
    setLoading(true);
    const data = {
      ...rewForm,
      reward_value: rewForm.reward_value === 0 ? null : rewForm.reward_value,
      target_service_id: rewForm.target_service_id === 0 ? null : rewForm.target_service_id,
      gift_description: rewForm.gift_description.trim() === '' ? null : rewForm.gift_description
    };
    const res = await addRuleReward(selectedRule.id, data);
    setLoading(false);
    if (res.success) {
      setIsRewModalOpen(false);
      router.refresh();
    } else alert(res.error);
  };

  const handleDeleteRew = async (id: number) => {
    if (confirm('Xóa phần thưởng này?')) {
      await deleteRuleReward(id);
      router.refresh();
    }
  };

  const formatCondition = (cond: any) => {
    const ops: any = { EQ: '=', GTE: '>=', LTE: '<=', GT: '>', LT: '<' };
    const opStr = ops[cond.operator] || cond.operator;
    switch (cond.criteria_type) {
      case 'TOTAL_BILL': return `Tổng Bill ${opStr} ${Number(cond.value_num).toLocaleString()}đ`;
      case 'GROUP_SIZE': return `Số lượng người đi ${opStr} ${Number(cond.value_num)}`;
      case 'SERVICE_SELECTED':
        const s = services.find(x => x.id === cond.target_service_id);
        return `Mua Dịch vụ: ${s ? s.item_name : cond.target_service_id}`;
      case 'CUSTOMER_TYPE': return `Hạng khách hàng ${opStr} ${cond.value_text}`;
      case 'DAY_OF_WEEK': return `Ngày trong tuần: ${cond.value_text}`;
      case 'CUSTOMER_ATTRIBUTE':
        if (cond.value_text === 'BIRTHDAY') return `Là ngày Sinh Nhật khách hàng`;
        if (cond.value_text === 'FIRST_TIME') return `Là khách hàng mới (Lần đầu)`;
        return `Thuộc tính KH: ${cond.value_text}`;
      default: return `${cond.criteria_type} ${opStr} ${cond.value_num || cond.value_text}`;
    }
  };

  const formatReward = (rew: any) => {
    switch (rew.reward_type) {
      case 'DISCOUNT_PERCENT': return `Giảm ${Number(rew.reward_value)}%`;
      case 'FIXED_PRICE': return `Giảm tiền mặt ${Number(rew.reward_value).toLocaleString()}đ`;
      case 'FREE_SERVICE':
        const s = services.find(x => x.id === rew.target_service_id);
        return `Tặng Dịch vụ: ${s ? s.item_name : rew.target_service_id}`;
      case 'FREE_PRODUCT': return `Tặng Quà: ${rew.gift_description}`;
      case 'CUSTOM_NOTE': return `Ghi chú: ${rew.gift_description || rew.reward_value}`;
      default: return `${rew.reward_type}: ${rew.reward_value}`;
    }
  };

  const globalRules = rules.filter(r => !r.is_exclusive_rule);
  const specificRules = rules.filter(r => r.is_exclusive_rule);

  const renderRuleCard = (rule: any) => {
    const isExpanded = expandedRules.has(rule.id);
    
    // Group conditions by condition_group
    const groupedConditions = (rule.rule_conditions || []).reduce((acc: any, cond: any) => {
      const group = cond.condition_group || 1;
      if (!acc[group]) acc[group] = [];
      acc[group].push(cond);
      return acc;
    }, {});
    const conditionGroups = Object.keys(groupedConditions).map(Number).sort((a, b) => a - b);
    const maxGroup = conditionGroups.length > 0 ? Math.max(...conditionGroups) : 0;

    return (
      <div key={rule.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all">
        <div 
          className={`${rule.is_exclusive_rule ? 'bg-rose-50/50 hover:bg-rose-100/50' : 'bg-indigo-50/50 hover:bg-indigo-100/50'} p-4 border-b border-slate-200 flex justify-between items-center cursor-pointer transition-colors group`}
          onClick={() => toggleRule(rule.id)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary/10 text-primary' : 'bg-white border border-slate-200 text-slate-400 group-hover:text-primary'}`}>
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>chevron_right</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                {rule.rule_name}
                {rule.is_exclusive_rule && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-md">Quy tắc riêng</span>}
              </h4>
              <p className="text-xs text-slate-500 mt-1">Trạng thái cộng dồn: {rule.is_stackable_with_others ? 'Có' : 'Không'}</p>
              {rule.max_applications && <p className="text-xs text-amber-600 mt-1 font-medium">Giới hạn suất: {rule.max_applications}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setRuleForm({ id: rule.id, rule_name: rule.rule_name, is_exclusive_rule: rule.is_exclusive_rule, max_applications: rule.max_applications || '' }); setIsRuleModalOpen(true); }} className="text-blue-500 p-2 hover:bg-blue-100 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button onClick={() => handleDeleteRule(rule.id)} className="text-error p-2 hover:bg-error/10 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
        {/* Conditions Column */}
        <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100">
          <div className="flex justify-between items-center mb-3">
            <h5 className="font-semibold text-amber-800 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">help_clinic</span> ĐIỀU KIỆN (NẾU...)</h5>
          </div>
          {conditionGroups.length > 0 ? (
            <div className="space-y-4">
              {conditionGroups.map((group: number, groupIdx: number) => (
                <div key={group} className="relative">
                  {groupIdx > 0 && (
                    <div className="flex items-center justify-center my-3">
                      <div className="h-px bg-amber-200 flex-1"></div>
                      <span className="px-3 text-xs font-bold text-amber-600 bg-amber-50 rounded-full border border-amber-200">HOẶC</span>
                      <div className="h-px bg-amber-200 flex-1"></div>
                    </div>
                  )}
                  <div className="bg-white border border-amber-200 p-3 rounded-xl shadow-sm">
                    <ul className="space-y-2">
                      {groupedConditions[group].map((cond: any, idx: number) => (
                        <li key={cond.id} className="flex flex-col gap-2">
                          {idx > 0 && <div className="text-xs font-bold text-amber-500 pl-2">VÀ</div>}
                          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-sm text-slate-700 flex justify-between items-center">
                            <span className="font-medium">{formatCondition(cond)}</span>
                            <button onClick={() => handleDeleteCond(cond.id)} className="text-slate-400 hover:text-error"><span className="material-symbols-outlined text-[16px]">close</span></button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 text-right">
                      <button onClick={() => {
                        setSelectedRule(rule);
                        setCondForm({ criteria_type: rule.is_exclusive_rule ? 'SERVICE_SELECTED' : 'TOTAL_BILL', operator: 'GTE', value_num: 0, target_service_id: 0, target_category_id: 0, value_text: '', condition_group: group });
                        setIsCondModalOpen(true);
                      }} className="text-amber-600 text-xs font-medium hover:text-amber-800 hover:underline inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">add</span>Thêm điều kiện (VÀ)</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic mb-4">Áp dụng ngay không cần điều kiện.</p>
          )}
          
          <div className="mt-4 pt-4 border-t border-amber-200 text-center">
             <button onClick={() => {
                setSelectedRule(rule);
                setCondForm({ criteria_type: rule.is_exclusive_rule ? 'SERVICE_SELECTED' : 'TOTAL_BILL', operator: 'GTE', value_num: 0, target_service_id: 0, target_category_id: 0, value_text: '', condition_group: maxGroup + 1 });
                setIsCondModalOpen(true);
              }} className="text-amber-700 text-xs font-medium hover:bg-amber-200 bg-amber-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm transition-colors border border-amber-200">
               <span className="material-symbols-outlined text-[16px]">add_circle</span>
               Thêm Nhóm Điều Kiện Mới (HOẶC)
             </button>
          </div>
        </div>

        {/* Rewards Column */}
        <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
          <div className="flex justify-between items-center mb-3">
            <h5 className="font-semibold text-emerald-800 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">redeem</span> PHẦN THƯỞNG (THÌ...)</h5>
            <button onClick={() => {
              setSelectedRule(rule);
              setRewForm({ reward_type: 'DISCOUNT_PERCENT', reward_value: 0, target_service_id: 0, gift_description: '' });
              setIsRewModalOpen(true);
            }} className="text-emerald-700 text-xs font-medium hover:underline bg-emerald-100 px-2 py-1 rounded-md">+ Thêm Phần Thưởng</button>
          </div>
          {rule.rule_rewards && rule.rule_rewards.length > 0 ? (
            <ul className="space-y-2">
              {rule.rule_rewards.map((rew: any) => (
                <li key={rew.id} className="bg-white border border-emerald-200 p-2.5 rounded-lg text-sm text-slate-700 flex justify-between items-center">
                  <span className="font-medium">{formatReward(rew)}</span>
                  <button onClick={() => handleDeleteRew(rew.id)} className="text-slate-400 hover:text-error"><span className="material-symbols-outlined text-[16px]">close</span></button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">Chưa có phần thưởng nào được thiết lập.</p>
          )}
        </div>
          </div>
        )}
      </div>
    );
  };

  const displayGlobal = ruleType === 'GLOBAL' || !ruleType;
  const displaySpecific = ruleType === 'SPECIFIC' || !ruleType;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">
          {ruleType === 'GLOBAL' ? 'Quy tắc Chung (Áp dụng Toàn Hóa Đơn)' : ruleType === 'SPECIFIC' ? 'Quy tắc Riêng (Khuyến Mãi Theo Dịch Vụ)' : 'Cấu trúc Quy tắc Khuyến mãi'}
        </h3>
        <button onClick={() => {
          setRuleForm({ id: 0, rule_name: '', is_exclusive_rule: ruleType === 'SPECIFIC', max_applications: '' });
          setIsRuleModalOpen(true);
        }} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Thêm Quy Tắc Mới
        </button>
      </div>

      {((displayGlobal && globalRules.length === 0) && (displaySpecific && specificRules.length === 0)) && (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="material-symbols-outlined text-4xl text-slate-300">rule</span>
          <p className="mt-2 text-slate-500">Chưa có Quy tắc nào.</p>
        </div>
      )}

      {displayGlobal && globalRules.length > 0 && (
        <div className="space-y-4">
          {!ruleType && <h4 className="font-semibold text-slate-700 uppercase tracking-wide text-sm border-b pb-2">🌍 Quy tắc Chung (Áp dụng toàn hóa đơn)</h4>}
          {globalRules.map(renderRuleCard)}
        </div>
      )}

      {displaySpecific && specificRules.length > 0 && (
        <div className="space-y-4 mt-8">
          {!ruleType && <h4 className="font-semibold text-slate-700 uppercase tracking-wide text-sm border-b pb-2">🎯 Quy tắc Riêng (Chỉ áp dụng cho Dịch vụ / Danh mục cụ thể)</h4>}
          {specificRules.map(renderRuleCard)}
        </div>
      )}

      {/* MODAL: TẠO QUY TẮC */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[500px] max-w-[95vw] p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">{ruleForm.id ? 'Sửa Quy tắc' : 'Tạo Quy tắc mới'}</h3>
            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên Quy tắc (Ghi chú)</label>
                <input required type="text" className="w-full h-11 px-4 border rounded-xl" placeholder="VD: Nếu Tổng Bill &gt; 1Tr thì Giảm 10%" value={ruleForm.rule_name} onChange={e => setRuleForm({ ...ruleForm, rule_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số suất (Giới hạn áp dụng)</label>
                <input type="number" min="1" className="w-full h-11 px-4 border rounded-xl" placeholder="Không nhập nếu không giới hạn" value={ruleForm.max_applications} onChange={e => setRuleForm({ ...ruleForm, max_applications: e.target.value ? Number(e.target.value) : '' })} />
                <p className="text-xs text-slate-500 mt-1">Để trống nếu muốn áp dụng không giới hạn số lượng suất.</p>
              </div>
              {!ruleType && (
                <div>
                  <label className="block text-sm font-medium mb-1">Loại Quy Tắc</label>
                  <select className="w-full h-11 px-4 border rounded-xl" value={ruleForm.is_exclusive_rule ? 'true' : 'false'} onChange={e => setRuleForm({ ...ruleForm, is_exclusive_rule: e.target.value === 'true' })}>
                    <option value="false">Quy tắc Chung (Áp dụng toàn Hóa đơn)</option>
                    <option value="true">Quy tắc Riêng (Chỉ áp dụng cho Dịch vụ / Danh mục cụ thể)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsRuleModalOpen(false)} className="px-4 py-2 border rounded-xl text-slate-600">Hủy</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-xl">Lưu Quy Tắc</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM ĐIỀU KIỆN */}
      {isCondModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[500px] max-w-[95vw] p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-amber-600">Thêm Điều Kiện</h3>
            <form onSubmit={handleSaveCondition} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Loại điều kiện</label>
                <select className="w-full h-11 px-4 border rounded-xl" value={condForm.criteria_type} onChange={e => {
                  const val = e.target.value;
                  if (val === 'BIRTHDAY') setCondForm({ ...condForm, criteria_type: 'CUSTOMER_ATTRIBUTE', value_text: 'BIRTHDAY' });
                  else if (val === 'FIRST_TIME') setCondForm({ ...condForm, criteria_type: 'CUSTOMER_ATTRIBUTE', value_text: 'FIRST_TIME' });
                  else setCondForm({ ...condForm, criteria_type: val });
                }}>
                  {selectedRule?.is_exclusive_rule ? (
                    <>
                      <option value="SERVICE_SELECTED">Khách có chọn Dịch vụ cụ thể này</option>
                    </>
                  ) : (
                    <>
                      <option value="TOTAL_BILL">Tổng tiền hóa đơn (VNĐ)</option>
                      <option value="GROUP_SIZE">Số lượng người đi chung</option>
                      <option value="CUSTOMER_TYPE">Hạng Khách Hàng (VIP/VVIP)</option>
                      <option value="FIRST_TIME">Khách hàng mới (Lần đầu)</option>
                      <option value="BIRTHDAY">Là tháng sinh nhật của khách</option>
                    </>
                  )}
                </select>
              </div>

              {/* Dynamic Fields based on Criteria */}
              {['TOTAL_BILL', 'GROUP_SIZE'].includes(condForm.criteria_type) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Toán tử</label>
                    <select className="w-full h-11 px-4 border rounded-xl" value={condForm.operator} onChange={e => setCondForm({ ...condForm, operator: e.target.value })}>
                      <option value="GTE">Lớn hơn hoặc Bằng (&gt;=)</option>
                      <option value="GT">Lớn hơn (&gt;)</option>
                      <option value="EQ">Bằng (=)</option>
                      <option value="LTE">Nhỏ hơn hoặc Bằng (&lt;=)</option>
                      <option value="LT">Nhỏ hơn (&lt;)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Giá trị số</label>
                    <input type="number" required className="w-full h-11 px-4 border rounded-xl" value={condForm.value_num} onChange={e => setCondForm({ ...condForm, value_num: Number(e.target.value) })} />
                  </div>
                </div>
              )}

              {condForm.criteria_type === 'SERVICE_SELECTED' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Chọn Dịch Vụ</label>
                  <SearchableSelect
                    options={services.map(s => ({ value: s.id, label: `${s.item_name} - ${Number(s.service_prices?.[0]?.base_price || 0).toLocaleString()}đ` }))}
                    value={condForm.target_service_id}
                    onChange={(val) => setCondForm({ ...condForm, target_service_id: Number(val) })}
                    placeholder="-- Tìm và chọn dịch vụ --"
                  />
                </div>
              )}

              {condForm.criteria_type === 'CUSTOMER_TYPE' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Nhập Tên Hạng Khách Hàng</label>
                  <input required type="text" placeholder="VD: VIP, GOLD" className="w-full h-11 px-4 border rounded-xl" value={condForm.value_text} onChange={e => setCondForm({ ...condForm, value_text: e.target.value })} />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsCondModalOpen(false)} className="px-4 py-2 border rounded-xl text-slate-600">Hủy</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-amber-500 text-white rounded-xl">Lưu Điều Kiện</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM PHẦN THƯỞNG */}
      {isRewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[500px] max-w-[95vw] p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-emerald-600">Thêm Phần Thưởng</h3>
            <form onSubmit={handleSaveReward} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Loại Phần Thưởng</label>
                <select className="w-full h-11 px-4 border rounded-xl" value={rewForm.reward_type} onChange={e => setRewForm({ ...rewForm, reward_type: e.target.value })}>
                  <option value="DISCOUNT_PERCENT">Giảm giá theo %</option>
                  <option value="FIXED_PRICE">Giảm tiền mặt trực tiếp (VNĐ)</option>
                  <option value="FREE_SERVICE">Tặng kèm dịch vụ miễn phí</option>
                  <option value="FREE_PRODUCT">Tặng Quà hiện vật</option>
                  <option value="CUSTOM_NOTE">Tặng Điểm / Ghi chú khác</option>
                </select>
              </div>

              {['DISCOUNT_PERCENT', 'FIXED_PRICE', 'CUSTOM_NOTE'].includes(rewForm.reward_type) && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {rewForm.reward_type === 'DISCOUNT_PERCENT' ? 'Phần trăm giảm (%)' : rewForm.reward_type === 'FIXED_PRICE' ? 'Số tiền giảm (VNĐ)' : 'Số lượng'}
                  </label>
                  <input type="number" required={rewForm.reward_type !== 'CUSTOM_NOTE'} className="w-full h-11 px-4 border rounded-xl" value={rewForm.reward_value} onChange={e => setRewForm({ ...rewForm, reward_value: Number(e.target.value) })} />
                </div>
              )}

              {rewForm.reward_type === 'FREE_SERVICE' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Chọn Dịch Vụ được tặng</label>
                  <SearchableSelect
                    options={services.map(s => ({ value: s.id, label: `${s.item_name} - ${Number(s.service_prices?.[0]?.base_price || 0).toLocaleString()}đ` }))}
                    value={rewForm.target_service_id}
                    onChange={(val) => setRewForm({ ...rewForm, target_service_id: Number(val) })}
                    placeholder="-- Tìm và chọn dịch vụ --"
                  />
                </div>
              )}

              {['FREE_PRODUCT', 'CUSTOM_NOTE'].includes(rewForm.reward_type) && (
                <div>
                  <label className="block text-sm font-medium mb-1">Mô tả Quà Tặng / Ghi chú</label>
                  <input required type="text" placeholder="VD: Tặng 1 chai dầu gội cao cấp" className="w-full h-11 px-4 border rounded-xl" value={rewForm.gift_description} onChange={e => setRewForm({ ...rewForm, gift_description: e.target.value })} />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsRewModalOpen(false)} className="px-4 py-2 border rounded-xl text-slate-600">Hủy</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-500 text-white rounded-xl">Lưu Phần Thưởng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
