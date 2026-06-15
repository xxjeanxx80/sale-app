import EmployeeTable from '../../../components/custom/EmployeeTable';

export const metadata = {
  title: 'Quản lý Nhân Viên',
  description: 'Quản lý danh sách nhân viên, bác sĩ, kỹ thuật viên',
};

export default function EmployeesPage() {
  return (
    <div className="relative z-10 max-w-7xl mx-auto w-full p-6 md:p-8 h-[calc(100vh-4rem)] overflow-y-auto pb-20">
      <div className="mb-6">
        <h1 className="font-display-sm text-display-sm md:font-display-md md:text-display-md font-bold text-on-background tracking-tight">
          Quản lý Nhân Viên
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Quản lý danh sách nhân sự, chức vụ, trạng thái hoạt động và chi nhánh trực thuộc.
        </p>
      </div>

      <EmployeeTable />
    </div>
  );
}
