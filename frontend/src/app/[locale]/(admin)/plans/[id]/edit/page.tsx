"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanForm, type PlanFormData } from "@/components/forms/plan-form";
import { usePlan, useUpdatePlan } from "@/queries/use-plans";
import { useToast } from "@/hooks/use-toast";
import { getLocalizedText } from "@/lib/utils";

interface EditPlanPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPlanPage({ params }: EditPlanPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const { data: plan, isLoading, error } = usePlan(id);
  const updatePlan = useUpdatePlan();

  const handleSubmit = async (data: PlanFormData) => {
    try {
      await updatePlan.mutateAsync({
        id,
        data: {
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
        },
      });
      toast({
        title: locale === "ar" ? "تم الحفظ" : "Saved",
        description:
          locale === "ar"
            ? "تم حفظ التغييرات بنجاح"
            : "Changes saved successfully",
      });
      router.push(`/${locale}/plans/${id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في حفظ التغييرات" : "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/plans`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للباقات" : "Back to plans"}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <CreditCard className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>
              {locale === "ar"
                ? "لم يتم العثور على الباقة"
                : "Plan not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/plans/${id}`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للباقة" : "Back to plan"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {locale === "ar" ? "تعديل الباقة" : "Edit Plan"}
        </h1>
        <p className="text-neutral-500">
          {getLocalizedText(plan.name, locale)}
        </p>
      </div>

      <PlanForm
        plan={plan}
        onSubmit={handleSubmit}
        isPending={updatePlan.isPending}
      />
    </div>
  );
}
