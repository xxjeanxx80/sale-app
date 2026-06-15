import { getPromotionById } from '../../../../app/actions/promotions';
import PromotionDetailClient from '../../../../components/custom/PromotionDetailClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Chi tiết Khuyến Mãi',
};

export default async function PromotionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const promotionId = parseInt(resolvedParams.id);
  
  if (isNaN(promotionId)) {
    notFound();
  }

  const promotion = await getPromotionById(promotionId);

  if (!promotion) {
    notFound();
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto w-full p-6 md:p-8 h-[calc(100vh-4rem)] overflow-y-auto pb-20">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/promotions" className="text-primary font-medium flex items-center gap-1 hover:underline mb-2 w-fit">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại danh sách
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display-sm text-display-sm md:font-display-md md:text-display-md font-bold text-on-background tracking-tight">
              {promotion.promotion_name}
            </h1>
            {!promotion.is_active && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                Đã tắt
              </span>
            )}
          </div>
        </div>
      </div>

      <PromotionDetailClient promotion={promotion} />
    </div>
  );
}
