"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';

const MENU_ITEMS = [
  { title: 'POS / Tính tiền', href: '/pos', icon: 'point_of_sale' },
  { title: 'Quản lý Hóa đơn', href: '/invoices', icon: 'receipt_long' },
  { title: 'Đặt lịch', href: '/booking', icon: 'calendar_month' },
  { title: 'Danh mục', href: '/categories', icon: 'category' },
  { title: 'Dịch vụ', href: '/services', icon: 'medical_services' },
  { title: 'Khuyến Mãi', href: '/promotions', icon: 'card_giftcard' },
  { title: 'Nhân viên', href: '/employees', icon: 'group' },
  { title: 'Khách hàng', href: '/customers', icon: 'person_book' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="font-body-md text-body-md antialiased overflow-hidden bg-surface text-on-background h-screen">
      {/* Top Navigation Bar */}
      <header className={`fixed top-0 right-0 ${isCollapsed ? 'left-20' : 'left-64'} h-16 bg-white/80 backdrop-blur-md border-b border-outline-variant/20 flex items-center justify-between px-8 z-40 transition-all duration-300`}>
        <div className="flex items-center gap-4">
          <h2 className="text-headline-md font-bold text-primary">Clinic SaleApp</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
          <div className="h-8 w-px bg-outline-variant/20"></div>
          <div className="flex items-center gap-3 cursor-pointer hover:bg-surface-container-high p-2 rounded-xl transition-colors">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 flex items-center justify-center bg-primary text-white">
               <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <span className="font-label-md text-on-surface">Admin</span>
          </div>
        </div>
      </header>

      {/* Side Navigation Bar */}
      <nav className={`fixed left-0 top-0 h-screen ${isCollapsed ? 'w-20' : 'w-64'} bg-surface-container-low border-r border-outline-variant/20 flex flex-col z-50 transition-all duration-300`}>
        <div className="p-4 mb-4">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-8 mt-2`}>
            <div className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : 'flex'}`}>
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <span className="material-symbols-outlined text-white">spa</span>
              </div>
              <h1 className="font-headline-md font-bold text-primary">Aura</h1>
            </div>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-10 h-10 rounded-xl text-primary hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0"
            >
              <span className="material-symbols-outlined">{isCollapsed ? 'menu' : 'menu_open'}</span>
            </button>
          </div>
          <div className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "text-on-surface-variant hover:bg-primary/10 hover:text-primary"
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.title : undefined}
                >
                  <span className="material-symbols-outlined shrink-0">{item.icon}</span>
                  {!isCollapsed && <span className="font-label-md truncate">{item.title}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-outline-variant/20 space-y-1">
          <a href="#" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Hỗ trợ" : undefined}>
            <span className="material-symbols-outlined shrink-0">support_agent</span>
            {!isCollapsed && <span className="font-label-md truncate">Hỗ trợ</span>}
          </a>
          <a href="#" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-all ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Đăng xuất" : undefined}>
            <span className="material-symbols-outlined shrink-0">logout</span>
            {!isCollapsed && <span className="font-label-md truncate">Đăng xuất</span>}
          </a>
        </div>
      </nav>

      {/* Main Layout Workspace */}
      <main className={`pt-16 h-full flex relative bg-surface transition-all duration-300 ${isCollapsed ? 'ml-20 w-[calc(100%-5rem)]' : 'ml-64 w-[calc(100%-16rem)]'}`}>
        {/* Background decorative elements for the 'neo-medical' feel */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary-container/5 blur-3xl"></div>
          <div className="absolute top-[60%] -left-[10%] w-[50%] h-[50%] rounded-full bg-secondary-container/10 blur-3xl"></div>
        </div>
        
        {children}
      </main>
    </div>
  );
}
