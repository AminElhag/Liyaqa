"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  CreditCard,
  Download,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Phone,
  Ban,
  DollarSign,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import { ScrollArea } from "@liyaqa/shared/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@liyaqa/shared/components/ui/tooltip";
import { cn } from "@liyaqa/shared/utils";
import {
  useActiveDunning,
  useDunningStatistics,
  useRetryPayment,
  useSendPaymentLink,
  useEscalateToCsm,
  useRevenueAtRisk,
} from "@liyaqa/shared/queries/platform/use-dunning";
import type { DunningSequence, DunningSequenceStatus } from "@liyaqa/shared/types/platform/dunning";
import {
  DUNNING_STATUS_CONFIG,
  formatDunningAmount,
  getDunningSeverityColor,
} from "@liyaqa/shared/types/platform/dunning";

/**
 * Timeline step component
 */
function TimelineStep({
  step,
  isActive,
  isCompleted,
  locale,
}: {
  step: { day: number; titleEn: string; titleAr: string };
  isActive: boolean;
  isCompleted: boolean;
  locale: string;
}) {
  const isRtl = locale === "ar";

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
          isCompleted && "bg-green-500 text-white",
          isActive && "bg-orange-500 text-white ring-2 ring-orange-200",
          !isCompleted && !isActive && "bg-muted text-muted-foreground"
        )}
      >
        {isCompleted ? <CheckCircle className="h-3 w-3" /> : step.day}
      </div>
      <span
        className={cn(
          "text-xs",
          isActive && "font-medium",
          !isCompleted && !isActive && "text-muted-foreground"
        )}
      >
        {isRtl ? step.titleAr : step.titleEn}
      </span>
    </div>
  );
}

/**
 * Dunning Dashboard Page
 */
