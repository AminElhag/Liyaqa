"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Building2,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  useExitSurveyAnalytics,
  useRetentionMetrics,
} from "@liyaqa/shared/queries/use-admin-contracts";
import { CancellationReasonCategory } from "@liyaqa/shared/types/contract";

export default function ExitSurveyAnalyticsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  // Date range state
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (dateRange) {
      case "7d":
        start.setDate(end.getDate() - 7);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      case "90d":
        start.setDate(end.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  const dateParams = getDateRange();

  // Queries
  const { data: analytics, isLoading: analyticsLoading } = useExitSurveyAnalytics(dateParams);
  const { data: retention, isLoading: retentionLoading } = useRetentionMetrics(dateParams);

  const getReasonLabel = (category: CancellationReasonCategory) => {
    const labels: Record<CancellationReasonCategory, { en: string; ar: string }> = {
      FINANCIAL: { en: "Financial", ar: "مالي" },
      RELOCATION: { en: "Relocation", ar: "انتقال" },
      HEALTH: { en: "Health", ar: "صحي" },
      DISSATISFACTION: { en: "Dissatisfaction", ar: "عدم رضا" },
      USAGE: { en: "Low Usage", ar: "استخدام منخفض" },
      COMPETITION: { en: "Competition", ar: "منافسة" },
      PERSONAL: { en: "Personal", ar: "شخصي" },
      OTHER: { en: "Other", ar: "أخرى" },
    };
    return isArabic ? labels[category].ar : labels[category].en;
  };

  const texts = {
    title: isArabic ? "تحليلات استطلاعات الخروج" : "Exit Survey Analytics",
    description: isArabic
      ? "فهم أسباب إلغاء الأعضاء لاشتراكاتهم"
      : "Understand why members are cancelling their subscriptions",
    dateRange: isArabic ? "الفترة" : "Date Range",
    last7Days: isArabic ? "آخر 7 أيام" : "Last 7 days",
    last30Days: isArabic ? "آخر 30 يوم" : "Last 30 days",
    last90Days: isArabic ? "آخر 90 يوم" : "Last 90 days",
    lastYear: isArabic ? "السنة الماضية" : "Last year",
    totalResponses: isArabic ? "إجمالي الردود" : "Total Responses",
    averageNps: isArabic ? "متوسط NPS" : "Average NPS",
    retentionRate: isArabic ? "معدل الاحتفاظ" : "Retention Rate",
    wouldRecommend: isArabic ? "يوصون بنا" : "Would Recommend",
    cancellationReasons: isArabic ? "أسباب الإلغاء" : "Cancellation Reasons",
    npsBreakdown: isArabic ? "توزيع NPS" : "NPS Breakdown",
    promoters: isArabic ? "المروجين (9-10)" : "Promoters (9-10)",
    passives: isArabic ? "المحايدين (7-8)" : "Passives (7-8)",
    detractors: isArabic ? "المنتقدين (0-6)" : "Detractors (0-6)",
    satisfactionDistribution: isArabic ? "توزيع الرضا" : "Satisfaction Distribution",
    veryDissatisfied: isArabic ? "غير راضٍ جداً" : "Very Dissatisfied",
    dissatisfied: isArabic ? "غير راضٍ" : "Dissatisfied",
    neutral: isArabic ? "محايد" : "Neutral",
    satisfied: isArabic ? "راضٍ" : "Satisfied",
    verySatisfied: isArabic ? "راضٍ جداً" : "Very Satisfied",
    topDissatisfactionAreas: isArabic ? "أكثر مناطق عدم الرضا" : "Top Dissatisfaction Areas",
    competitorAnalysis: isArabic ? "تحليل المنافسين" : "Competitor Analysis",
    retentionMetrics: isArabic ? "مقاييس الاحتفاظ" : "Retention Metrics",
    savedMembers: isArabic ? "أعضاء تم الاحتفاظ بهم" : "Saved Members",
    offerAcceptance: isArabic ? "قبول العروض" : "Offer Acceptance",
    topOffers: isArabic ? "أفضل العروض المقبولة" : "Top Accepted Offers",
    openToFuture: isArabic ? "منفتحون للعودة" : "Open to Future Offers",
    noData: isArabic ? "لا توجد بيانات" : "No data available",
  };

  const isLoading = analyticsLoading || retentionLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{texts.title}</h1>
            <p className="text-muted-foreground">{texts.description}</p>
          </div>
        </div>

        <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 me-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{texts.last7Days}</SelectItem>
            <SelectItem value="30d">{texts.last30Days}</SelectItem>
            <SelectItem value="90d">{texts.last90Days}</SelectItem>
            <SelectItem value="1y">{texts.lastYear}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {texts.totalResponses}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{analytics?.totalResponses ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {texts.averageNps}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {(analytics?.averageNps ?? 0) >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className="text-2xl font-bold">{analytics?.averageNps?.toFixed(1) ?? "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {texts.retentionRate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">
                {retention?.retentionRate?.toFixed(1) ?? 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {texts.wouldRecommend}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {analytics?.wouldRecommendPercentage?.toFixed(0) ?? 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cancellation Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.cancellationReasons}</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.reasonBreakdown?.length ? (
              <div className="space-y-4">
                {analytics.reasonBreakdown.map((reason) => (
                  <div key={reason.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{getReasonLabel(reason.category)}</span>
                      <span className="text-muted-foreground">
                        {reason.count} ({reason.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={reason.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">{texts.noData}</p>
            )}
          </CardContent>
        </Card>

        {/* NPS Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.npsBreakdown}</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.npsDistribution ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      {texts.promoters}
                    </span>
                    <span className="text-muted-foreground">
                      {analytics.npsDistribution.promoters}
                    </span>
                  </div>
                  <Progress
                    value={
                      (analytics.npsDistribution.promoters /
                        (analytics.npsDistribution.promoters +
                          analytics.npsDistribution.passives +
                          analytics.npsDistribution.detractors || 1)) *
                      100
                    }
                    className="h-2 [&>div]:bg-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{texts.passives}</span>
                    <span className="text-muted-foreground">
                      {analytics.npsDistribution.passives}
                    </span>
                  </div>
                  <Progress
                    value={
                      (analytics.npsDistribution.passives /
                        (analytics.npsDistribution.promoters +
                          analytics.npsDistribution.passives +
                          analytics.npsDistribution.detractors || 1)) *
                      100
                    }
                    className="h-2 [&>div]:bg-yellow-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                      {texts.detractors}
                    </span>
                    <span className="text-muted-foreground">
                      {analytics.npsDistribution.detractors}
                    </span>
                  </div>
                  <Progress
                    value={
                      (analytics.npsDistribution.detractors /
                        (analytics.npsDistribution.promoters +
                          analytics.npsDistribution.passives +
                          analytics.npsDistribution.detractors || 1)) *
                      100
                    }
                    className="h-2 [&>div]:bg-red-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">{texts.noData}</p>
            )}
          </CardContent>
        </Card>

        {/* Top Dissatisfaction Areas */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.topDissatisfactionAreas}</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.topDissatisfactionAreas?.length ? (
              <div className="space-y-3">
                {analytics.topDissatisfactionAreas.slice(0, 5).map((area, index) => (
                  <div key={area.area} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 justify-center">
                        {index + 1}
                      </Badge>
                      <span>{area.area}</span>
                    </div>
                    <Badge variant="secondary">{area.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">{texts.noData}</p>
            )}
          </CardContent>
        </Card>

        {/* Competitor Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {texts.competitorAnalysis}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.competitorAnalysis?.length ? (
              <div className="space-y-4">
                {analytics.competitorAnalysis.slice(0, 5).map((competitor) => (
                  <div key={competitor.competitorName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{competitor.competitorName}</span>
                      <Badge>{competitor.count} {isArabic ? "عضو" : "members"}</Badge>
                    </div>
                    {competitor.topReasons.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {competitor.topReasons.slice(0, 3).map((reason) => (
                          <Badge key={reason} variant="outline" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">{texts.noData}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retention Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.retentionMetrics}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {retention?.totalCancellationRequests ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? "طلبات الإلغاء" : "Cancellation Requests"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {retention?.savedMembers ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">{texts.savedMembers}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {retention?.offerAcceptanceRate?.toFixed(0) ?? 0}%
              </p>
              <p className="text-sm text-muted-foreground">{texts.offerAcceptance}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {analytics?.openToFutureOffersPercentage?.toFixed(0) ?? 0}%
              </p>
              <p className="text-sm text-muted-foreground">{texts.openToFuture}</p>
            </div>
          </div>

          {/* Top Accepted Offers */}
          {retention?.topAcceptedOfferTypes?.length ? (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-4">{texts.topOffers}</h4>
              <div className="flex flex-wrap gap-2">
                {retention.topAcceptedOfferTypes.map((offer) => (
                  <Badge key={offer.offerType} variant="secondary" className="text-sm py-1 px-3">
                    {offer.offerType.replace(/_/g, " ")} ({offer.count})
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
