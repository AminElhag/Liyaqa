"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ChevronLeft, CreditCard } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { usePlan } from "@liyaqa/shared/queries/use-plans";
import { getLocalizedText } from "@liyaqa/shared/utils";
import { PlanWizard } from "@/components/plans/plan-wizard";

interface EditPlanPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPlanPage({ params }: EditPlanPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const isAr = locale === "ar";

  const { data: plan, isLoading, error } = usePlan(id);

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
            {isAr ? "العودة للباقات" : "Back to plans"}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>{isAr ? "لم يتم العثور على الباقة" : "Plan not found"}</p>
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
            {isAr ? "العودة للباقة" : "Back to plan"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {isAr ? "تعديل الباقة" : "Edit Plan"}
        </h1>
        <p className="text-muted-foreground">
          {getLocalizedText(plan.name, locale)}
        </p>
      </div>

      <PlanWizard plan={plan} />
    </div>
  );
}
