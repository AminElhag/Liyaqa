import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  CreditCard,
  Clock,
  ChevronRight,
  RefreshCw,
  Phone,
  Send,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  DunningSequence,
  DunningStatistics,
} from "@/types";
import { DUNNING_STATUS_CONFIG, formatDunningAmount, getDunningSeverityColor } from "@/types";

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
      <div className="flex-1 relative">
        <Progress
          value={progress}
          className="h-1.5"
        />
        {/* Color overlay for severity */}
        <div
          className={cn(
            "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
            severityColor === "red" && "bg-red-500",
            severityColor === "orange" && "bg-orange-500",
            severityColor === "amber" && "bg-amber-500",
            severityColor === "yellow" && "bg-yellow-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {isRtl ? `\u0627\u0644\u062e\u0637\u0648\u0629 ${currentStep}/${totalSteps}` : `Step ${currentStep}/${totalSteps}`}
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
    retry: isRtl ? "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629" : "Retry Payment",
    sendLink: isRtl ? "\u0625\u0631\u0633\u0627\u0644 \u0631\u0627\u0628\u0637" : "Send Link",
    escalate: isRtl ? "\u062a\u0635\u0639\u064a\u062f" : "Escalate",
    daysSinceFailure: isRtl ? "\u064a\u0648\u0645 \u0645\u0646\u0630 \u0627\u0644\u0641\u0634\u0644" : "days since failure",
    invoice: isRtl ? "\u0641\u0627\u062a\u0648\u0631\u0629" : "Invoice",
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
      labelAr: "\u0646\u0634\u0637",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      value: statistics.escalatedCount,
      labelEn: "Escalated",
      labelAr: "\u0645\u0635\u0639\u062f",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      alert: statistics.escalatedCount > 0,
    },
    {
      value: `${Math.round(statistics.recoveryRate)}%`,
      labelEn: "Recovery",
      labelAr: "\u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      icon: <TrendingUp className="h-3 w-3" />,
    },
    {
      value: formatDunningAmount(statistics.revenueAtRisk, statistics.currency),
      labelEn: "At Risk",
      labelAr: "\u0645\u0639\u0631\u0636 \u0644\u0644\u062e\u0637\u0631",
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
function DunningEmptyState({ locale }: { locale: string }) {
  const isRtl = locale === "ar";

  return (
    <div className="text-center py-8 text-muted-foreground">
      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
      <p className="font-medium">
        {isRtl ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u062f\u0641\u0648\u0639\u0627\u062a \u0645\u062a\u0623\u062e\u0631\u0629" : "No overdue payments"}
      </p>
      <p className="text-sm">
        {isRtl
          ? "\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a \u0645\u062d\u062f\u062b\u0629"
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
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const isRtl = locale === "ar";

  const texts = {
    title: isRtl ? "\u0627\u0633\u062a\u0631\u062f\u0627\u062f \u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a" : "Payment Recovery",
    subtitle: isRtl ? "\u062a\u0633\u0644\u0633\u0644\u0627\u062a \u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u0646\u0634\u0637\u0629" : "Active payment sequences",
    viewAll: isRtl ? "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" : "View All",
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
          <DunningEmptyState locale={locale} />
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
