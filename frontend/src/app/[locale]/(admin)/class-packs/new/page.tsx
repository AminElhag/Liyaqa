"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateClassPack } from "@/queries";
import { parseApiError, getLocalizedErrorMessage } from "@/lib/api";
import {
  ClassPackForm,
  type ClassPackFormData,
} from "@/components/admin/class-pack-form";

const texts = {
  en: {
    back: "Back to Class Packs",
    title: "Create New Class Pack",
    subtitle: "Create a class credit bundle for members to purchase",
  },
  ar: {
    back: "العودة لباقات الحصص",
    title: "إنشاء باقة حصص جديدة",
    subtitle: "إنشاء باقة حصص ليشتريها الأعضاء",
  },
};

export default function NewClassPackPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const t = texts[locale];
  const isRTL = locale === "ar";

  const [error, setError] = useState<string | null>(null);
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
      });
      router.push(`/${locale}/class-packs`);
    } catch (err) {
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
          href={`/${locale}/class-packs`}
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
            <Package className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
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

      {/* Form */}
      <ClassPackForm
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${locale}/class-packs`)}
        isSubmitting={createPack.isPending}
      />
    </div>
  );
}
