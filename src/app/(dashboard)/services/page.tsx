import ServiceTable from '@/components/custom/ServiceTable';

export default function ServicesPage() {
  return (
    <div className="relative z-10 max-w-7xl mx-auto w-full p-6 md:p-8 h-[calc(100vh-4rem)] overflow-y-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-background">Quản lý Dịch vụ</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Quản lý các liệu trình, bảng giá và tình trạng hoạt động.
          </p>
        </div>
      </div>
      
      <ServiceTable />
    </div>
  );
}
