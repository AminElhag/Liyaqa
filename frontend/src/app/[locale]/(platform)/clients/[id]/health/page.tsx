"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { HealthTrendChart } from "@/components/platform/health-trend-chart";
import { QuickActionMenu } from "@/components/platform/quick-action-menu";
import {
  useClientHealthDetail,
  useClientHealthHistory,
  useRecalculateHealthScore,
  type RiskLevel,
  type HealthTrend,
} from "@/queries/platform/use-health";

/**
 * Risk level configuration
 */
const riskConfig: Record<
  RiskLevel,
  { color: string; bgColor: string; labelEn: string; labelAr: string }
> = {
  LOW: {
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    labelEn: "Healthy",
    labelAr: "صحي",
  },
  MEDIUM: {
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    labelEn: "Monitor",
    labelAr: "مراقبة",
  },
  HIGH: {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    labelEn: "At Risk",
    labelAr: "معرض للخطر",
  },
  CRITICAL: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    labelEn: "Critical",
    labelAr: "حرج",
  },
};

/**
 * Trend icon component
 */
function TrendIcon({ trend, className }: { trend?: HealthTrend; className?: string }) {
  switch (trend) {
    case "IMPROVING":
      return <TrendingUp className={cn("h-4 w-4 text-green-500", className)} />;
    case "DECLINING":
      return <TrendingDown className={cn("h-4 w-4 text-red-500", className)} />;
    default:
      return <Minus className={cn("h-4 w-4 text-muted-foreground", className)} />;
  }
}

/**
 * Score component card
 */
