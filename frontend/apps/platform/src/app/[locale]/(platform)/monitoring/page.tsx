"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Server, Activity, AlertCircle, CheckCircle, Clock } from "lucide-react";
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
    </div>
  );
}
