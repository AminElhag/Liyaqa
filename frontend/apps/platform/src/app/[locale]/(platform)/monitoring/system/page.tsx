"use client";

import { useLocale } from "next-intl";
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { cn } from "@liyaqa/shared/utils";
import {
  useSystemHealth,
  useScheduledJobs,
  useErrorSummary,
} from "@liyaqa/shared/queries/platform/use-system-monitoring";

export default function SystemMonitoringPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    title: isRtl ? "مراقبة النظام" : "System Monitoring",
    subtitle: isRtl ? "حالة النظام والوظائف المجدولة وملخص الأخطاء" : "System health, scheduled jobs, and error summary",
    systemHealth: isRtl ? "صحة النظام" : "System Health",
    jvm: isRtl ? "JVM" : "JVM",
    database: isRtl ? "قاعدة البيانات" : "Database",
    redis: isRtl ? "Redis" : "Redis",
    uptime: isRtl ? "وقت التشغيل" : "Uptime",
    version: isRtl ? "الإصدار" : "Version",
    environment: isRtl ? "البيئة" : "Environment",
    memoryUsage: isRtl ? "استخدام الذاكرة" : "Memory Usage",
    processors: isRtl ? "المعالجات" : "Processors",
    connections: isRtl ? "الاتصالات" : "Connections",
    active: isRtl ? "نشط" : "Active",
    idle: isRtl ? "خامل" : "Idle",
    max: isRtl ? "أقصى" : "Max",
    utilization: isRtl ? "الاستخدام" : "Utilization",
    scheduledJobs: isRtl ? "الوظائف المجدولة" : "Scheduled Jobs",
    jobName: isRtl ? "الاسم" : "Name",
    schedule: isRtl ? "الجدول" : "Schedule",
    lastRun: isRtl ? "آخر تشغيل" : "Last Run",
    status: isRtl ? "الحالة" : "Status",
    running: isRtl ? "قيد التشغيل" : "Running",
    waiting: isRtl ? "في الانتظار" : "Waiting",
    errorSummary: isRtl ? "ملخص الأخطاء" : "Error Summary",
    last24h: isRtl ? "آخر 24 ساعة" : "Last 24h",
    last7d: isRtl ? "آخر 7 أيام" : "Last 7 Days",
    last30d: isRtl ? "آخر 30 يوم" : "Last 30 Days",
    totalErrors: isRtl ? "إجمالي الأخطاء" : "Total Errors",
    serverErrors: isRtl ? "أخطاء الخادم" : "Server Errors",
    clientErrors: isRtl ? "أخطاء العميل" : "Client Errors",
    topErrors: isRtl ? "أكثر الأخطاء شيوعاً" : "Top Errors",
    errorType: isRtl ? "النوع" : "Type",
    count: isRtl ? "العدد" : "Count",
    lastOccurred: isRtl ? "آخر حدوث" : "Last Occurred",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    refresh: isRtl ? "تحديث" : "Refresh",
    noJobs: isRtl ? "لا توجد وظائف" : "No scheduled jobs",
    noErrors: isRtl ? "لا توجد أخطاء" : "No errors recorded",
  };

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth();
  const { data: jobs, isLoading: jobsLoading } = useScheduledJobs();
  const { data: errors, isLoading: errorsLoading } = useErrorSummary();

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "UP": case "HEALTHY": return "text-green-600";
      case "DOWN": case "UNHEALTHY": return "text-red-600";
      default: return "text-yellow-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "UP": case "HEALTHY": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "DOWN": case "UNHEALTHY": return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div className={isRtl ? "text-right" : ""}>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" />
            {texts.title}
          </h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchHealth()}>
          <RefreshCw className="h-4 w-4 me-1" />
          {texts.refresh}
        </Button>
      </div>

      {/* System Health */}
      {healthLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : health ? (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{texts.status}</p>
                    <p className={cn("text-lg font-bold", getStatusColor(health.status))}>
                      {health.status}
                    </p>
                  </div>
                  {getStatusIcon(health.status)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{texts.uptime}</p>
                    <p className="text-lg font-bold">{health.uptimeFormatted}</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{texts.version}</p>
                    <p className="text-lg font-bold">{health.version}</p>
                  </div>
                  <Server className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{texts.environment}</p>
                    <p className="text-lg font-bold">{health.environment}</p>
                  </div>
                  <HardDrive className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Component Health */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* JVM */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  {texts.jvm}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                  <span className="text-sm text-muted-foreground">{texts.memoryUsage}</span>
                  <span className="text-sm font-medium">
                    {health.jvm.memoryUsedMb}MB / {health.jvm.memoryMaxMb}MB
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={cn("h-2 rounded-full", {
                      "bg-green-500": health.jvm.memoryUsagePercent < 70,
                      "bg-yellow-500": health.jvm.memoryUsagePercent >= 70 && health.jvm.memoryUsagePercent < 90,
                      "bg-red-500": health.jvm.memoryUsagePercent >= 90,
                    })}
                    style={{ width: `${health.jvm.memoryUsagePercent}%` }}
                  />
                </div>
                <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                  <span className="text-sm text-muted-foreground">{texts.processors}</span>
                  <span className="text-sm font-medium">{health.jvm.availableProcessors}</span>
                </div>
              </CardContent>
            </Card>

            {/* Database */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {texts.database}
                  {getStatusIcon(health.database.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                  <span className="text-sm text-muted-foreground">{texts.active}</span>
                  <span className="text-sm font-medium">{health.database.activeConnections}</span>
                </div>
                <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                  <span className="text-sm text-muted-foreground">{texts.idle}</span>
                  <span className="text-sm font-medium">{health.database.idleConnections}</span>
                </div>
                <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                  <span className="text-sm text-muted-foreground">{texts.max}</span>
                  <span className="text-sm font-medium">{health.database.maxConnections}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={cn("h-2 rounded-full", {
                      "bg-green-500": health.database.utilizationPercent < 70,
                      "bg-yellow-500": health.database.utilizationPercent >= 70 && health.database.utilizationPercent < 90,
                      "bg-red-500": health.database.utilizationPercent >= 90,
                    })}
                    style={{ width: `${health.database.utilizationPercent}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Redis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  {texts.redis}
                  {getStatusIcon(health.redis.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn("text-sm font-medium", getStatusColor(health.redis.status))}>
                  {health.redis.status}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Scheduled Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {texts.scheduledJobs}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : !jobs?.length ? (
            <p className="text-center text-muted-foreground py-8">{texts.noJobs}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("border-b text-muted-foreground", isRtl && "text-right")}>
                    <th className="pb-3 font-medium">{texts.jobName}</th>
                    <th className="pb-3 font-medium">{texts.schedule}</th>
                    <th className="pb-3 font-medium">{texts.lastRun}</th>
                    <th className="pb-3 font-medium text-center">{texts.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.name} className="border-b last:border-0">
                      <td className="py-3">
                        <p className="font-medium">{job.name}</p>
                        <p className="text-xs text-muted-foreground">{job.description}</p>
                      </td>
                      <td className="py-3 font-mono text-xs">{job.schedule}</td>
                      <td className="py-3 text-xs">
                        {job.lastRunAt
                          ? new Date(job.lastRunAt).toLocaleString(locale)
                          : "—"}
                      </td>
                      <td className="py-3 text-center">
                        {job.isRunning ? (
                          <Badge variant="default" className="text-xs">
                            <RefreshCw className="h-3 w-3 me-1 animate-spin" />
                            {texts.running}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {texts.waiting}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {texts.errorSummary}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errorsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : !errors ? (
            <p className="text-center text-muted-foreground py-8">{texts.noErrors}</p>
          ) : (
            <div className="space-y-6">
              {/* Error counts grid */}
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { period: texts.last24h, data: errors.last24Hours },
                  { period: texts.last7d, data: errors.last7Days },
                  { period: texts.last30d, data: errors.last30Days },
                ].map(({ period, data }) => (
                  <div key={period} className="p-4 rounded-lg border space-y-2">
                    <p className="text-sm font-medium">{period}</p>
                    <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                      <span className="text-xs text-muted-foreground">{texts.totalErrors}</span>
                      <span className="font-medium">{data.total}</span>
                    </div>
                    <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                      <span className="text-xs text-muted-foreground">{texts.serverErrors}</span>
                      <span className="text-red-600 font-medium">{data.serverErrors}</span>
                    </div>
                    <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                      <span className="text-xs text-muted-foreground">{texts.clientErrors}</span>
                      <span className="text-yellow-600 font-medium">{data.clientErrors}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top errors */}
              {errors.topErrors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">{texts.topErrors}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={cn("border-b text-muted-foreground", isRtl && "text-right")}>
                          <th className="pb-2 font-medium">{texts.errorType}</th>
                          <th className="pb-2 font-medium text-center">{texts.count}</th>
                          <th className="pb-2 font-medium">{texts.lastOccurred}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {errors.topErrors.map((err) => (
                          <tr key={err.type} className="border-b last:border-0">
                            <td className="py-2 font-mono text-xs">{err.type}</td>
                            <td className="py-2 text-center">
                              <Badge variant="destructive" className="text-xs">{err.count}</Badge>
                            </td>
                            <td className="py-2 text-xs">
                              {err.lastOccurred
                                ? new Date(err.lastOccurred).toLocaleString(locale)
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
