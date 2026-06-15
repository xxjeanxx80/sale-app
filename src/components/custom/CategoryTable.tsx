'use client';

import { useState, useEffect } from 'react';
import { getCategoriesTree, deleteCategory } from '@/app/actions/categories';
import CategoryModal from './CategoryModal';

const CategoryNode = ({ node, level = 1, expandedIds, toggleExpand, handleEdit, handleDelete, handleAdd }: any) => {
  const isExpanded = expandedIds.has(node.id);
  const children = node.children || [];
  const hasChildren = children.length > 0;

  return (
    <div className={`transition-all duration-200 ${level === 1 ? 'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden' : ''}`}>
      {/* Node Header */}
      <div 
        onClick={() => {
          if (hasChildren) toggleExpand(node.id);
        }}
        className={`flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-colors group ${level > 1 ? 'border-b border-slate-100 bg-white' : ''} ${hasChildren ? 'cursor-pointer' : ''}`}
        style={{ paddingLeft: level > 1 ? `${(level - 1) * 2 + 1}rem` : undefined }}
      >
        <div className="flex items-center gap-3">
          {/* Arrow Icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hasChildren ? (isExpanded ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500') : 'text-slate-300'}`}>
            {hasChildren ? (
              <span className="material-symbols-outlined text-xl transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                chevron_right
              </span>
            ) : level > 1 ? (
              <span className="material-symbols-outlined text-[20px]">subdirectory_arrow_right</span>
            ) : (
              <span className="material-symbols-outlined text-[20px] opacity-0">horizontal_rule</span>
            )}
          </div>
          <div>
            <div className={`text-on-surface flex items-center gap-2 ${level === 1 ? 'font-bold font-label-lg' : 'font-medium'}`}>
              {node.category_name}
            </div>
            <div className="text-xs text-on-surface-variant">Mã: {node.category_code} • {node.total_services || 0} dịch vụ</div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {level === 1 && (
            <button onClick={(e) => handleAdd(node.id, e)} className="px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 border border-primary/20 bg-white">
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span className="hidden sm:inline">Thêm con</span>
            </button>
          )}
          <button onClick={(e) => handleEdit(node, e)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors bg-white border border-slate-200">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button onClick={(e) => handleDelete(node.id, e)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors bg-white border border-slate-200">
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      {/* Children List */}
      {isExpanded && hasChildren && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 ease-out">
          <div className={`${level === 1 ? 'bg-slate-50/50 border-t border-slate-100 p-2 sm:p-4' : 'flex flex-col'}`}>
            <div className={`flex flex-col ${level === 1 ? 'gap-2' : ''}`}>
              {children.map((child: any) => (
                <CategoryNode 
                  key={child.id} 
                  node={child} 
                  level={level + 1} 
                  expandedIds={expandedIds} 
                  toggleExpand={toggleExpand} 
                  handleEdit={handleEdit} 
                  handleDelete={handleDelete} 
                  handleAdd={handleAdd} 
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function CategoryTable() {
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [initialParentId, setInitialParentId] = useState<number>(0);
  
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true);
      try {
        const data = await getCategoriesTree();
        setTree(data);
        // Removed auto-expand logic so trees start collapsed
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [refreshKey]);

  const toggleExpand = (id: number) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      const res = await deleteCategory(id);
      if (res.success) {
        setRefreshKey(k => k + 1);
      } else {
        alert(res.error);
      }
    }
  };

  const handleEdit = (cat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setInitialParentId(0);
    setIsModalOpen(true);
  };

  const handleAdd = (parentId: number = 0, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCategory(null);
    setInitialParentId(parentId);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Cây Danh Mục</h3>
        <button onClick={() => handleAdd(0)} className="bg-gradient-to-r from-primary to-teal-500 text-white rounded-lg px-4 h-10 font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow shrink-0">
          <span className="material-symbols-outlined text-lg">add</span>
          Thêm Danh Mục Chính
        </button>
      </div>

      <div className="p-4 sm:p-6 bg-slate-50 flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-10 text-on-surface-variant font-body-md">Đang tải dữ liệu...</div>
        ) : tree.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant font-body-md">Chưa có danh mục nào.</div>
        ) : (
          <div className="space-y-4">
            {tree.map(mainCat => (
              <CategoryNode 
                key={mainCat.id} 
                node={mainCat} 
                level={1} 
                expandedIds={expandedIds} 
                toggleExpand={toggleExpand} 
                handleEdit={handleEdit} 
                handleDelete={handleDelete} 
                handleAdd={handleAdd} 
              />
            ))}
          </div>
        )}
      </div>

      <CategoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        category={editingCategory}
        initialParentId={initialParentId}
        onSuccess={() => setRefreshKey(k => k + 1)} 
      />
    </div>
  );
}
