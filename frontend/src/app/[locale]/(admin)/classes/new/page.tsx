"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateClass } from "@/queries";
import { parseApiError, getLocalizedErrorMessage } from "@/lib/api";
import { ClassWizard, type ClassWizardData } from "@/components/admin/class-wizard";

const texts = {
  en: {
    back: "Back to Classes",
    title: "Create New Class",
    subtitle: "Follow the steps to set up your new class",
  },
  ar: {
    back: "العودة للفصول",
    title: "إنشاء فصل جديد",
    subtitle: "اتبع الخطوات لإعداد فصلك الجديد",
  },
};

export default function NewClassPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const t = texts[locale];
  const isRTL = locale === "ar";

  const [error, setError] = useState<string | null>(null);
  const createClass = useCreateClass();

  const handleSubmit = async (data: ClassWizardData) => {
    setError(null);
    try {
      await createClass.mutateAsync({
        name: {
          en: data.name.en,
          ar: data.name.ar || undefined,
        },
        description: data.description?.en
          ? {
              en: data.description.en,
              ar: data.description.ar || undefined,
            }
          : undefined,
        capacity: data.capacity,
        durationMinutes: data.durationMinutes,
        trainerId: data.trainerId || undefined,
        locationId: data.locationId || undefined,
        // Pricing settings
        pricingModel: data.pricingModel,
        dropInPriceAmount: data.dropInPriceAmount || undefined,
        dropInPriceCurrency: data.dropInPriceCurrency || undefined,
        taxRate: data.taxRate,
        allowNonSubscribers: data.allowNonSubscribers,
        // Booking settings
        advanceBookingDays: data.advanceBookingDays,
        cancellationDeadlineHours: data.cancellationDeadlineHours,
        lateCancellationFeeAmount: data.lateCancellationFeeAmount || undefined,
        lateCancellationFeeCurrency: data.lateCancellationFeeCurrency || undefined,
        schedules: data.schedules,
      });
      router.push(`/${locale}/classes`);
    } catch (err) {
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
    }
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/${locale}/classes`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {t.back}
        </Link>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              "bg-gradient-to-br from-violet-100 to-sky-100",
              "dark:from-violet-900/40 dark:to-sky-900/40"
            )}
          >
            <Sparkles className="h-7 w-7 text-violet-600 dark:text-violet-400" />
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

      {/* Wizard */}
      <ClassWizard
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${locale}/classes`)}
        isSubmitting={createClass.isPending}
      />
    </div>
  );
}
