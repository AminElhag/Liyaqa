"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

export interface AIInsight {
  id: string;
  type: "warning" | "opportunity" | "info";
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  actionLabelEn: string;
  actionLabelAr: string;
  actionHref: string;
  icon?: React.ElementType;
  metric?: {
    value: number;
    labelEn: string;
    labelAr: string;
  };
}

interface AIInsightsBannerProps {
  insights?: AIInsight[];
  isLoading?: boolean;
  onDismiss?: (id: string) => void;
  dismissedInsights?: string[];
}

const STORAGE_KEY = "liyaqa-dismissed-insights";

// Default insights based on common patterns
const defaultInsights: AIInsight[] = [
  {
    id: "churn-risk",
    type: "warning",
    titleEn: "Members at churn risk",
    titleAr: "أعضاء معرضون لخطر الانسحاب",
    descriptionEn: "5 members haven't visited in over 2 weeks and may need follow-up",
    descriptionAr: "5 أعضاء لم يزوروا منذ أكثر من أسبوعين وقد يحتاجون متابعة",
    actionLabelEn: "View at-risk members",
    actionLabelAr: "عرض الأعضاء المعرضين للخطر",
    actionHref: "/members?risk=high",
    icon: AlertTriangle,
    metric: {
      value: 5,
      labelEn: "members",
      labelAr: "أعضاء",
    },
  },
  {
    id: "renewal-opportunity",
    type: "opportunity",
    titleEn: "Renewal opportunity",
    titleAr: "فرصة تجديد",
    descriptionEn: "12 subscriptions expire this week - consider proactive outreach",
    descriptionAr: "12 اشتراك ينتهي هذا الأسبوع - فكر في التواصل المبكر",
    actionLabelEn: "View expiring",
    actionLabelAr: "عرض المنتهية",
    actionHref: "/subscriptions?filter=expiring",
    icon: Calendar,
    metric: {
      value: 12,
      labelEn: "expiring",
      labelAr: "ينتهي",
    },
  },
  {
    id: "attendance-trend",
    type: "info",
    titleEn: "Attendance trending up",
    titleAr: "اتجاه الحضور صاعد",
    descriptionEn: "Check-ins are up 15% this week compared to last week",
    descriptionAr: "تسجيلات الدخول زادت 15% هذا الأسبوع مقارنة بالأسبوع الماضي",
    actionLabelEn: "View analytics",
    actionLabelAr: "عرض التحليلات",
    actionHref: "/analytics",
    icon: TrendingUp,
    metric: {
      value: 15,
      labelEn: "% increase",
      labelAr: "% زيادة",
    },
  },
];

const typeStyles = {
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800/50",
    icon: "text-amber-500",
    accent: "bg-amber-500",
  },
  opportunity: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800/50",
    icon: "text-green-500",
    accent: "bg-green-500",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800/50",
    icon: "text-blue-500",
    accent: "bg-blue-500",
  },
};

export function AIInsightsBanner({
  insights: propInsights,
  isLoading,
  onDismiss,
  dismissedInsights: propDismissed,
}: AIInsightsBannerProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [isExpanded, setIsExpanded] = React.useState(true);
  const [dismissed, setDismissed] = React.useState<string[]>([]);

  // Load dismissed insights from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDismissed(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleDismiss = (id: string) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
    onDismiss?.(id);
  };

  const allDismissed = propDismissed ?? dismissed;
  const insights = propInsights ?? defaultInsights;
  const visibleInsights = insights.filter((i) => !allDismissed.includes(i.id));

  const texts = {
    title: locale === "ar" ? "رؤى ذكية" : "AI Insights",
    subtitle: locale === "ar"
      ? `${visibleInsights.length} توصيات لك`
      : `${visibleInsights.length} recommendations for you`,
    expand: locale === "ar" ? "توسيع" : "Expand",
    collapse: locale === "ar" ? "طي" : "Collapse",
    dismiss: locale === "ar" ? "إخفاء" : "Dismiss",
  };

  if (isLoading) {
    return (
      <div className="rounded-md3-lg border p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-muted" />
          <div className="h-5 w-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (visibleInsights.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md3-lg border overflow-hidden",
        "bg-gradient-to-r from-violet-50/50 via-purple-50/30 to-fuchsia-50/50",
        "dark:from-violet-950/20 dark:via-purple-950/10 dark:to-fuchsia-950/20",
        "border-violet-200/50 dark:border-violet-800/30"
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-4",
          "hover:bg-violet-100/30 dark:hover:bg-violet-900/20",
          "transition-colors"
        )}
      >
        <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
          <div className="flex items-center justify-center h-8 w-8 rounded-md3-sm bg-violet-100 dark:bg-violet-900/50">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className={cn("text-start", isRtl && "text-end")}>
            <h3 className="font-medium text-foreground">{texts.title}</h3>
            <p className="text-xs text-muted-foreground">{texts.subtitle}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Insights list */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-md3-expand">
          {visibleInsights.map((insight) => {
            const Icon = insight.icon || Sparkles;
            const styles = typeStyles[insight.type];
            const title = isRtl ? insight.titleAr : insight.titleEn;
            const description = isRtl ? insight.descriptionAr : insight.descriptionEn;
            const actionLabel = isRtl ? insight.actionLabelAr : insight.actionLabelEn;
            const metricLabel = insight.metric
              ? isRtl
                ? insight.metric.labelAr
                : insight.metric.labelEn
              : null;

            return (
              <div
                key={insight.id}
                className={cn(
                  "relative flex items-start gap-4 p-4 rounded-md3-md border",
                  styles.bg,
                  styles.border
                )}
              >
                {/* Type indicator bar */}
                <div
                  className={cn(
                    "absolute top-0 bottom-0 w-1 rounded-l-md3-md",
                    styles.accent,
                    isRtl ? "right-0 rounded-l-none rounded-r-md3-md" : "left-0"
                  )}
                />

                <div className={cn("shrink-0 mt-0.5", styles.icon)}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className={cn("flex items-start justify-between gap-2", isRtl && "flex-row-reverse")}>
                    <div className={cn(isRtl && "text-end")}>
                      <h4 className="font-medium text-sm text-foreground">{title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    {insight.metric && (
                      <div className="shrink-0 text-end">
                        <span className={cn("text-lg font-bold", styles.icon)}>
                          {insight.metric.value}
                        </span>
                        <span className="text-xs text-muted-foreground ms-1">{metricLabel}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={cn("flex items-center gap-2 mt-3", isRtl && "flex-row-reverse")}>
                    <Link href={`/${locale}${insight.actionHref}`}>
                      <Button size="sm" variant="secondary" className="h-8 gap-1.5">
                        {actionLabel}
                        <ArrowRight className={cn("h-3 w-3", isRtl && "rotate-180")} />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground"
                      onClick={() => handleDismiss(insight.id)}
                    >
                      {texts.dismiss}
                    </Button>
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  type="button"
                  onClick={() => handleDismiss(insight.id)}
                  className="absolute top-2 text-muted-foreground hover:text-foreground transition-colors"
                  style={{ [isRtl ? "left" : "right"]: "0.5rem" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
