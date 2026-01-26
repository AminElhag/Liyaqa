"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Calculator,
  Calendar,
  DollarSign,
  Users,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useRevenueForecasts,
  useMembershipForecasts,
  useBudgetSummary,
  useSeasonalityPatterns,
  useGenerateForecast,
} from "@/queries/use-forecasting";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ForecastPeriod = 30 | 60 | 90;

export default function ForecastingDashboardPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { toast } = useToast();

  const [forecastDays, setForecastDays] = useState<ForecastPeriod>(30);
  const currentYear = new Date().getFullYear();

  const {
    data: revenueForecasts,
    isLoading: revenueLoading,
    refetch: refetchRevenue,
  } = useRevenueForecasts(forecastDays);
  const {
    data: membershipForecasts,
    isLoading: membershipLoading,
    refetch: refetchMembership,
  } = useMembershipForecasts(forecastDays);
  const { data: budgetSummary, isLoading: budgetLoading } =
    useBudgetSummary(currentYear);
  const { data: seasonality, isLoading: seasonalityLoading } =
    useSeasonalityPatterns();
  const generateForecast = useGenerateForecast();

  const isLoading =
    revenueLoading || membershipLoading || budgetLoading || seasonalityLoading;

  // Calculate summary metrics
  const revenueSummary = useMemo(() => {
    if (!revenueForecasts || revenueForecasts.length === 0) return null;
    const total = revenueForecasts.reduce(
      (sum, f) => sum + f.predictedValue,
      0
    );
    const avgConfidence =
      revenueForecasts.reduce((sum, f) => sum + (f.confidenceScore || 0), 0) /
      revenueForecasts.length;
    return { total, avgConfidence, count: revenueForecasts.length };
  }, [revenueForecasts]);

  const membershipSummary = useMemo(() => {
    if (!membershipForecasts || membershipForecasts.length === 0) return null;
    const latestForecast = membershipForecasts[membershipForecasts.length - 1];
    const firstForecast = membershipForecasts[0];
    const growth = latestForecast.predictedValue - firstForecast.predictedValue;
    const growthPercent =
      firstForecast.predictedValue > 0
        ? (growth / firstForecast.predictedValue) * 100
        : 0;
    return {
      current: firstForecast.predictedValue,
      projected: latestForecast.predictedValue,
      growth,
      growthPercent,
    };
  }, [membershipForecasts]);

  const texts = {
    title: isArabic ? "التنبؤ بالمبيعات" : "Sales Forecasting",
    subtitle: isArabic
      ? "توقعات الإيرادات والعضوية"
      : "Revenue and membership predictions",
    revenue: isArabic ? "الإيرادات" : "Revenue",
    membership: isArabic ? "العضوية" : "Membership",
    budget: isArabic ? "الميزانية" : "Budget",
    seasonality: isArabic ? "الموسمية" : "Seasonality",
    next30: isArabic ? "30 يوم" : "30 Days",
    next60: isArabic ? "60 يوم" : "60 Days",
    next90: isArabic ? "90 يوم" : "90 Days",
    projectedRevenue: isArabic ? "الإيرادات المتوقعة" : "Projected Revenue",
    membershipGrowth: isArabic ? "نمو العضوية" : "Membership Growth",
    budgetVsActual: isArabic ? "الميزانية مقابل الفعلي" : "Budget vs Actual",
    viewDetails: isArabic ? "عرض التفاصيل" : "View Details",
    confidence: isArabic ? "الثقة" : "Confidence",
    refresh: isArabic ? "تحديث" : "Refresh",
    scenarios: isArabic ? "السيناريوهات" : "Scenarios",
    budgets: isArabic ? "الميزانيات" : "Budgets",
    onTarget: isArabic ? "على الهدف" : "On Target",
    overBudget: isArabic ? "تجاوز الميزانية" : "Over Budget",
  };

  const handleRefresh = async () => {
    await Promise.all([refetchRevenue(), refetchMembership()]);
    toast({
      title: isArabic ? "تم التحديث" : "Refreshed",
      description: isArabic
        ? "تم تحديث التوقعات"
        : "Forecasts have been refreshed",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            {texts.title}
          </h1>
          <p className="text-neutral-500">{texts.subtitle}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={forecastDays === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setForecastDays(30)}
          >
            {texts.next30}
          </Button>
          <Button
            variant={forecastDays === 60 ? "default" : "outline"}
            size="sm"
            onClick={() => setForecastDays(60)}
          >
            {texts.next60}
          </Button>
          <Button
            variant={forecastDays === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setForecastDays(90)}
          >
            {texts.next90}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Projected Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              {texts.projectedRevenue}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : revenueSummary ? (
              <>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(revenueSummary.total, "SAR", locale)}
                </p>
                <p className="text-sm text-neutral-500">
                  {texts.confidence}:{" "}
                  {(revenueSummary.avgConfidence * 100).toFixed(0)}%
                </p>
              </>
            ) : (
              <p className="text-neutral-400">-</p>
            )}
          </CardContent>
        </Card>

        {/* Membership Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {texts.membershipGrowth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {membershipLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : membershipSummary ? (
              <>
                <p className="text-2xl font-bold">
                  {membershipSummary.projected.toLocaleString()}
                </p>
                <p
                  className={`text-sm flex items-center gap-1 ${
                    membershipSummary.growth >= 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {membershipSummary.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {membershipSummary.growth >= 0 ? "+" : ""}
                  {membershipSummary.growthPercent.toFixed(1)}%
                </p>
              </>
            ) : (
              <p className="text-neutral-400">-</p>
            )}
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              <Target className="h-4 w-4 text-warning" />
              {texts.budgetVsActual}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {budgetLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : budgetSummary ? (
              <>
                <p className="text-2xl font-bold">
                  {formatCurrency(budgetSummary.totalActual, "SAR", locale)}
                </p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {texts.onTarget}: {budgetSummary.onTargetCount}
                  </Badge>
                  <Badge variant="destructive" className="text-xs">
                    {texts.overBudget}: {budgetSummary.overBudgetCount}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-neutral-400">-</p>
            )}
          </CardContent>
        </Card>

        {/* Seasonality Patterns */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-info" />
              {texts.seasonality}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {seasonalityLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : seasonality ? (
              <>
                <p className="text-2xl font-bold">{seasonality.length}</p>
                <p className="text-sm text-neutral-500">
                  {isArabic ? "أنماط موسمية محددة" : "Patterns Identified"}
                </p>
              </>
            ) : (
              <p className="text-neutral-400">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`/${locale}/reports/forecasting/revenue`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {texts.revenue}
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "تحليل توقعات الإيرادات التفصيلية"
                  : "Detailed revenue forecast analysis"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/${locale}/reports/forecasting/scenarios`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  {texts.scenarios}
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "تخطيط السيناريوهات ماذا لو"
                  : "What-if scenario planning"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/${locale}/reports/budget`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {texts.budgets}
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "إدارة الميزانية والأداء"
                  : "Budget management and performance"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Forecast Charts Placeholder */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">{texts.revenue}</TabsTrigger>
          <TabsTrigger value="membership">{texts.membership}</TabsTrigger>
          <TabsTrigger value="seasonality">{texts.seasonality}</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>
                {isArabic ? "توقعات الإيرادات" : "Revenue Forecast"}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? `توقعات الإيرادات للـ ${forecastDays} يوم القادمة`
                  : `Revenue predictions for the next ${forecastDays} days`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <Skeleton className="h-[300px]" />
              ) : revenueForecasts && revenueForecasts.length > 0 ? (
                <div className="space-y-4">
                  {/* Simple table view - would be replaced with chart */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-start py-2">
                            {isArabic ? "الفترة" : "Period"}
                          </th>
                          <th className="text-end py-2">
                            {isArabic ? "متوقع" : "Predicted"}
                          </th>
                          <th className="text-end py-2">
                            {isArabic ? "الحد الأدنى" : "Lower"}
                          </th>
                          <th className="text-end py-2">
                            {isArabic ? "الحد الأعلى" : "Upper"}
                          </th>
                          <th className="text-end py-2">
                            {isArabic ? "الثقة" : "Confidence"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueForecasts.slice(0, 10).map((forecast) => (
                          <tr key={forecast.id} className="border-b">
                            <td className="py-2">{forecast.periodStart}</td>
                            <td className="text-end">
                              {formatCurrency(
                                forecast.predictedValue,
                                "SAR",
                                locale
                              )}
                            </td>
                            <td className="text-end text-neutral-500">
                              {forecast.lowerBound
                                ? formatCurrency(
                                    forecast.lowerBound,
                                    "SAR",
                                    locale
                                  )
                                : "-"}
                            </td>
                            <td className="text-end text-neutral-500">
                              {forecast.upperBound
                                ? formatCurrency(
                                    forecast.upperBound,
                                    "SAR",
                                    locale
                                  )
                                : "-"}
                            </td>
                            <td className="text-end">
                              {forecast.confidenceScore
                                ? `${(forecast.confidenceScore * 100).toFixed(0)}%`
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-neutral-400">
                  {isArabic ? "لا توجد توقعات متاحة" : "No forecasts available"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="membership">
          <Card>
            <CardHeader>
              <CardTitle>
                {isArabic ? "توقعات العضوية" : "Membership Forecast"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membershipLoading ? (
                <Skeleton className="h-[300px]" />
              ) : membershipForecasts && membershipForecasts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-start py-2">
                          {isArabic ? "الفترة" : "Period"}
                        </th>
                        <th className="text-end py-2">
                          {isArabic ? "الأعضاء المتوقعين" : "Predicted Members"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {membershipForecasts.slice(0, 10).map((forecast) => (
                        <tr key={forecast.id} className="border-b">
                          <td className="py-2">{forecast.periodStart}</td>
                          <td className="text-end">
                            {forecast.predictedValue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-neutral-400">
                  {isArabic ? "لا توجد توقعات متاحة" : "No forecasts available"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonality">
          <Card>
            <CardHeader>
              <CardTitle>
                {isArabic ? "الأنماط الموسمية" : "Seasonality Patterns"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {seasonalityLoading ? (
                <Skeleton className="h-[300px]" />
              ) : seasonality && seasonality.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {seasonality.map((pattern) => (
                    <Card key={pattern.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{pattern.periodKey}</p>
                            <p className="text-sm text-neutral-500">
                              {pattern.patternType} - {pattern.metricType}
                            </p>
                          </div>
                          <Badge
                            variant={
                              pattern.isAboveAverage ? "default" : "secondary"
                            }
                          >
                            {pattern.isAboveAverage ? "+" : ""}
                            {(
                              (pattern.adjustmentFactor - 1) *
                              100
                            ).toFixed(0)}
                            %
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-neutral-400">
                  {isArabic ? "لا توجد أنماط متاحة" : "No patterns available"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
