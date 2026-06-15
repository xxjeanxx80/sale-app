import CategoryTable from '@/components/custom/CategoryTable';

export default function CategoriesPage() {
  return (
    <div className="relative z-10 max-w-7xl mx-auto w-full p-6 md:p-8 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Quản lý Danh mục</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Tổ chức và cấu trúc các dịch vụ của phòng khám. Phân cấp rõ ràng giúp quy trình đặt lịch và POS mượt mà hơn.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="h-[44px] px-6 rounded-2xl bg-transparent border border-outline-variant text-on-surface font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span>Lọc</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Layout for Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Categories Table Card */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
          <CategoryTable />
        </div>

        {/* Side Panel (Quick Stats / Suggestions) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
          {/* Stats Glass Card */}
          <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl shadow-md border border-surface-container-highest p-6">
            <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-4">Tổng quan</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl">
                <div className="font-display text-display text-primary">5</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Danh mục chính</div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl">
                <div className="font-display text-display text-primary">18</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Danh mục con</div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl col-span-2">
                <div className="font-display text-display text-on-surface">35</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Tổng Dịch vụ hoạt động</div>
              </div>
            </div>
          </div>
          
          {/* Informational Card */}
          <div className="bg-primary-container/10 rounded-2xl p-6 border border-primary-container/20 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-primary-container/20">
              <span className="material-symbols-outlined text-[100px]" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary mb-2">
                <span className="material-symbols-outlined">tips_and_updates</span>
                <h4 className="font-label-md text-label-md font-semibold">Mẹo hay</h4>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                Giữ hệ thống phân cấp tinh gọn. Chúng tôi khuyến nghị không nên vượt quá 2 cấp (Chính &gt; Con) để đảm bảo trải nghiệm khách hàng tốt nhất.
              </p>
              <a className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1" href="#">
                Đọc tài liệu <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