export default function DunningDashboardPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [statusFilter, setStatusFilter] = useState<DunningSequenceStatus | "ALL">("ACTIVE");
  const [searchTerm, setSearchTerm] = useState("");

  const texts = {
    title: isRtl ? "استرداد المدفوعات" : "Payment Recovery",
    subtitle: isRtl ? "إدارة تسلسلات استرداد المدفوعات" : "Manage payment recovery sequences",
    search: isRtl ? "البحث عن عميل..." : "Search clients...",
    status: isRtl ? "الحالة" : "Status",
    all: isRtl ? "الكل" : "All",
    export: isRtl ? "تصدير" : "Export",
    refresh: isRtl ? "تحديث" : "Refresh",
    activeSequences: isRtl ? "تسلسلات نشطة" : "Active Sequences",
    recovered: isRtl ? "تم الاسترداد" : "Recovered",
    escalated: isRtl ? "مصعد" : "Escalated",
    revenueAtRisk: isRtl ? "الإيرادات المعرضة للخطر" : "Revenue at Risk",
    recoveryRate: isRtl ? "معدل الاسترداد" : "Recovery Rate",
    avgRecoveryDays: isRtl ? "متوسط أيام الاسترداد" : "Avg Recovery Days",
    noSequences: isRtl ? "لا توجد تسلسلات" : "No sequences",
    allClear: isRtl ? "جميع المدفوعات محدثة" : "All payments up to date",
    daysSinceFailure: isRtl ? "يوم منذ الفشل" : "days since failure",
    invoice: isRtl ? "فاتورة" : "Invoice",
    retry: isRtl ? "إعادة المحاولة" : "Retry",
    sendLink: isRtl ? "إرسال رابط" : "Send Link",
    escalate: isRtl ? "تصعيد" : "Escalate",
    timeline: isRtl ? "الجدول الزمني" : "Timeline",
  };

  // Fetch data
  const { data: sequences, isLoading: sequencesLoading, refetch } = useActiveDunning(100);
  const { data: statistics, isLoading: statsLoading } = useDunningStatistics();
  const { data: revenueAtRisk } = useRevenueAtRisk();

  // Mutations
  const retryMutation = useRetryPayment();
  const sendLinkMutation = useSendPaymentLink();
  const escalateMutation = useEscalateToCsm();

  // Filter sequences
  const filteredSequences = (sequences || []).filter((seq) => {
    if (statusFilter !== "ALL" && seq.status !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        seq.organizationNameEn.toLowerCase().includes(search) ||
        (seq.organizationNameAr || "").toLowerCase().includes(search) ||
        seq.invoiceNumber.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleRetry = async (dunningId: string) => {
    await retryMutation.mutateAsync(dunningId);
  };

  const handleSendLink = async (dunningId: string) => {
    await sendLinkMutation.mutateAsync(dunningId);
  };

  const handleEscalate = async (dunningId: string) => {
    await escalateMutation.mutateAsync({ dunningId });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div className={isRtl ? "text-right" : ""}>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            {texts.title}
          </h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 me-1" />
            {texts.refresh}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 me-1" />
            {texts.export}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{texts.activeSequences}</p>
                <p className="text-2xl font-bold text-orange-600">
                  {statistics?.activeSequences || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{texts.recovered}</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics?.recoveredThisMonth || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{texts.escalated}</p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics?.escalatedCount || 0}
                </p>
              </div>
              <Phone className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{texts.recoveryRate}</p>
                <p className="text-2xl font-bold">
                  {Math.round(statistics?.recoveryRate || 0)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{texts.revenueAtRisk}</p>
                <p className="text-xl font-bold text-amber-600">
                  {formatDunningAmount(
                    revenueAtRisk?.total || statistics?.revenueAtRisk || 0,
                    statistics?.currency || "SAR"
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={cn(
              "flex flex-wrap items-center gap-4",
              isRtl && "flex-row-reverse"
            )}
          >
            <Input
              placeholder={texts.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as DunningSequenceStatus | "ALL")}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="ACTIVE">{isRtl ? "نشط" : "Active"}</SelectItem>
                <SelectItem value="RECOVERED">{isRtl ? "مسترد" : "Recovered"}</SelectItem>
                <SelectItem value="ESCALATED">{isRtl ? "مصعد" : "Escalated"}</SelectItem>
                <SelectItem value="FAILED">{isRtl ? "فاشل" : "Failed"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sequences List */}
      <Card>
        <CardHeader>
          <CardTitle>{isRtl ? "تسلسلات الاسترداد" : "Recovery Sequences"}</CardTitle>
          <CardDescription>
            {isRtl
              ? "تتبع ومعالجة المدفوعات الفاشلة"
              : "Track and process failed payments"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sequencesLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredSequences.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">{texts.noSequences}</p>
              <p className="text-sm text-muted-foreground">{texts.allClear}</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredSequences.map((seq) => {
                  const statusConfig = DUNNING_STATUS_CONFIG[seq.status];
                  const severityColor = getDunningSeverityColor(seq.daysSinceFailure);

                  const timelineSteps = [
                    { day: 0, titleEn: "Alert", titleAr: "تنبيه" },
                    { day: 1, titleEn: "Email", titleAr: "بريد" },
                    { day: 3, titleEn: "Follow-up", titleAr: "متابعة" },
                    { day: 5, titleEn: "Warning", titleAr: "تحذير" },
                    { day: 7, titleEn: "Final", titleAr: "نهائي" },
                  ];

                  return (
                    <motion.div
                      key={seq.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "rounded-lg border p-4",
                        seq.status === "ESCALATED" &&
                          "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-start justify-between gap-4",
                          isRtl && "flex-row-reverse"
                        )}
                      >
                        {/* Client info */}
                        <div className={cn("flex-1", isRtl && "text-right")}>
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center",
                                severityColor === "red" &&
                                  "bg-red-100 dark:bg-red-900/30 text-red-600",
                                severityColor === "orange" &&
                                  "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
                                severityColor === "amber" &&
                                  "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
                                severityColor === "yellow" &&
                                  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                              )}
                            >
                              <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {isRtl
                                  ? seq.organizationNameAr || seq.organizationNameEn
                                  : seq.organizationNameEn}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {texts.invoice}: {seq.invoiceNumber}
                              </div>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "flex items-center gap-4 text-sm",
                              isRtl && "flex-row-reverse"
                            )}
                          >
                            <span className="font-semibold text-lg">
                              {formatDunningAmount(seq.invoiceAmount, seq.currency)}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(statusConfig.color, "border-current")}
                            >
                              {isRtl ? statusConfig.labelAr : statusConfig.labelEn}
                            </Badge>
                            <span
                              className={cn(
                                "flex items-center gap-1",
                                severityColor === "red" && "text-red-600",
                                severityColor === "orange" && "text-orange-600",
                                severityColor === "amber" && "text-amber-600",
                                severityColor === "yellow" && "text-yellow-600"
                              )}
                            >
                              <Clock className="h-4 w-4" />
                              {seq.daysSinceFailure} {texts.daysSinceFailure}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        {seq.status === "ACTIVE" && (
                          <div
                            className={cn(
                              "flex items-center gap-2",
                              isRtl && "flex-row-reverse"
                            )}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRetry(seq.id)}
                                    disabled={retryMutation.isPending}
                                  >
                                    <RefreshCw className="h-4 w-4 me-1" />
                                    {texts.retry}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isRtl ? "إعادة محاولة الدفع" : "Retry payment"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSendLink(seq.id)}
                                    disabled={sendLinkMutation.isPending}
                                  >
                                    <Send className="h-4 w-4 me-1" />
                                    {texts.sendLink}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isRtl ? "إرسال رابط الدفع" : "Send payment link"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleEscalate(seq.id)}
                                    disabled={escalateMutation.isPending}
                                  >
                                    <Phone className="h-4 w-4 me-1" />
                                    {texts.escalate}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isRtl
                                    ? "تصعيد إلى مدير نجاح العميل"
                                    : "Escalate to CSM"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>

                      {/* Timeline */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-xs text-muted-foreground mb-2">{texts.timeline}</div>
                        <div
                          className={cn(
                            "flex items-center gap-4 overflow-x-auto pb-2",
                            isRtl && "flex-row-reverse"
                          )}
                        >
                          {timelineSteps.map((step, index) => (
                            <div
                              key={step.day}
                              className={cn(
                                "flex items-center",
                                isRtl && "flex-row-reverse"
                              )}
                            >
                              <TimelineStep
                                step={step}
                                isActive={seq.currentStep === index + 1}
                                isCompleted={seq.currentStep > index + 1}
                                locale={locale}
                              />
                              {index < timelineSteps.length - 1 && (
                                <ChevronRight
                                  className={cn(
                                    "h-4 w-4 text-muted-foreground mx-1",
                                    isRtl && "rotate-180"
                                  )}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <Progress
                          value={(seq.currentStep / seq.totalSteps) * 100}
                          className="h-1 mt-2"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
