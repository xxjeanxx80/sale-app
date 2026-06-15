'use client';
import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200" style={{ width: '90%', maxWidth: '32rem', maxHeight: '90vh' }}>
        <div className="p-6 border-b border-surface-container-highest flex justify-between items-center bg-surface-bright">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">{title}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
