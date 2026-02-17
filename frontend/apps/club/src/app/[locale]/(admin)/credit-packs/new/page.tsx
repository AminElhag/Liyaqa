"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Ticket } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { useCreateClassPack } from "@liyaqa/shared/queries";
import { HTTPError } from "ky";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";
import type { ServiceType } from "@liyaqa/shared/types/scheduling";
import {
  ClassPackForm,
  type ClassPackFormData,
} from "@/components/admin/class-pack-form";

const SERVICE_TYPE_OPTIONS: Array<{
  value: ServiceType;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  color: string;
}> = [
  {
    value: "GX",
    labelEn: "Group Exercise",
    labelAr: "تمارين جماعية",
    descEn: "Credits for group fitness classes",
    descAr: "رصيد لحصص اللياقة الجماعية",
    color: "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
  },
  {
    value: "PT",
    labelEn: "Personal Training",
    labelAr: "تدريب شخصي",
    descEn: "Credits for personal training sessions",
    descAr: "رصيد لجلسات التدريب الشخصي",
    color: "border-purple-500 bg-purple-50 dark:bg-purple-950/30",
  },
  {
    value: "GOODS",
    labelEn: "Goods",
    labelAr: "منتجات",
    descEn: "Credits for purchasing goods and products",
    descAr: "رصيد لشراء المنتجات والبضائع",
    color: "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
  },
];

const texts = {
  en: {
    back: "Back to Credit Packs",
    title: "Create New Credit Pack",
    subtitle: "Create a credit bundle for members to purchase",
    serviceTypeTitle: "Service Type",
    serviceTypeDesc: "Select the type of service this credit pack is for",
  },
  ar: {
    back: "العودة لباقات الرصيد",
    title: "إنشاء باقة رصيد جديدة",
    subtitle: "إنشاء باقة رصيد ليشتريها الأعضاء",
    serviceTypeTitle: "نوع الخدمة",
    serviceTypeDesc: "اختر نوع الخدمة التي تخصها هذه الباقة",
  },
};

export default function NewCreditPackPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const t = texts[locale];
  const isRTL = locale === "ar";

  const [error, setError] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("GX");
  const createPack = useCreateClassPack();

  const handleSubmit = async (data: ClassPackFormData) => {
    setError(null);
    try {
      await createPack.mutateAsync({
        nameEn: data.nameEn,
        nameAr: data.nameAr || undefined,
        descriptionEn: data.descriptionEn || undefined,
        descriptionAr: data.descriptionAr || undefined,
        classCount: data.classCount,
        priceAmount: data.priceAmount,
        priceCurrency: data.priceCurrency,
        taxRate: data.taxRate,
        validityDays: data.validityDays || undefined,
        sortOrder: data.sortOrder,
        imageUrl: data.imageUrl || undefined,
        serviceType,
        allocationMode: serviceType === "GX" ? data.allocationMode : "FLAT",
        categoryAllocations:
          serviceType === "GX" &&
          data.allocationMode === "PER_CATEGORY" &&
          data.categoryAllocations?.length
            ? data.categoryAllocations.map((a) => ({
                categoryId: a.categoryId,
                creditCount: a.creditCount,
              }))
            : undefined,
      });
      router.push(`/${locale}/credit-packs`);
    } catch (err) {
      if (err instanceof HTTPError) {
        const body = await err.response.clone().text();
        console.error("Credit pack creation error response:", body);
      }
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
    }
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/${locale}/credit-packs`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {t.back}
        </Link>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              "bg-gradient-to-br from-emerald-100 to-teal-100",
              "dark:from-emerald-900/40 dark:to-teal-900/40"
            )}
          >
            <Ticket className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Service Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t.serviceTypeTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.serviceTypeDesc}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SERVICE_TYPE_OPTIONS.map((option) => {
              const isSelected = serviceType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setServiceType(option.value)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-start transition-colors",
                    isSelected
                      ? option.color
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <span className="font-medium text-sm">
                    {locale === "ar" ? option.labelAr : option.labelEn}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {locale === "ar" ? option.descAr : option.descEn}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form - show/hide category allocations based on service type */}
      <ClassPackForm
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${locale}/credit-packs`)}
        isSubmitting={createPack.isPending}
        hideCategoryAllocations={serviceType !== "GX"}
      />
    </div>
  );
}
