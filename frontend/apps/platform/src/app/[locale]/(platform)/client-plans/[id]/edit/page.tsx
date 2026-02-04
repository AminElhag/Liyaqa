"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { getLocalizedText } from "@liyaqa/shared/utils";
import { PlanForm, type PlanFormValues } from "@liyaqa/shared/components/platform/plan-form";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useClientPlan,
  useUpdateClientPlan,
} from "@liyaqa/shared/queries/platform/use-client-plans";
import type { UpdateClientPlanRequest } from "@liyaqa/shared/types/platform/client-plan";

export default function EditClientPlanPage() {
  const params = useParams();
  const planId = params.id as string;
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  // Data fetching
  const { data: plan, isLoading, error } = useClientPlan(planId);

  // Mutation
  const updatePlan = useUpdateClientPlan();

  const texts = {
    title: locale === "ar" ? "تعديل الخطة" : "Edit Plan",
    back: locale === "ar" ? "العودة" : "Back",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    notFound: locale === "ar" ? "الخطة غير موجودة" : "Plan not found",
    errorLoading:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    successTitle: locale === "ar" ? "تم التحديث" : "Updated",
    successDesc:
      locale === "ar"
        ? "تم تحديث الخطة بنجاح"
        : "Plan updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };


  const handleSubmit = (data: PlanFormValues) => {
    const request: UpdateClientPlanRequest = {
      nameEn: data.nameEn,
      nameAr: data.nameAr || undefined,
      descriptionEn: data.descriptionEn || undefined,
      descriptionAr: data.descriptionAr || undefined,
      monthlyPriceAmount: data.monthlyPriceAmount,
      monthlyPriceCurrency: data.monthlyPriceCurrency,
      annualPriceAmount: data.annualPriceAmount,
      annualPriceCurrency: data.annualPriceCurrency,
      billingCycle: data.billingCycle,
      maxClubs: data.maxClubs,
      maxLocationsPerClub: data.maxLocationsPerClub,
      maxMembers: data.maxMembers,
      maxStaffUsers: data.maxStaffUsers,
      hasAdvancedReporting: data.hasAdvancedReporting,
      hasApiAccess: data.hasApiAccess,
      hasPrioritySupport: data.hasPrioritySupport,
      hasWhiteLabeling: data.hasWhiteLabeling,
      hasCustomIntegrations: data.hasCustomIntegrations,
      sortOrder: data.sortOrder,
    };

    updatePlan.mutate(
      { id: planId, data: request },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.successDesc,
          });
          router.push(`/${locale}/client-plans/${planId}`);
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorLoading : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  // Transform plan data to form default values
  const defaultValues: Partial<PlanFormValues> = {
    nameEn: plan.name.en,
    nameAr: plan.name.ar || "",
    descriptionEn: plan.description?.en || "",
    descriptionAr: plan.description?.ar || "",
    monthlyPriceAmount: plan.monthlyPrice.amount,
    monthlyPriceCurrency: plan.monthlyPrice.currency,
    annualPriceAmount: plan.annualPrice.amount,
    annualPriceCurrency: plan.annualPrice.currency,
    billingCycle: plan.billingCycle,
    maxClubs: plan.maxClubs,
    maxLocationsPerClub: plan.maxLocationsPerClub,
    maxMembers: plan.maxMembers,
    maxStaffUsers: plan.maxStaffUsers,
    hasAdvancedReporting: plan.hasAdvancedReporting,
    hasApiAccess: plan.hasApiAccess,
    hasPrioritySupport: plan.hasPrioritySupport,
    hasWhiteLabeling: plan.hasWhiteLabeling,
    hasCustomIntegrations: plan.hasCustomIntegrations,
    sortOrder: plan.sortOrder,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/client-plans/${planId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{getLocalizedText(plan.name, locale)}</p>
        </div>
      </div>

      {/* Form */}
      <PlanForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isLoading={updatePlan.isPending}
        mode="edit"
      />
    </div>
  );
}
