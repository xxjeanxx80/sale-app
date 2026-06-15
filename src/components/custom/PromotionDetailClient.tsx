'use client';

import { useState } from 'react';
import PromotionCombosTab from './PromotionCombosTab';
import PromotionRulesTab from './PromotionRulesTab';
import PromotionScopeTab from './PromotionScopeTab';
import PromotionModal from './PromotionModal';
import { togglePromotionActive } from '@/app/actions/promotions';
import { useRouter } from 'next/navigation';

export default function PromotionDetailClient({ promotion }: { promotion: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'rules' | 'combos' | 'scope'>('info');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const tabs = [
    { id: 'info', label: 'Thông tin & Quy tắc Chung', icon: 'info' },
    { id: 'rules', label: 'Khuyến mãi Dịch vụ', icon: 'rule' },
    { id: 'combos', label: 'Thiết lập Gói Combo', icon: 'view_cozy' },
    { id: 'scope', label: 'Phạm vi áp dụng', icon: 'storefront' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs Header */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {activeTab === 'info' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center py-4 px-6 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-medium text-lg text-slate-800">Chương trình: {promotion.promotion_name}</p>
                  <button onClick={() => setIsEditModalOpen(true)} className="p-1 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-md flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                </div>
                <p className="text-sm">Trạng thái: {promotion.is_active ? <span className="text-emerald-600 font-medium">Đang Hoạt Động</span> : <span className="text-rose-600 font-medium">Đã Tạm Dừng</span>}</p>
              </div>
              <button 
                onClick={async () => {
                  const res = await togglePromotionActive(promotion.id, !promotion.is_active);
                  if (res.success) router.refresh();
                  else alert(res.error);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${promotion.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promotion.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <PromotionRulesTab promotion={promotion} ruleType="GLOBAL" />
          </div>
        )}

        {activeTab === 'rules' && <PromotionRulesTab promotion={promotion} ruleType="SPECIFIC" />}
        {activeTab === 'combos' && <PromotionCombosTab promotion={promotion} />}
        {activeTab === 'scope' && <PromotionScopeTab promotion={promotion} />}
      </div>

      <PromotionModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        promotion={promotion} 
        onSuccess={() => router.refresh()} 
      />
    </div>
  );
}
