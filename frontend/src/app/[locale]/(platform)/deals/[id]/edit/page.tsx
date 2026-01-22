"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/spinner";
import { DealForm, type DealFormData } from "@/components/forms/deal-form";
import { useDeal, useUpdateDeal } from "@/queries/platform/use-deals";
import { useAuthStore } from "@/stores/auth-store";
import { getLocalizedText } from "@/lib/utils";

export default function EditDealPage() {
  const params = useParams();
  const dealId = params.id as string;
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: deal, isLoading, error } = useDeal(dealId);
  const updateDeal = useUpdateDeal();

  const texts = {
    back: locale === "ar" ? "العودة إلى الصفقة" : "Back to Deal",
    title: locale === "ar" ? "تعديل الصفقة" : "Edit Deal",
    description:
      locale === "ar" ? "تعديل معلومات الصفقة" : "Update the deal information",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل الصفقة" : "Error loading deal",
    notFound: locale === "ar" ? "الصفقة غير موجودة" : "Deal not found",
    cannotEdit:
      locale === "ar"
        ? "لا يمكن تعديل هذه الصفقة"
        : "This deal cannot be edited",
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
    updateDeal.mutate(
      {
        id: dealId,
        data: {
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
          notesEn: data.notesEn || undefined,
          notesAr: data.notesAr || undefined,
        },
      },
      {
        onSuccess: () => {
          router.push(`/${locale}/deals/${dealId}`);
        },
      }
    );
  };

  const handleCancel = () => {
    router.push(`/${locale}/deals/${dealId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.error : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  // Cannot edit closed deals
  if (!deal.isOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/deals/${dealId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{texts.title}</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {texts.cannotEdit}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/deals/${dealId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">
            {getLocalizedText(deal.title, locale)}
          </p>
        </div>
      </div>

      {/* Form */}
      <DealForm
        deal={deal}
        salesReps={salesReps}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={updateDeal.isPending}
      />
    </div>
  );
}
