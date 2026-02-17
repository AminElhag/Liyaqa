"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { PlanWizard } from "@/components/plans/plan-wizard";

export default function NewPlanPage() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/plans`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {isAr ? "العودة للباقات" : "Back to plans"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {isAr ? "إنشاء باقة جديدة" : "Create New Plan"}
        </h1>
        <p className="text-muted-foreground">
          {isAr ? "اختر نوع الباقة وأدخل التفاصيل" : "Choose a plan type and enter the details"}
        </p>
      </div>

      <PlanWizard />
    </div>
  );
}