function ScoreComponentCard({
  label,
  labelAr,
  score,
  icon,
  color,
  weight,
  locale,
}: {
  label: string;
  labelAr: string;
  score: number;
  icon: React.ReactNode;
  color: string;
  weight: string;
  locale: string;
}) {
  const isRtl = locale === "ar";

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className={cn("flex items-center justify-between mb-3", isRtl && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
            <div className={cn("p-2 rounded-lg", color)}>{icon}</div>
            <div className={isRtl ? "text-right" : ""}>
              <div className="font-medium">{isRtl ? labelAr : label}</div>
              <div className="text-xs text-muted-foreground">{weight}</div>
            </div>
          </div>
          <div className={cn("text-2xl font-bold", getScoreColor(score))}>{score}</div>
        </div>
        <Progress value={score} className="h-2" />
      </CardContent>
    </Card>
  );
}

/**
 * Intervention card
 */
function InterventionCard({
  intervention,
  onAction,
  locale,
}: {
  intervention: {
    type: string;
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    actionUrl?: string;
  };
  onAction?: (actionUrl: string) => void;
  locale: string;
}) {
  const isRtl = locale === "ar";
  const router = useRouter();

  const priorityConfig = {
    HIGH: { color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", labelEn: "High", labelAr: "عالي" },
    MEDIUM: { color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", labelEn: "Medium", labelAr: "متوسط" },
    LOW: { color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", labelEn: "Low", labelAr: "منخفض" },
  };

  const config = priorityConfig[intervention.priority];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        config.bgColor,
        isRtl && "flex-row-reverse"
      )}
    >
      <Lightbulb className={cn("h-5 w-5 mt-0.5", config.color)} />
      <div className={cn("flex-1", isRtl && "text-right")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">
            {isRtl ? intervention.titleAr : intervention.titleEn}
          </span>
          <Badge variant="outline" className={cn(config.color, "border-current text-xs")}>
            {isRtl ? config.labelAr : config.labelEn}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {isRtl ? intervention.descriptionAr : intervention.descriptionEn}
        </p>
        {intervention.actionUrl && (
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto mt-2"
            onClick={() => router.push(intervention.actionUrl!)}
          >
            {isRtl ? "اتخذ إجراء" : "Take Action"} →
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Signal item
 */
function SignalItem({
  signal,
  locale,
}: {
  signal: {
    type: string;
    titleEn: string;
    titleAr: string;
    value: string;
    impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    weight: number;
  };
  locale: string;
}) {
  const isRtl = locale === "ar";

  const impactConfig = {
    POSITIVE: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: "text-green-600" },
    NEGATIVE: { icon: <AlertTriangle className="h-4 w-4 text-red-500" />, color: "text-red-600" },
    NEUTRAL: { icon: <Minus className="h-4 w-4 text-muted-foreground" />, color: "text-muted-foreground" },
  };

  const config = impactConfig[signal.impact];

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 border-b last:border-0",
        isRtl && "flex-row-reverse"
      )}
    >
      <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
        {config.icon}
        <span>{isRtl ? signal.titleAr : signal.titleEn}</span>
      </div>
      <span className={cn("font-medium", config.color)}>{signal.value}</span>
    </div>
  );
}

/**
 * Client Health Detail Page
 */
export default function ClientHealthDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  const organizationId = params.id as string;

  const texts = {
    title: isRtl ? "صحة العميل" : "Client Health",
    back: isRtl ? "رجوع" : "Back",
    refresh: isRtl ? "تحديث الدرجة" : "Recalculate Score",
    scoreBreakdown: isRtl ? "تفصيل الدرجة" : "Score Breakdown",
    usage: isRtl ? "الاستخدام" : "Usage",
    engagement: isRtl ? "التفاعل" : "Engagement",
    payment: isRtl ? "الدفع" : "Payment",
    support: isRtl ? "الدعم" : "Support",
    recommendedInterventions: isRtl ? "الإجراءات الموصى بها" : "Recommended Interventions",
    noInterventions: isRtl ? "لا توجد إجراءات موصى بها" : "No interventions needed",
    healthSignals: isRtl ? "إشارات الصحة" : "Health Signals",
    noSignals: isRtl ? "لا توجد إشارات" : "No signals",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    overallHealth: isRtl ? "الصحة الإجمالية" : "Overall Health",
    change: isRtl ? "التغيير" : "Change",
  };

  // Fetch data
  const { data: healthDetail, isLoading: detailLoading, refetch } = useClientHealthDetail(organizationId);
  const { data: history, isLoading: historyLoading } = useClientHealthHistory(organizationId, 30);
  const recalculateMutation = useRecalculateHealthScore();

  const handleRecalculate = async () => {
    await recalculateMutation.mutateAsync(organizationId);
    refetch();
  };

  if (detailLoading) {
    return (
      <div className="container mx-auto py-6 text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">{texts.loading}</p>
      </div>
    );
  }

  if (!healthDetail) {
    return (
      <div className="container mx-auto py-6 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Health data not available</p>
      </div>
    );
  }

  const risk = riskConfig[healthDetail.riskLevel];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-4", isRtl && "flex-row-reverse")}>
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className={cn("h-5 w-5", isRtl && "rotate-180")} />
          </Button>
          <div className={isRtl ? "text-right" : ""}>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              {texts.title}
            </h1>
            <p className="text-muted-foreground">
              {isRtl
                ? healthDetail.organizationNameAr || healthDetail.organizationNameEn
                : healthDetail.organizationNameEn}
            </p>
          </div>
        </div>
        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          <QuickActionMenu context="at_risk" entityId={organizationId} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={recalculateMutation.isPending}
          >
            <RefreshCw className={cn("h-4 w-4 me-1", recalculateMutation.isPending && "animate-spin")} />
            {texts.refresh}
          </Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={cn(
              "flex items-center justify-between",
              isRtl && "flex-row-reverse"
            )}
          >
            <div className={cn("flex items-center gap-6", isRtl && "flex-row-reverse")}>
              <div
                className={cn(
                  "h-24 w-24 rounded-full flex items-center justify-center font-bold text-4xl",
                  risk.bgColor,
                  risk.color
                )}
              >
                {healthDetail.overallScore}
              </div>
              <div className={isRtl ? "text-right" : ""}>
                <div className="text-lg font-medium">{texts.overallHealth}</div>
                <Badge variant="outline" className={cn(risk.color, "border-current mt-1")}>
                  {isRtl ? risk.labelAr : risk.labelEn}
                </Badge>
                <div className="flex items-center gap-2 mt-2">
                  <TrendIcon trend={healthDetail.trend} />
                  <span
                    className={cn(
                      "text-sm",
                      healthDetail.scoreChange > 0 && "text-green-600",
                      healthDetail.scoreChange < 0 && "text-red-600"
                    )}
                  >
                    {healthDetail.scoreChange > 0 ? "+" : ""}
                    {healthDetail.scoreChange} {texts.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{texts.scoreBreakdown}</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <ScoreComponentCard
            label={texts.usage}
            labelAr="الاستخدام"
            score={healthDetail.usageScore}
            icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
            color="bg-blue-100 dark:bg-blue-900/30"
            weight="40%"
            locale={locale}
          />
          <ScoreComponentCard
            label={texts.engagement}
            labelAr="التفاعل"
            score={healthDetail.engagementScore}
            icon={<Users className="h-5 w-5 text-purple-600" />}
            color="bg-purple-100 dark:bg-purple-900/30"
            weight="25%"
            locale={locale}
          />
          <ScoreComponentCard
            label={texts.payment}
            labelAr="الدفع"
            score={healthDetail.paymentScore}
            icon={<CreditCard className="h-5 w-5 text-emerald-600" />}
            color="bg-emerald-100 dark:bg-emerald-900/30"
            weight="20%"
            locale={locale}
          />
          <ScoreComponentCard
            label={texts.support}
            labelAr="الدعم"
            score={healthDetail.supportScore}
            icon={<MessageSquare className="h-5 w-5 text-amber-600" />}
            color="bg-amber-100 dark:bg-amber-900/30"
            weight="15%"
            locale={locale}
          />
        </div>
      </div>

      {/* Trend Chart */}
      <HealthTrendChart
        organizationName={
          isRtl
            ? healthDetail.organizationNameAr || healthDetail.organizationNameEn
            : healthDetail.organizationNameEn
        }
        historyData={history}
        currentScore={healthDetail.overallScore}
        scoreChange={healthDetail.scoreChange}
        trend={healthDetail.trend}
        isLoading={historyLoading}
      />

      {/* Interventions & Signals */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recommended Interventions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              {texts.recommendedInterventions}
            </CardTitle>
            <CardDescription>
              {isRtl
                ? "الإجراءات المقترحة لتحسين صحة العميل"
                : "Suggested actions to improve client health"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthDetail.interventions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>{texts.noInterventions}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {healthDetail.interventions.map((intervention, index) => (
                  <InterventionCard
                    key={index}
                    intervention={intervention}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {texts.healthSignals}
            </CardTitle>
            <CardDescription>
              {isRtl
                ? "العوامل المؤثرة على درجة الصحة"
                : "Factors affecting the health score"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthDetail.signals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{texts.noSignals}</p>
              </div>
            ) : (
              <div>
                {healthDetail.signals.map((signal, index) => (
                  <SignalItem key={index} signal={signal} locale={locale} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
