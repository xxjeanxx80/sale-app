import CustomerTable from '../../../components/custom/CustomerTable';

export const metadata = {
  title: 'Quản lý Khách hàng',
  description: 'Quản lý thông tin và danh sách khách hàng của hệ thống',
};

export default function CustomersPage() {
  return (
    <div className="relative z-10 max-w-7xl mx-auto w-full p-6 md:p-8 h-[calc(100vh-4rem)] overflow-y-auto pb-20">
      <div className="mb-6">
        <h1 className="font-display-sm text-display-sm md:font-display-md md:text-display-md font-bold text-on-background tracking-tight">
          Quản lý Khách hàng
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Quản lý thông tin, tra cứu lịch sử mua hàng và cập nhật hồ sơ khách hàng.
        </p>
      </div>

      <CustomerTable />
    </div>
  );
}
