"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanForm, type PlanFormData } from "@/components/forms/plan-form";
import { useCreatePlan } from "@/queries/use-plans";
import { useToast } from "@/hooks/use-toast";

export default function NewPlanPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const createPlan = useCreatePlan();

  const handleSubmit = async (data: PlanFormData) => {
    try {
      const result = await createPlan.mutateAsync({
        name: {
          en: data.name.en,
          ar: data.name.ar || undefined,
        },
        description: data.description?.en || data.description?.ar
          ? {
              en: data.description.en || "",
              ar: data.description.ar || undefined,
            }
          : undefined,

        // Date restrictions
        availableFrom: data.availableFrom || undefined,
        availableUntil: data.availableUntil || undefined,

        // Age restrictions
        minimumAge: data.minimumAge ?? undefined,
        maximumAge: data.maximumAge ?? undefined,

        // Fee structure
        membershipFee: {
          amount: data.membershipFee.amount,
          currency: data.membershipFee.currency,
          taxRate: data.membershipFee.taxRate,
        },
        administrationFee: {
          amount: data.administrationFee.amount,
          currency: data.administrationFee.currency,
          taxRate: data.administrationFee.taxRate,
        },
        joinFee: {
          amount: data.joinFee.amount,
          currency: data.joinFee.currency,
          taxRate: data.joinFee.taxRate,
        },

        // Billing & duration
        billingPeriod: data.billingPeriod,
        durationDays: data.durationDays ?? undefined,
        maxClassesPerPeriod: data.maxClassesPerPeriod ?? undefined,

        // Features
        hasGuestPasses: data.hasGuestPasses,
        guestPassesCount: data.guestPassesCount,
        hasLockerAccess: data.hasLockerAccess,
        hasSaunaAccess: data.hasSaunaAccess,
        hasPoolAccess: data.hasPoolAccess,
        freezeDaysAllowed: data.freezeDaysAllowed,

        // Status
        isActive: data.isActive,
        sortOrder: data.sortOrder,

        // Contract configuration
        categoryId: data.categoryId || undefined,
        contractType: data.contractType,
        supportedTerms: data.supportedTerms,
        defaultCommitmentMonths: data.defaultCommitmentMonths,
        minimumCommitmentMonths: data.minimumCommitmentMonths ?? undefined,
        defaultNoticePeriodDays: data.defaultNoticePeriodDays,
        earlyTerminationFeeType: data.earlyTerminationFeeType,
        earlyTerminationFeeValue: data.earlyTerminationFeeValue ?? undefined,
        coolingOffDays: data.coolingOffDays,
      });
      toast({
        title: locale === "ar" ? "تم الإنشاء" : "Created",
        description:
          locale === "ar"
            ? "تم إنشاء الباقة بنجاح"
            : "Plan created successfully",
      });
      router.push(`/${locale}/plans/${result.id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في إنشاء الباقة" : "Failed to create plan",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/plans`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للباقات" : "Back to plans"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {locale === "ar" ? "إضافة باقة جديدة" : "Add New Plan"}
        </h1>
        <p className="text-neutral-500">
          {locale === "ar"
            ? "أدخل معلومات الباقة الجديدة"
            : "Enter the new plan details"}
        </p>
      </div>

      <PlanForm
        onSubmit={handleSubmit}
        isPending={createPlan.isPending}
      />
    </div>
  );
}
