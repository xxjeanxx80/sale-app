"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';
import { loginWithPhone } from '@/app/actions/auth';

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

  // Auth States
  const [loggedInEmployee, setLoggedInEmployee] = useState<any>(null);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check saved session
  useEffect(() => {
    const savedUser = localStorage.getItem('pos_user');
    if (savedUser) {
      try {
        setLoggedInEmployee(JSON.parse(savedUser));
      } catch (e) {}
    }
    setIsCheckingSession(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      const res = await loginWithPhone(loginPhone);
      if (res.success && res.user) {
        setLoggedInEmployee(res.user);
        localStorage.setItem('pos_user', JSON.stringify(res.user));
      } else {
        setLoginError(res.message || 'Lỗi đăng nhập');
      }
    } catch (err) {
      setLoginError('Lỗi kết nối máy chủ');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setLoggedInEmployee(null);
    localStorage.removeItem('pos_user');
    setLoginPhone('');
  };

  if (isCheckingSession) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!loggedInEmployee) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-3xl shadow-xl w-[90%] max-w-[400px] min-w-[320px] overflow-hidden border border-slate-100">
            <div className="bg-primary/5 p-8 text-center border-b border-primary/10">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-primary/20">
                 <span className="material-symbols-outlined text-4xl text-primary">point_of_sale</span>
               </div>
               <h2 className="text-2xl font-bold text-slate-800">Đăng nhập Hệ thống</h2>
               <p className="text-slate-500 text-sm mt-2">Dành cho bộ phận Tư vấn viên (Sales)</p>
            </div>
            <form onSubmit={handleLogin} className="p-8 space-y-5">
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại</label>
                 <div className="relative">
                   <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">phone</span>
                   <input 
                     type="text" 
                     value={loginPhone}
                     onChange={e => setLoginPhone(e.target.value)}
                     placeholder="Nhập số điện thoại nhân sự..."
                     className="w-full border-slate-200 rounded-xl focus:ring-primary focus:border-primary py-3 pl-10 pr-4 bg-slate-50 focus:bg-white transition-colors text-slate-800"
                     required
                   />
                 </div>
               </div>
               {loginError && (
                 <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                   <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                   {loginError}
                 </div>
               )}
               <button 
                 type="submit" 
                 disabled={isLoggingIn}
                 className="w-full bg-primary hover:bg-primary-600 text-white font-semibold p-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 mt-2 active:scale-[0.98]"
               >
                 {isLoggingIn ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Đăng nhập vào hệ thống'}
               </button>
            </form>
         </div>
      </div>
    );
  }

  return (
    <div className="font-body-md text-body-md antialiased overflow-hidden bg-surface text-on-background h-screen">
      {/* Top Navigation Bar */}
      <header className={`fixed top-0 right-0 ${isCollapsed ? 'left-20' : 'left-64'} h-16 bg-white/80 backdrop-blur-md border-b border-outline-variant/20 flex items-center justify-between px-8 z-40 transition-all duration-300`}>
        <div className="flex items-center gap-4">
          <h2 className="text-headline-md font-bold text-primary">Ứng dụng Thẩm Mỹ</h2>
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
            <div className="flex flex-col text-right mr-1">
               <span className="font-label-md text-on-surface">{loggedInEmployee.full_name}</span>
               <span className="text-[10px] uppercase font-bold text-slate-500">{loggedInEmployee.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 flex items-center justify-center bg-primary text-white">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Side Navigation Bar */}
      <nav className={`fixed left-0 top-0 h-screen ${isCollapsed ? 'w-20' : 'w-64'} bg-surface-container-low border-r border-outline-variant/20 flex flex-col z-50 transition-all duration-300`}>
        <div className="p-4 mb-4">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-8 mt-2`}>
            <Link href="/" className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : 'flex'} hover:opacity-80 transition-opacity`}>
              <img src="/logos/logo-ngang.png" alt="Aura Logo" className="h-8 object-contain" />
            </Link>
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive
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
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-all ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Đăng xuất" : undefined}>
            <span className="material-symbols-outlined shrink-0">logout</span>
            {!isCollapsed && <span className="font-label-md truncate">Đăng xuất</span>}
          </button>
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
