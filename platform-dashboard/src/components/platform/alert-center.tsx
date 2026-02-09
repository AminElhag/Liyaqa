import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { AlertSeverity, PlatformAlert, AlertStatistics } from "@/types";

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
  onDismiss,
  onViewAll,
  onAlertClick,
  className,
}: AlertCenterProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const isRtl = locale === "ar";
  const [filter, setFilter] = useState<AlertSeverity | "ALL">("ALL");

  const texts = {
    title: isRtl ? "\u0645\u0631\u0643\u0632 \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a" : "Alert Center",
    subtitle: isRtl ? "\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u062a\u062d\u062a\u0627\u062c \u0625\u0644\u0649 \u0627\u0647\u062a\u0645\u0627\u0645" : "Alerts requiring attention",
    viewAll: isRtl ? "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" : "View All",
    acknowledge: isRtl ? "\u062a\u0645 \u0627\u0644\u0627\u0637\u0644\u0627\u0639" : "Acknowledge",
    resolve: isRtl ? "\u062d\u0644" : "Resolve",
    dismiss: isRtl ? "\u062a\u062c\u0627\u0647\u0644" : "Dismiss",
    noAlerts: isRtl ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0646\u0628\u064a\u0647\u0627\u062a" : "No alerts",
    allClear: isRtl ? "\u0643\u0644 \u0634\u064a\u0621 \u0639\u0644\u0649 \u0645\u0627 \u064a\u0631\u0627\u0645!" : "All clear!",
    filter: isRtl ? "\u062a\u0635\u0641\u064a\u0629" : "Filter",
    all: isRtl ? "\u0627\u0644\u0643\u0644" : "All",
    critical: isRtl ? "\u062d\u0631\u062c" : "Critical",
    warning: isRtl ? "\u062a\u062d\u0630\u064a\u0631" : "Warning",
    info: isRtl ? "\u0645\u0639\u0644\u0648\u0645\u0627\u062a" : "Info",
    unacknowledged: isRtl ? "\u063a\u064a\u0631 \u0645\u0642\u0631\u0648\u0621" : "unacknowledged",
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
