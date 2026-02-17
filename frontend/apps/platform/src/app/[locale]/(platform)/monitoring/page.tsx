"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Server, Activity, AlertCircle, CheckCircle, Clock, Dumbbell, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import {
  useSystemHealth,
  useScheduledJobs,
  useErrorSummary,
} from "@liyaqa/shared/queries/platform/use-system-monitoring";
import { KPIGrid, type KPIItem } from "@liyaqa/shared/components/platform/kpi-grid";
import { Badge } from "@liyaqa/shared/components/ui/badge";

export default function MonitoringPage() {
  const locale = useLocale();

  const { data: health, isLoading: isLoadingHealth } = useSystemHealth();
  const { data: jobs, isLoading: isLoadingJobs } = useScheduledJobs();
  const { data: errors, isLoading: isLoadingErrors } = useErrorSummary();

  const texts = {
    title: locale === "ar" ? "مراقبة النظام" : "System Monitoring",
    description: locale === "ar" ? "مراقبة صحة النظام والوظائف المجدولة" : "Monitor system health and scheduled jobs",
    systemHealth: locale === "ar" ? "صحة النظام" : "System Health",
    uptime: locale === "ar" ? "مدة التشغيل" : "Uptime",
    memoryUsage: locale === "ar" ? "استخدام الذاكرة" : "Memory Usage",
    dbConnections: locale === "ar" ? "اتصالات قاعدة البيانات" : "DB Connections",
    scheduledJobs: locale === "ar" ? "المهام المجدولة" : "Scheduled Jobs",
    errorSummary: locale === "ar" ? "ملخص الأخطاء" : "Error Summary",
    errors24h: locale === "ar" ? "أخطاء (24 ساعة)" : "Errors (24h)",
    running: locale === "ar" ? "قيد التشغيل" : "Running",
    idle: locale === "ar" ? "خامل" : "Idle",
    lastRun: locale === "ar" ? "آخر تشغيل" : "Last Run",
    gxMetrics: locale === "ar" ? "مقاييس التمارين الجماعية" : "Group Exercise Metrics",
    gxOverview: locale === "ar" ? "نظرة عامة على التمارين الجماعية" : "GX Overview",
    totalClassesOffered: locale === "ar" ? "إجمالي الحصص المقدمة" : "Total Classes Offered",
    avgBookingRate: locale === "ar" ? "متوسط معدل الحجز" : "Avg Booking Rate",
    noShowRate: locale === "ar" ? "معدل عدم الحضور" : "No-Show Rate",
    activeClassPacks: locale === "ar" ? "حزم الحصص النشطة" : "Active Class Packs",
    topClassCategories: locale === "ar" ? "أعلى فئات الحصص" : "Top Class Categories",
    classes: locale === "ar" ? "حصة" : "classes",
  };

  const kpiItems: KPIItem[] = [];

  if (health) {
    kpiItems.push(
      { label: texts.uptime, value: health.uptimeFormatted, trend: "up", icon: Activity },
      { label: texts.memoryUsage, value: `${health.jvm.memoryUsagePercent.toFixed(0)}%`, trend: health.jvm.memoryUsagePercent > 80 ? "down" : "up", icon: Server },
      { label: texts.dbConnections, value: `${health.database.activeConnections}/${health.database.maxConnections}`, trend: health.database.utilizationPercent > 70 ? "down" : "up", icon: Server }
    );
  }

  if (errors) {
    kpiItems.push({ label: texts.errors24h, value: errors.last24Hours.total, trend: errors.last24Hours.total > 0 ? "down" : "up", icon: AlertCircle });
  }

  // Mock GX metrics data (placeholder until API is available)
  const gxOverviewData = {
    totalClassesOffered: 1248,
    avgBookingRate: 73.5,
    noShowRate: 8.2,
    activeClassPacks: 342,
  };

  const gxTopCategories = [
    { name: locale === "ar" ? "يوغا" : "YOGA", count: 312, percentage: 100 },
    { name: locale === "ar" ? "تمارين عالية الكثافة" : "HIIT", count: 276, percentage: 88 },
    { name: locale === "ar" ? "سبينينغ" : "SPINNING", count: 198, percentage: 63 },
    { name: locale === "ar" ? "بيلاتس" : "PILATES", count: 164, percentage: 53 },
    { name: locale === "ar" ? "كروس فت" : "CROSSFIT", count: 148, percentage: 47 },
    { name: locale === "ar" ? "ملاكمة" : "BOXING", count: 96, percentage: 31 },
    { name: locale === "ar" ? "زومبا" : "ZUMBA", count: 54, percentage: 17 },
  ];

  if (isLoadingHealth || isLoadingJobs || isLoadingErrors) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{texts.title}</h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      <KPIGrid items={kpiItems} loading={isLoadingHealth} />

      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {texts.systemHealth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">{locale === "ar" ? "الحالة" : "Status"}</p>
                <p className="text-lg font-semibold text-green-600">{health.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{locale === "ar" ? "الإصدار" : "Version"}</p>
                <p className="text-lg font-semibold">{health.version}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{locale === "ar" ? "البيئة" : "Environment"}</p>
                <p className="text-lg font-semibold">{health.environment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {jobs && jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {texts.scheduledJobs}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jobs.map((job, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{job.name}</p>
                    <p className="text-sm text-muted-foreground">{job.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {texts.lastRun}: {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString(locale) : locale === "ar" ? "لم يتم التشغيل بعد" : "Never"}
                    </p>
                  </div>
                  <Badge variant={job.isRunning ? "default" : "secondary"}>
                    {job.isRunning ? texts.running : texts.idle}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {errors && errors.topErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {texts.errorSummary}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.topErrors.map((error, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{error.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {locale === "ar" ? "آخر حدوث:" : "Last occurred:"} {error.lastOccurred ? new Date(error.lastOccurred).toLocaleString(locale) : "-"}
                    </p>
                  </div>
                  <Badge variant="destructive">{error.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Exercise Metrics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{texts.gxMetrics}</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {texts.gxOverview}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-sm text-muted-foreground">{texts.totalClassesOffered}</p>
                <p className="text-2xl font-bold">{gxOverviewData.totalClassesOffered.toLocaleString(locale)}</p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12%</span>
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-sm text-muted-foreground">{texts.avgBookingRate}</p>
                <p className="text-2xl font-bold">{gxOverviewData.avgBookingRate}%</p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+3.2%</span>
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-sm text-muted-foreground">{texts.noShowRate}</p>
                <p className="text-2xl font-bold">{gxOverviewData.noShowRate}%</p>
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <TrendingDown className="h-3 w-3" />
                  <span>+1.1%</span>
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <p className="text-sm text-muted-foreground">{texts.activeClassPacks}</p>
                <p className="text-2xl font-bold">{gxOverviewData.activeClassPacks.toLocaleString(locale)}</p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+8%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {texts.topClassCategories}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gxTopCategories.map((category) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground">
                      {category.count} {texts.classes}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
