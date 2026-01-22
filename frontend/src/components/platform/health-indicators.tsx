"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlatformHealth, HealthAlert } from "@/types/platform";

interface HealthIndicatorsProps {
  health: PlatformHealth;
}

const SEVERITY_CONFIG: Record<
  HealthAlert["severity"],
  {
    variant: "default" | "secondary" | "destructive" | "warning";
    icon: typeof AlertCircle;
    bgClass: string;
    textClass: string;
  }
> = {
  LOW: {
    variant: "secondary",
    icon: AlertCircle,
    bgClass: "bg-neutral-100",
    textClass: "text-neutral-600",
  },
  MEDIUM: {
    variant: "warning",
    icon: AlertTriangle,
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-600",
  },
  HIGH: {
    variant: "warning",
    icon: AlertTriangle,
    bgClass: "bg-orange-100",
    textClass: "text-orange-600",
  },
  CRITICAL: {
    variant: "destructive",
    icon: XCircle,
    bgClass: "bg-red-100",
    textClass: "text-red-600",
  },
};

const SEVERITY_LABELS: Record<HealthAlert["severity"], { en: string; ar: string }> = {
  LOW: { en: "Low", ar: "منخفض" },
  MEDIUM: { en: "Medium", ar: "متوسط" },
  HIGH: { en: "High", ar: "مرتفع" },
  CRITICAL: { en: "Critical", ar: "حرج" },
};

function getHealthColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

function getHealthBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getHealthLabel(score: number, locale: string): string {
  if (score >= 80) return locale === "ar" ? "ممتاز" : "Excellent";
  if (score >= 60) return locale === "ar" ? "جيد" : "Good";
  if (score >= 40) return locale === "ar" ? "متوسط" : "Fair";
  return locale === "ar" ? "يحتاج اهتمام" : "Needs Attention";
}

export function HealthIndicators({ health }: HealthIndicatorsProps) {
  const locale = useLocale();

  const healthScores = [
    {
      nameEn: "Client Health",
      nameAr: "صحة العملاء",
      score: health.clientHealthScore,
    },
    {
      nameEn: "Payment Health",
      nameAr: "صحة الدفعات",
      score: health.paymentHealthScore,
    },
    {
      nameEn: "Subscription Health",
      nameAr: "صحة الاشتراكات",
      score: health.subscriptionHealthScore,
    },
  ];

  // Sort alerts by severity (CRITICAL first)
  const sortedAlerts = [...health.alerts].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle>
            {locale === "ar" ? "مؤشرات الصحة" : "Health Indicators"}
          </CardTitle>
        </div>
        <CardDescription>
          {locale === "ar"
            ? "نظرة عامة على صحة المنصة"
            : "Platform health overview"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Health Score */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">
              {locale === "ar" ? "الصحة العامة" : "Overall Health"}
            </div>
            <div
              className={cn(
                "text-3xl font-bold",
                getHealthColor(health.overallHealthScore)
              )}
            >
              {health.overallHealthScore}%
            </div>
            <div className="text-sm text-muted-foreground">
              {getHealthLabel(health.overallHealthScore, locale)}
            </div>
          </div>
          <div className="relative w-20 h-20">
            {/* Circular progress indicator */}
            <svg className="w-20 h-20 -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-neutral-200"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(health.overallHealthScore / 100) * 226} 226`}
                strokeLinecap="round"
                className={getHealthColor(health.overallHealthScore)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {health.overallHealthScore >= 60 ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              )}
            </div>
          </div>
        </div>

        {/* Individual Health Scores */}
        <div className="grid gap-3">
          {healthScores.map((item) => (
            <div key={item.nameEn} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {locale === "ar" ? item.nameAr : item.nameEn}
                  </span>
                  <span
                    className={cn("text-sm font-bold", getHealthColor(item.score))}
                  >
                    {item.score}%
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className={cn("h-2 rounded-full", getHealthBgColor(item.score))}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {sortedAlerts.length > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-3">
              {locale === "ar" ? "التنبيهات" : "Alerts"} ({sortedAlerts.length})
            </div>
            <div className="space-y-2">
              {sortedAlerts.slice(0, 5).map((alert, index) => {
                const config = SEVERITY_CONFIG[alert.severity];
                const Icon = config.icon;
                const label = SEVERITY_LABELS[alert.severity];

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg",
                      config.bgClass
                    )}
                  >
                    <Icon className={cn("h-5 w-5 mt-0.5", config.textClass)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{alert.title}</span>
                        <Badge variant={config.variant} className="text-xs">
                          {locale === "ar" ? label.ar : label.en}
                        </Badge>
                        {alert.count > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {alert.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {alert.description}
                      </p>
                      {alert.actionUrl && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-1"
                          asChild
                        >
                          <Link href={alert.actionUrl}>
                            {locale === "ar" ? "عرض التفاصيل" : "View Details"}
                            <ArrowRight className="h-3 w-3 ms-1" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No alerts state */}
        {sortedAlerts.length === 0 && (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-700">
              {locale === "ar"
                ? "لا توجد تنبيهات حاليًا"
                : "No alerts at this time"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
