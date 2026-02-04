"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { PlanForm, type PlanFormValues } from "@liyaqa/shared/components/platform/plan-form";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useCreateClientPlan } from "@liyaqa/shared/queries/platform/use-client-plans";
import type { CreateClientPlanRequest } from "@liyaqa/shared/types/platform/client-plan";

export default function NewClientPlanPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createPlan = useCreateClientPlan();

  const texts = {
    title: locale === "ar" ? "إنشاء خطة جديدة" : "Create New Plan",
    description:
      locale === "ar"
        ? "أضف خطة اشتراك جديدة للعملاء"
        : "Add a new subscription plan for clients",
    back: locale === "ar" ? "العودة" : "Back",
    successTitle: locale === "ar" ? "تم الإنشاء" : "Created",
    successDesc:
      locale === "ar"
        ? "تم إنشاء الخطة بنجاح"
        : "Plan created successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };

  const handleSubmit = (data: PlanFormValues) => {
    const request: CreateClientPlanRequest = {
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

    createPlan.mutate(request, {
      onSuccess: (plan) => {
        toast({
          title: texts.successTitle,
          description: texts.successDesc,
        });
        router.push(`/${locale}/client-plans/${plan.id}`);
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/client-plans`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Form */}
      <PlanForm
        onSubmit={handleSubmit}
        isLoading={createPlan.isPending}
        mode="create"
      />
    </div>
  );
}
