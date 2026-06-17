'use client';

import dynamic from 'next/dynamic';

const POSClient = dynamic(() => import('./POSClient'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-60px)] md:h-[calc(100vh-4rem)] bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        <span className="text-slate-500 font-medium animate-pulse">Đang tải máy tính tiền...</span>
      </div>
    </div>
  )
});

export default function POSClientWrapper() {
  return <POSClient />;
}
