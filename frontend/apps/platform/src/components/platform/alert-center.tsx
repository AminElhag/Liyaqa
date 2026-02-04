"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { ScrollArea } from "@liyaqa/shared/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { cn } from "@liyaqa/shared/utils";

import type { AlertType, AlertSeverity, PlatformAlert, AlertStatistics } from "@liyaqa/shared/types/platform/alerts";

/**
 * Props for AlertCenter component
 */
interface AlertCenterProps {
  alerts: PlatformAlert[];
  statistics: AlertStatistics;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onViewAll?: () => void;
  onAlertClick?: (alert: PlatformAlert) => void;
  className?: string;
}

/**
 * Severity configuration
 */
const severityConfig: Record<AlertSeverity, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  CRITICAL: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
  },
  WARNING: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  INFO: {
    icon: <Info className="h-4 w-4" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  SUCCESS: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
};

/**
 * AlertCenter Component
 * Displays platform alerts with filtering and actions.
 */
export function AlertCenter({
  alerts,
  statistics,
  onAcknowledge,
  onResolve,
  onDismiss,
  onViewAll,
  onAlertClick,
  className,
}: AlertCenterProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [filter, setFilter] = useState<AlertSeverity | "ALL">("ALL");

  const texts = {
    title: isRtl ? "مركز التنبيهات" : "Alert Center",
    subtitle: isRtl ? "تنبيهات تحتاج إلى اهتمام" : "Alerts requiring attention",
    viewAll: isRtl ? "عرض الكل" : "View All",
    acknowledge: isRtl ? "تم الاطلاع" : "Acknowledge",
    resolve: isRtl ? "حل" : "Resolve",
    dismiss: isRtl ? "تجاهل" : "Dismiss",
    noAlerts: isRtl ? "لا توجد تنبيهات" : "No alerts",
    allClear: isRtl ? "كل شيء على ما يرام!" : "All clear!",
    filter: isRtl ? "تصفية" : "Filter",
    all: isRtl ? "الكل" : "All",
    critical: isRtl ? "حرج" : "Critical",
    warning: isRtl ? "تحذير" : "Warning",
    info: isRtl ? "معلومات" : "Info",
    unacknowledged: isRtl ? "غير مقروء" : "unacknowledged",
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "ALL") return true;
    return alert.severity === filter;
  });

  // Sort by severity (CRITICAL first) then by date
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const severityOrder: Record<AlertSeverity, number> = {
      CRITICAL: 0,
      WARNING: 1,
      INFO: 2,
      SUCCESS: 3,
    };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {texts.title}
              {statistics.unacknowledged > 0 && (
                <Badge variant="destructive" className="ms-2">
                  {statistics.unacknowledged} {texts.unacknowledged}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{texts.subtitle}</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {texts.filter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter("ALL")}>
                  {texts.all}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("CRITICAL")}>
                  <AlertCircle className="h-4 w-4 me-2 text-red-500" />
                  {texts.critical}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("WARNING")}>
                  <AlertTriangle className="h-4 w-4 me-2 text-yellow-500" />
                  {texts.warning}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("INFO")}>
                  <Info className="h-4 w-4 me-2 text-blue-500" />
                  {texts.info}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {onViewAll && (
              <Button variant="ghost" size="sm" onClick={onViewAll}>
                {texts.viewAll}
                <ChevronRight className="h-4 w-4 ms-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>{statistics.critical} {texts.critical}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span>{statistics.warning} {texts.warning}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{statistics.totalActive} total</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">{texts.noAlerts}</p>
            <p className="text-sm">{texts.allClear}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] -mx-6 px-6">
            <div className="space-y-3">
              {sortedAlerts.map((alert) => {
                const config = severityConfig[alert.severity];
                const isNew = !alert.acknowledgedAt;

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "relative rounded-lg border p-4 transition-colors cursor-pointer hover:shadow-sm",
                      config.bgColor,
                      config.borderColor,
                      isNew && "ring-2 ring-primary/20"
                    )}
                    onClick={() => onAlertClick?.(alert)}
                  >
                    {/* Unread indicator */}
                    {isNew && (
                      <div className="absolute top-4 end-4 h-2 w-2 rounded-full bg-primary" />
                    )}

                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5", config.color)}>{config.icon}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{alert.title}</span>
                          {alert.organizationNameEn && (
                            <Badge variant="outline" className="text-xs">
                              {alert.organizationNameEn}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {alert.message}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(alert.createdAt), {
                              addSuffix: true,
                              locale: isRtl ? ar : enUS,
                            })}
                          </div>

                          <div className="flex items-center gap-2">
                            {alert.actionUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = alert.actionUrl!;
                                }}
                              >
                                {alert.actionLabel || "View"}
                                <ExternalLink className="h-3 w-3 ms-1" />
                              </Button>
                            )}

                            {isNew && onAcknowledge && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAcknowledge(alert.id);
                                }}
                              >
                                {texts.acknowledge}
                              </Button>
                            )}

                            {onDismiss && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDismiss(alert.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default AlertCenter;
