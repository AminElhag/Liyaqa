"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, GitCompare, Check, X, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Checkbox } from "@liyaqa/shared/components/ui/checkbox";
import { cn } from "@liyaqa/shared/utils";
import {
  useClientPlans,
  useComparePlans,
} from "@liyaqa/shared/queries/platform/use-client-plans";
import { FEATURE_CATEGORIES } from "@liyaqa/shared/types/platform/client-plan";
import type { ClientPlan, FeatureKey } from "@liyaqa/shared/types/platform/client-plan";

export default function PlanComparisonPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  const texts = {
    title: isRtl ? "مقارنة الخطط" : "Plan Comparison",
    subtitle: isRtl ? "قارن بين خطط العملاء جنباً إلى جنب" : "Compare client plans side-by-side",
    back: isRtl ? "العودة للخطط" : "Back to Plans",
    selectPlans: isRtl ? "اختر خطتين أو أكثر للمقارنة" : "Select 2 or more plans to compare",
    compare: isRtl ? "مقارنة" : "Compare",
    feature: isRtl ? "الميزة" : "Feature",
    monthlyPrice: isRtl ? "السعر الشهري" : "Monthly Price",
    annualPrice: isRtl ? "السعر السنوي" : "Annual Price",
    maxClubs: isRtl ? "أقصى عدد أندية" : "Max Clubs",
    maxMembers: isRtl ? "أقصى عدد أعضاء" : "Max Members",
    maxStaff: isRtl ? "أقصى عدد موظفين" : "Max Staff",
    maxLocations: isRtl ? "أقصى عدد مواقع" : "Max Locations",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    noPlans: isRtl ? "لا توجد خطط" : "No plans available",
    unlimited: isRtl ? "غير محدود" : "Unlimited",
  };

  const { data: plansData, isLoading: plansLoading } = useClientPlans({ size: 100 });
  const { data: comparisonData, isLoading: comparing } = useComparePlans(selectedPlanIds);

  const allPlans = plansData?.content || [];
  const plansToShow = comparisonData || [];

  const handleTogglePlan = (planId: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId]
    );
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: currency || "SAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div className={isRtl ? "text-right" : ""}>
          <Link
            href={`/${locale}/client-plans`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className={cn("h-4 w-4", isRtl && "rotate-180")} />
            {texts.back}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-primary" />
            {texts.title}
          </h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
      </div>

      {/* Plan Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{texts.selectPlans}</CardTitle>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <div className="text-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {allPlans.map((plan) => (
                <label
                  key={plan.id}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedPlanIds.includes(plan.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  )}
                >
                  <Checkbox
                    checked={selectedPlanIds.includes(plan.id)}
                    onCheckedChange={() => handleTogglePlan(plan.id)}
                  />
                  <span className="text-sm font-medium">
                    {isRtl ? plan.name.ar || plan.name.en : plan.name.en}
                  </span>
                  {!plan.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      {isRtl ? "غير نشط" : "Inactive"}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selectedPlanIds.length >= 2 && (
        <Card>
          <CardContent className="pt-6">
            {comparing ? (
              <div className="text-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : plansToShow.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className={cn("pb-3 font-medium text-muted-foreground", isRtl ? "text-right" : "text-left")}>
                        {texts.feature}
                      </th>
                      {plansToShow.map((plan) => (
                        <th key={plan.id} className="pb-3 font-medium text-center min-w-[150px]">
                          {isRtl ? plan.name.ar || plan.name.en : plan.name.en}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Pricing */}
                    <tr className="border-b bg-muted/30">
                      <td className={cn("py-3 font-medium", isRtl ? "text-right" : "")}>{texts.monthlyPrice}</td>
                      {plansToShow.map((plan) => (
                        <td key={plan.id} className="py-3 text-center font-medium">
                          {formatPrice(plan.monthlyPrice.amount, plan.monthlyPrice.currency)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b bg-muted/30">
                      <td className={cn("py-3 font-medium", isRtl ? "text-right" : "")}>{texts.annualPrice}</td>
                      {plansToShow.map((plan) => (
                        <td key={plan.id} className="py-3 text-center font-medium">
                          {formatPrice(plan.annualPrice.amount, plan.annualPrice.currency)}
                        </td>
                      ))}
                    </tr>

                    {/* Limits */}
                    {[
                      { key: "maxClubs" as const, label: texts.maxClubs },
                      { key: "maxMembers" as const, label: texts.maxMembers },
                      { key: "maxStaffUsers" as const, label: texts.maxStaff },
                      { key: "maxLocationsPerClub" as const, label: texts.maxLocations },
                    ].map(({ key, label }) => (
                      <tr key={key} className="border-b">
                        <td className={cn("py-3", isRtl ? "text-right" : "")}>{label}</td>
                        {plansToShow.map((plan) => (
                          <td key={plan.id} className="py-3 text-center">
                            {plan[key] === -1 || plan[key] >= 999999
                              ? texts.unlimited
                              : plan[key]}
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* Features by category */}
                    {FEATURE_CATEGORIES.map((category) => (
                      <>
                        <tr key={category.id} className="border-b bg-muted/50">
                          <td
                            colSpan={plansToShow.length + 1}
                            className={cn("py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground", isRtl ? "text-right" : "")}
                          >
                            {isRtl ? category.labelAr : category.labelEn}
                          </td>
                        </tr>
                        {category.features.map((feature) => (
                          <tr key={feature.key} className="border-b">
                            <td className={cn("py-2", isRtl ? "text-right" : "")}>
                              <span>{isRtl ? feature.labelAr : feature.labelEn}</span>
                            </td>
                            {plansToShow.map((plan) => (
                              <td key={plan.id} className="py-2 text-center">
                                {plan[feature.key as FeatureKey] ? (
                                  <Check className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
