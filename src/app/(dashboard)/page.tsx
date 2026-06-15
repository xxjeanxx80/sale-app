import Link from "next/link";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [servicesCount, promotionsCount, invoicesCount] = await Promise.all([
    prisma.services.count({ where: { is_active: true } }),
    prisma.promotions.count({ where: { is_active: true } }),
    prisma.invoices.count(),
  ]);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full p-6 md:p-8">
      <div className="flex flex-col gap-2 relative z-10">
        <h1 className="text-display font-display text-on-surface">Tổng quan</h1>
        <p className="text-on-surface-variant font-body-lg">
          Chào mừng quay trở lại hệ thống quản lý Khuyến mãi & Dịch vụ Aura Medical Spa.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-6 md:grid-cols-3 relative z-10">
        {/* Services Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider">Tổng số Dịch vụ</h3>
            <span className="material-symbols-outlined text-primary">medical_services</span>
          </div>
          <div className="relative z-10">
            <div className="text-display font-display text-primary">{servicesCount.toLocaleString()}</div>
            <p className="text-sm text-on-surface-variant mt-1">Đang hoạt động trên hệ thống</p>
          </div>
        </div>

        {/* Promotions Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider">Chương trình Khuyến mãi</h3>
            <span className="material-symbols-outlined text-primary">sell</span>
          </div>
          <div className="relative z-10">
            <div className="text-display font-display text-primary">{promotionsCount.toLocaleString()}</div>
            <p className="text-sm text-on-surface-variant mt-1">Đang hoạt động</p>
          </div>
        </div>

        {/* Bookings Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider">Lượt Bookings</h3>
            <span className="material-symbols-outlined text-primary">event_available</span>
          </div>
          <div className="relative z-10">
            <div className="text-display font-display text-primary">{invoicesCount.toLocaleString()}</div>
            <p className="text-sm text-on-surface-variant mt-1">Tổng số đơn trên hệ thống</p>
          </div>
        </div>
      </div>

      {/* Quick Access Tools */}
      <div className="grid gap-6 md:grid-cols-2 relative z-10">
        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-primary/5 border border-outline-variant/10 flex flex-col h-full">
          <h2 className="font-headline-lg text-on-surface mb-2">Công cụ truy cập nhanh</h2>
          <p className="text-on-surface-variant mb-8">Lựa chọn các chức năng dưới đây để bắt đầu làm việc</p>
          
          <div className="grid gap-4 md:grid-cols-2 flex-1">
            <Link 
              href="/services"
              className="flex flex-col p-6 rounded-xl border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform text-primary">
                <span className="material-symbols-outlined">search</span>
              </div>
              <span className="font-headline-md text-on-surface mb-1">Tra cứu Dịch vụ</span>
              <span className="text-sm text-on-surface-variant">Tìm kiếm tên, mã HIS, danh mục...</span>
            </Link>
            
            <Link 
              href="/booking"
              className="flex flex-col p-6 rounded-xl bg-primary text-white hover:bg-primary/90 hover:shadow-lg transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[100px]">point_of_sale</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md mb-4 group-hover:scale-110 transition-transform relative z-10">
                <span className="material-symbols-outlined text-white">receipt_long</span>
              </div>
              <span className="font-headline-md mb-1 relative z-10">Tính tiền POS</span>
              <span className="text-sm text-white/80 relative z-10">Tạo đơn, áp mã khuyến mãi tự động</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
