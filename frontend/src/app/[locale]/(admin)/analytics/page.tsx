"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Calendar,
  Target,
  PieChart,
  FileText,
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { useRevenueReport, useAttendanceReport, useMemberReport } from "@/queries/use-reports";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
}

function AnalyticsCard({ title, description, href, icon: Icon, color, badge }: AnalyticsCardProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <Link href={`/${locale}${href}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-2">
          <div className={cn("flex items-start justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn(`h-10 w-10 rounded-md3-md flex items-center justify-center`, color)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <h3 className={cn("font-semibold mb-1 group-hover:text-primary transition-colors", isRtl && "text-right")}>
            {title}
          </h3>
          <p className={cn("text-sm text-muted-foreground line-clamp-2", isRtl && "text-right")}>
            {description}
          </p>
          <div className={cn("flex items-center gap-1 mt-3 text-sm text-primary", isRtl && "flex-row-reverse")}>
            <span>{isRtl ? "عرض التقرير" : "View Report"}</span>
            <ArrowRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-1", isRtl && "rotate-180 group-hover:-translate-x-1")} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AnalyticsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Get summary data for last 30 days
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: revenueReport, isLoading: revenueLoading } = useRevenueReport({
    startDate,
    endDate,
    groupBy: "day",
  });
  const { data: memberReport, isLoading: memberLoading } = useMemberReport({
    startDate,
    endDate,
    groupBy: "week",
  });

  const texts = {
    title: isRtl ? "التحليلات" : "Analytics",
    subtitle: isRtl ? "رؤى شاملة لأداء النادي" : "Comprehensive insights into club performance",
    last30Days: isRtl ? "آخر 30 يوم" : "Last 30 days",
    revenue: isRtl ? "الإيرادات" : "Revenue",
    activeMembers: isRtl ? "الأعضاء النشطون" : "Active Members",
    churnRate: isRtl ? "معدل التسرب" : "Churn Rate",
    retentionRate: isRtl ? "معدل الاحتفاظ" : "Retention Rate",
    coreReports: isRtl ? "التقارير الأساسية" : "Core Reports",
    advancedAnalytics: isRtl ? "تحليلات متقدمة" : "Advanced Analytics",
    predictive: isRtl ? "تنبؤي" : "Predictive",
    aiPowered: isRtl ? "ذكاء اصطناعي" : "AI-Powered",
    revenueReports: isRtl ? "تقارير الإيرادات" : "Revenue Reports",
    revenueDesc: isRtl ? "تحليل الإيرادات والفواتير والاتجاهات المالية" : "Analyze revenue, invoices, and financial trends",
    memberReports: isRtl ? "تقارير الأعضاء" : "Member Reports",
    memberDesc: isRtl ? "تتبع نمو الأعضاء والتركيبة السكانية" : "Track member growth and demographics",
    attendanceReports: isRtl ? "تقارير الحضور" : "Attendance Reports",
    attendanceDesc: isRtl ? "تحليل أنماط الحضور وساعات الذروة" : "Analyze attendance patterns and peak hours",
    churnAnalysis: isRtl ? "تحليل التسرب" : "Churn Analysis",
    churnDesc: isRtl ? "تحديد الأعضاء المعرضين للخطر والتنبؤ بالتسرب" : "Identify at-risk members and predict churn",
    ltvAnalysis: isRtl ? "تحليل القيمة الدائمة" : "LTV Analysis",
    ltvDesc: isRtl ? "فهم القيمة الدائمة للعميل حسب الفئة" : "Understand customer lifetime value by cohort",
    forecasting: isRtl ? "التوقعات" : "Forecasting",
    forecastingDesc: isRtl ? "توقع الإيرادات والنمو المستقبلي" : "Predict future revenue and growth",
    exitSurveys: isRtl ? "استبيانات الخروج" : "Exit Surveys",
    exitSurveysDesc: isRtl ? "تحليل أسباب إلغاء الأعضاء" : "Analyze why members cancel",
    scheduledReports: isRtl ? "التقارير المجدولة" : "Scheduled Reports",
    scheduledDesc: isRtl ? "إعداد تقارير آلية عبر البريد الإلكتروني" : "Set up automated email reports",
  };

  const coreReports: AnalyticsCardProps[] = [
    {
      title: texts.revenueReports,
      description: texts.revenueDesc,
      href: "/reports/revenue",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: texts.memberReports,
      description: texts.memberDesc,
      href: "/reports/members",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: texts.attendanceReports,
      description: texts.attendanceDesc,
      href: "/reports/attendance",
      icon: Calendar,
      color: "bg-purple-500",
    },
    {
      title: texts.scheduledReports,
      description: texts.scheduledDesc,
      href: "/reports/scheduled",
      icon: Clock,
      color: "bg-gray-500",
    },
  ];

  const advancedReports: AnalyticsCardProps[] = [
    {
      title: texts.churnAnalysis,
      description: texts.churnDesc,
      href: "/reports/churn",
      icon: TrendingDown,
      color: "bg-red-500",
      badge: texts.aiPowered,
    },
    {
      title: texts.ltvAnalysis,
      description: texts.ltvDesc,
      href: "/reports/ltv",
      icon: Target,
      color: "bg-amber-500",
    },
    {
      title: texts.forecasting,
      description: texts.forecastingDesc,
      href: "/reports/forecasting",
      icon: TrendingUp,
      color: "bg-indigo-500",
      badge: texts.predictive,
    },
    {
      title: texts.exitSurveys,
      description: texts.exitSurveysDesc,
      href: "/analytics/exit-surveys",
      icon: FileText,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={texts.title}
        description={texts.subtitle}
      >
        <Button asChild>
          <Link href="/reports">
            <BarChart3 className="me-2 h-4 w-4" />
            {isRtl ? "عرض جميع التقارير" : "View All Reports"}
          </Link>
        </Button>
      </PageHeader>

      {/* Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
              <div className="h-10 w-10 rounded-md3-md bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className={cn("text-sm text-muted-foreground", isRtl && "text-right")}>
                  {texts.revenue}
                </p>
                {revenueLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className={cn("text-xl font-bold", isRtl && "text-right")}>
                    {revenueReport
                      ? formatCurrency(
                          revenueReport.summary.totalRevenue.amount,
                          revenueReport.summary.totalRevenue.currency,
                          locale
                        )
                      : "-"}
                  </p>
                )}
              </div>
            </div>
            <p className={cn("text-xs text-muted-foreground mt-2", isRtl && "text-right")}>
              {texts.last30Days}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
              <div className="h-10 w-10 rounded-md3-md bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className={cn("text-sm text-muted-foreground", isRtl && "text-right")}>
                  {texts.activeMembers}
                </p>
                {memberLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className={cn("text-xl font-bold", isRtl && "text-right")}>
                    {memberReport?.summary.activeMembers ?? "-"}
                  </p>
                )}
              </div>
            </div>
            <p className={cn("text-xs text-muted-foreground mt-2", isRtl && "text-right")}>
              {texts.last30Days}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
              <div className="h-10 w-10 rounded-md3-md bg-amber-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className={cn("text-sm text-muted-foreground", isRtl && "text-right")}>
                  {texts.retentionRate}
                </p>
                {memberLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className={cn("text-xl font-bold", isRtl && "text-right")}>
                    {memberReport ? `${memberReport.summary.retentionRate.toFixed(1)}%` : "-"}
                  </p>
                )}
              </div>
            </div>
            <p className={cn("text-xs text-muted-foreground mt-2", isRtl && "text-right")}>
              {texts.last30Days}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
              <div className="h-10 w-10 rounded-md3-md bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className={cn("text-sm text-muted-foreground", isRtl && "text-right")}>
                  {texts.churnRate}
                </p>
                {memberLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className={cn("text-xl font-bold", isRtl && "text-right")}>
                    {memberReport ? `${(100 - memberReport.summary.retentionRate).toFixed(1)}%` : "-"}
                  </p>
                )}
              </div>
            </div>
            <p className={cn("text-xs text-muted-foreground mt-2", isRtl && "text-right")}>
              {texts.last30Days}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Reports */}
      <div>
        <h2 className={cn("text-lg font-semibold mb-4", isRtl && "text-right")}>
          {texts.coreReports}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {coreReports.map((report) => (
            <AnalyticsCard key={report.href} {...report} />
          ))}
        </div>
      </div>

      {/* Advanced Analytics */}
      <div>
        <h2 className={cn("text-lg font-semibold mb-4", isRtl && "text-right")}>
          {texts.advancedAnalytics}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {advancedReports.map((report) => (
            <AnalyticsCard key={report.href} {...report} />
          ))}
        </div>
      </div>
    </div>
  );
}
