"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { DealForm, type DealFormData } from "@/components/forms/deal-form";
import { useCreateDeal } from "@liyaqa/shared/queries/platform/use-deals";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";

export default function NewDealPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();

  const createDeal = useCreateDeal();

  const texts = {
    back: locale === "ar" ? "العودة إلى الصفقات" : "Back to Deals",
    title: locale === "ar" ? "صفقة جديدة" : "New Deal",
    description:
      locale === "ar" ? "إنشاء صفقة جديدة في مسار المبيعات" : "Create a new deal in your sales pipeline",
  };

  // For now, use the current user as the only sales rep option
  // In a real app, you'd fetch the list of sales reps
  const salesReps = user
    ? [
        {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      ]
    : [];

  const handleSubmit = (data: DealFormData) => {
    createDeal.mutate(
      {
        titleEn: data.titleEn,
        titleAr: data.titleAr || undefined,
        source: data.source,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || undefined,
        companyName: data.companyName || undefined,
        estimatedValueAmount: data.estimatedValueAmount,
        estimatedValueCurrency: data.estimatedValueCurrency,
        probability: data.probability,
        expectedCloseDate: data.expectedCloseDate || undefined,
        interestedPlanId: data.interestedPlanId || undefined,
        salesRepId: data.salesRepId,
        notesEn: data.notesEn || undefined,
        notesAr: data.notesAr || undefined,
      },
      {
        onSuccess: (newDeal) => {
          router.push(`/${locale}/deals/${newDeal.id}`);
        },
      }
    );
  };

  const handleCancel = () => {
    router.push(`/${locale}/deals`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/deals`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Form */}
      <DealForm
        salesReps={salesReps}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createDeal.isPending}
      />
    </div>
  );
}
