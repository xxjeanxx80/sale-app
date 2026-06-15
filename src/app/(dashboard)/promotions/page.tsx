import PromotionTable from '../../../components/custom/PromotionTable';

export const metadata = {
  title: 'Quản lý Khuyến Mãi',
  description: 'Quản lý các chương trình khuyến mãi và giảm giá',
};

export default function PromotionsPage() {
  return (
    <div className="relative z-10 max-w-7xl mx-auto w-full p-6 md:p-8 h-[calc(100vh-4rem)] overflow-y-auto pb-20">
      <div className="mb-6">
        <h1 className="font-display-sm text-display-sm md:font-display-md md:text-display-md font-bold text-on-background tracking-tight">
          Quản lý Khuyến Mãi
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Quản lý các chương trình giảm giá, thiết lập điều kiện và phần thưởng.
        </p>
      </div>

      <PromotionTable />
    </div>
  );
}
