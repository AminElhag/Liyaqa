"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  CreditCard,
  AlertTriangle,
  Clock,
  ChevronRight,
  RefreshCw,
  Phone,
  ExternalLink,
  Send,
  Ban,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@liyaqa/shared/components/ui/tooltip";
import { cn } from "@liyaqa/shared/utils";
import type {
  DunningSequence,
  DunningStatistics,
  DunningSequenceStatus,
} from "@liyaqa/shared/types/platform/dunning";
import { DUNNING_STATUS_CONFIG, formatDunningAmount, getDunningSeverityColor } from "@liyaqa/shared/types/platform/dunning";

/**
 * Props for DunningStatusWidget
 */
interface DunningStatusWidgetProps {
  statistics?: DunningStatistics;
  sequences?: DunningSequence[];
  onRetryPayment?: (dunningId: string) => void;
  onSendPaymentLink?: (dunningId: string) => void;
  onEscalate?: (dunningId: string) => void;
  onViewAll?: () => void;
  onSequenceClick?: (dunningId: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Dunning step timeline indicator
 */
function DunningTimeline({
  currentStep,
  totalSteps,
  daysSinceFailure,
  locale,
}: {
  currentStep: number;
  totalSteps: number;
  daysSinceFailure: number;
  locale: string;
}) {
  const isRtl = locale === "ar";
  const progress = (currentStep / totalSteps) * 100;
  const severityColor = getDunningSeverityColor(daysSinceFailure);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Progress
          value={progress}
          className="h-1.5"
          indicatorClassName={cn(
            severityColor === "red" && "bg-red-500",
            severityColor === "orange" && "bg-orange-500",
            severityColor === "amber" && "bg-amber-500",
            severityColor === "yellow" && "bg-yellow-500"
          )}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {isRtl ? `الخطوة ${currentStep}/${totalSteps}` : `Step ${currentStep}/${totalSteps}`}
      </span>
    </div>
  );
}

/**
 * Dunning sequence row component
 */
function DunningSequenceRow({
  sequence,
  onRetryPayment,
  onSendPaymentLink,
  onEscalate,
  onClick,
  locale,
}: {
  sequence: DunningSequence;
  onRetryPayment?: (dunningId: string) => void;
  onSendPaymentLink?: (dunningId: string) => void;
  onEscalate?: (dunningId: string) => void;
  onClick?: (dunningId: string) => void;
  locale: string;
}) {
  const isRtl = locale === "ar";
  const statusConfig = DUNNING_STATUS_CONFIG[sequence.status];
  const severityColor = getDunningSeverityColor(sequence.daysSinceFailure);

  const texts = {
    retry: isRtl ? "إعادة المحاولة" : "Retry Payment",
    sendLink: isRtl ? "إرسال رابط" : "Send Link",
    escalate: isRtl ? "تصعيد" : "Escalate",
    daysSinceFailure: isRtl ? "يوم منذ الفشل" : "days since failure",
    invoice: isRtl ? "فاتورة" : "Invoice",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group rounded-lg border p-3 hover:bg-muted/50 transition-colors",
        sequence.status === "ESCALATED" && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-3",
          isRtl && "flex-row-reverse"
        )}
      >
        {/* Left: Client info */}
        <button
          onClick={() => onClick?.(sequence.id)}
          className={cn(
            "flex-1 text-left",
            isRtl && "text-right"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                severityColor === "red" && "bg-red-100 dark:bg-red-900/30 text-red-600",
                severityColor === "orange" && "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
                severityColor === "amber" && "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
                severityColor === "yellow" && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
              )}
            >
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {isRtl
                  ? sequence.organizationNameAr || sequence.organizationNameEn
                  : sequence.organizationNameEn}
              </div>
              <div className="text-xs text-muted-foreground">
                {texts.invoice}: {sequence.invoiceNumber}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="font-semibold">
              {formatDunningAmount(sequence.invoiceAmount, sequence.currency)}
            </span>
            <Badge variant="outline" className={cn(statusConfig.color, "border-current")}>
              {isRtl ? statusConfig.labelAr : statusConfig.labelEn}
            </Badge>
            <span className={cn(
              "flex items-center gap-1 text-xs",
              severityColor === "red" && "text-red-600",
              severityColor === "orange" && "text-orange-600",
              severityColor === "amber" && "text-amber-600",
              severityColor === "yellow" && "text-yellow-600"
            )}>
              <Clock className="h-3 w-3" />
              {sequence.daysSinceFailure} {texts.daysSinceFailure}
            </span>
          </div>
        </button>

