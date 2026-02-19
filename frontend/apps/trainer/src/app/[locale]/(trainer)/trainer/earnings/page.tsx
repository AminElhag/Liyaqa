"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useEarningsSummary } from "@liyaqa/shared/queries/use-trainer-portal";
import { cn, formatCurrency, formatDate } from "@liyaqa/shared/utils";
import type { EarningStatus, EarningType } from "@liyaqa/shared/types/trainer-portal";

const text = {
  title: { en: "Earnings", ar: "الأرباح" },
  subtitle: { en: "Your earnings overview", ar: "نظرة عامة على أرباحك" },
  thisMonth: { en: "This Month", ar: "هذا الشهر" },
  lastMonth: { en: "Last Month", ar: "الشهر الماضي" },
  totalEarnings: { en: "Total Earnings", ar: "إجمالي الأرباح" },
  pending: { en: "Pending", ar: "قيد الانتظار" },
  approved: { en: "Approved", ar: "معتمد" },
  paid: { en: "Paid", ar: "مدفوع" },
  recentEarnings: { en: "Recent Earnings", ar: "الأرباح الأخيرة" },
  noEarnings: { en: "No earnings yet", ar: "لا توجد أرباح بعد" },
  earningsByType: { en: "Earnings by Type", ar: "الأرباح حسب النوع" },
  chartPlaceholder: { en: "Chart Coming Soon", ar: "الرسم البياني قريبا" },
  chartDesc: {
    en: "Detailed earnings charts will be available in a future update.",
    ar: "ستتوفر الرسوم البيانية التفصيلية للأرباح في تحديث مستقبلي.",
  },
  loading: { en: "Loading...", ar: "جاري التحميل..." },
  errorLoading: { en: "Failed to load earnings", ar: "فشل في تحميل الأرباح" },
};

const earningTypeLabels: Record<EarningType, { en: string; ar: string }> = {
  PT_SESSION: { en: "PT Session", ar: "جلسة تدريب شخصي" },
  CLASS_SESSION: { en: "Class Session", ar: "جلسة فصل" },
  BONUS: { en: "Bonus", ar: "مكافأة" },
  COMMISSION: { en: "Commission", ar: "عمولة" },
  ADJUSTMENT: { en: "Adjustment", ar: "تعديل" },
};

const earningStatusConfig: Record<
  EarningStatus,
  { en: string; ar: string; variant: "default" | "secondary" | "success" | "outline" }
> = {
  PENDING: { en: "Pending", ar: "قيد الانتظار", variant: "secondary" },
  APPROVED: { en: "Approved", ar: "معتمد", variant: "default" },
  PAID: { en: "Paid", ar: "مدفوع", variant: "success" },
  CANCELLED: { en: "Cancelled", ar: "ملغاة", variant: "outline" },
};

export default function TrainerEarningsPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);

  const { data: summary, isLoading, error } = useEarningsSummary();

  const statCards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: t("thisMonth"),
        value: formatCurrency(
          summary.currentMonthEarnings.amount,
          summary.currentMonthEarnings.currency,
          locale
        ),
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/30",
      },
      {
        label: t("lastMonth"),
        value: formatCurrency(
          summary.lastMonthEarnings.amount,
          summary.lastMonthEarnings.currency,
          locale
        ),
        icon: TrendingUp,
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
      },
      {
        label: t("totalEarnings"),
        value: formatCurrency(
          summary.totalEarnings.amount,
          summary.totalEarnings.currency,
          locale
        ),
        icon: CheckCircle2,
        color: "text-purple-600",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
      },
      {
        label: t("pending"),
        value: formatCurrency(
          summary.pendingEarnings.amount,
          summary.pendingEarnings.currency,
          locale
        ),
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
      },
    ];
  }, [summary, locale, isAr]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("errorLoading")}
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-24 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", card.bgColor)}>
                        <Icon className={cn("h-5 w-5", card.color)} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {card.label}
                        </p>
                        <p className="text-2xl font-bold font-display text-foreground">
                          {card.value}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings by type */}
        {!isLoading && summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("earningsByType")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(summary.earningsByType).map(
                  ([type, amount]) => {
                    const typeLabel =
                      earningTypeLabels[type as EarningType];
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <span className="text-sm">
                          {typeLabel
                            ? isAr
                              ? typeLabel.ar
                              : typeLabel.en
                            : type}
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(
                            amount.amount,
                            amount.currency,
                            locale
                          )}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Placeholder chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t("chartPlaceholder")}
            </CardTitle>
            <CardDescription>{t("chartDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed">
              <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent earnings */}
      {!isLoading && summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("recentEarnings")}</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.recentEarnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>{t("noEarnings")}</p>
              </div>
            ) : (
              <div className="divide-y">
                {summary.recentEarnings.map((earning) => {
                  const typeLabel =
                    earningTypeLabels[earning.earningType];
                  const statusCfg = earningStatusConfig[earning.status];
                  return (
                    <div
                      key={earning.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {typeLabel
                            ? isAr
                              ? typeLabel.ar
                              : typeLabel.en
                            : earning.earningType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(earning.earningDate, locale)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={statusCfg.variant} className="text-xs">
                          {isAr ? statusCfg.ar : statusCfg.en}
                        </Badge>
                        <span className="text-sm font-bold">
                          {formatCurrency(
                            earning.netAmount.amount,
                            earning.netAmount.currency,
                            locale
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