        {/* Right: Actions */}
        <div
          className={cn(
            "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isRtl && "flex-row-reverse"
          )}
        >
          {sequence.status === "ACTIVE" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetryPayment?.(sequence.id);
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{texts.retry}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendPaymentLink?.(sequence.id);
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{texts.sendLink}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orange-600 hover:text-orange-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEscalate?.(sequence.id);
                      }}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{texts.escalate}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-3">
        <DunningTimeline
          currentStep={sequence.currentStep}
          totalSteps={sequence.totalSteps}
          daysSinceFailure={sequence.daysSinceFailure}
          locale={locale}
        />
      </div>
    </motion.div>
  );
}

/**
 * Statistics bar component
 */
function DunningStats({
  statistics,
  locale,
}: {
  statistics: DunningStatistics;
  locale: string;
}) {
  const isRtl = locale === "ar";

  const stats = [
    {
      value: statistics.activeSequences,
      labelEn: "Active",
      labelAr: "نشط",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      value: statistics.escalatedCount,
      labelEn: "Escalated",
      labelAr: "مصعد",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      alert: statistics.escalatedCount > 0,
    },
    {
      value: `${Math.round(statistics.recoveryRate)}%`,
      labelEn: "Recovery",
      labelAr: "الاسترداد",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      icon: <TrendingUp className="h-3 w-3" />,
    },
    {
      value: formatDunningAmount(statistics.revenueAtRisk, statistics.currency),
      labelEn: "At Risk",
      labelAr: "معرض للخطر",
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg",
            stat.bgColor,
            stat.alert && "ring-1 ring-red-500",
            isRtl && "flex-row-reverse"
          )}
        >
          {stat.icon}
          <div className={isRtl ? "text-right" : ""}>
            <div className={cn("text-sm font-bold", stat.color)}>{stat.value}</div>
            <div className="text-xs text-muted-foreground">
              {isRtl ? stat.labelAr : stat.labelEn}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader
 */
function DunningSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ locale }: { locale: string }) {
  const isRtl = locale === "ar";

  return (
    <div className="text-center py-8 text-muted-foreground">
      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
      <p className="font-medium">
        {isRtl ? "لا توجد مدفوعات متأخرة" : "No overdue payments"}
      </p>
      <p className="text-sm">
        {isRtl
          ? "جميع المدفوعات محدثة"
          : "All payments are up to date"}
      </p>
    </div>
  );
}

/**
 * DunningStatusWidget Component
 * Displays active payment recovery sequences with quick actions.
 */
export function DunningStatusWidget({
  statistics,
  sequences = [],
  onRetryPayment,
  onSendPaymentLink,
  onEscalate,
  onViewAll,
  onSequenceClick,
  isLoading,
  className,
}: DunningStatusWidgetProps) {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  const texts = {
    title: isRtl ? "استرداد المدفوعات" : "Payment Recovery",
    subtitle: isRtl ? "تسلسلات الدفع النشطة" : "Active payment sequences",
    viewAll: isRtl ? "عرض الكل" : "View All",
  };

  const defaultStatistics: DunningStatistics = {
    activeSequences: sequences.length,
    recoveredThisMonth: 0,
    failedThisMonth: 0,
    escalatedCount: sequences.filter((s) => s.status === "ESCALATED").length,
    totalAtRisk: sequences.length,
    revenueAtRisk: sequences.reduce((sum, s) => sum + s.invoiceAmount, 0),
    recoveryRate: 0,
    averageRecoveryDays: 0,
    currency: "SAR",
  };

  const statsData = statistics ?? defaultStatistics;

  // Only show if there are active sequences
  if (!isLoading && sequences.length === 0) {
    return null;
  }

  // Sort by days since failure (most urgent first)
  const sortedSequences = [...sequences].sort(
    (a, b) => b.daysSinceFailure - a.daysSinceFailure
  );

  return (
    <Card className={cn(className, sequences.length > 0 && "border-orange-200 dark:border-orange-800")}>
      <CardHeader className="pb-2">
        <div
          className={cn(
            "flex items-center justify-between",
            isRtl && "flex-row-reverse"
          )}
        >
          <div className={isRtl ? "text-right" : ""}>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              {texts.title}
              {statsData.activeSequences > 0 && (
                <Badge variant="destructive" className="ms-2">
                  {statsData.activeSequences}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{texts.subtitle}</CardDescription>
          </div>

          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              {texts.viewAll}
              <ChevronRight className={cn("h-4 w-4 ms-1", isRtl && "rotate-180")} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <DunningSkeleton />
        ) : sequences.length === 0 ? (
          <EmptyState locale={locale} />
        ) : (
          <>
            <DunningStats statistics={statsData} locale={locale} />
            <div className="space-y-2">
              {sortedSequences.slice(0, 5).map((sequence) => (
                <DunningSequenceRow
                  key={sequence.id}
                  sequence={sequence}
                  onRetryPayment={onRetryPayment}
                  onSendPaymentLink={onSendPaymentLink}
                  onEscalate={onEscalate}
                  onClick={onSequenceClick}
                  locale={locale}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default DunningStatusWidget;
