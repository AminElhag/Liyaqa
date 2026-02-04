"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Bell,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
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
import { Checkbox } from "@liyaqa/shared/components/ui/checkbox";
import { ScrollArea } from "@liyaqa/shared/components/ui/scroll-area";
import { cn } from "@liyaqa/shared/utils";
import { AlertPlaybookDialog } from "@/components/platform/alert-playbook-dialog";
import {
  usePlatformAlerts,
  useAlertStatistics,
  useAcknowledgeAlert,
  useResolveAlert,
  useBulkAcknowledgeAlerts,
  useBulkResolveAlerts,
} from "@liyaqa/shared/queries/platform/use-alerts";
import type {
  PlatformAlert,
  AlertSeverity,
  AlertStatus,
  AlertType,
  AlertFilters,
} from "@liyaqa/shared/types/platform/alerts";
import { ALERT_SEVERITY_CONFIG, ALERT_STATUS_CONFIG } from "@liyaqa/shared/types/platform/alerts";

/**
 * Severity icon component
 */
function SeverityIcon({ severity, className }: { severity: AlertSeverity; className?: string }) {
  const iconClass = cn("h-4 w-4", className);
  switch (severity) {
    case "CRITICAL":
      return <AlertCircle className={cn(iconClass, "text-red-500")} />;
    case "WARNING":
      return <AlertTriangle className={cn(iconClass, "text-yellow-500")} />;
    case "INFO":
      return <Info className={cn(iconClass, "text-blue-500")} />;
    case "SUCCESS":
      return <CheckCircle className={cn(iconClass, "text-green-500")} />;
  }
}

/**
 * Alert Management Page
 */
export default function AlertManagementPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [filters, setFilters] = useState<AlertFilters>({
    status: ["ACTIVE", "ACKNOWLEDGED"],
    page: 0,
    pageSize: 50,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<PlatformAlert | undefined>();
  const [isPlaybookOpen, setIsPlaybookOpen] = useState(false);

  const texts = {
    title: isRtl ? "إدارة التنبيهات" : "Alert Management",
    subtitle: isRtl ? "مراقبة وإدارة تنبيهات المنصة" : "Monitor and manage platform alerts",
    search: isRtl ? "البحث في التنبيهات..." : "Search alerts...",
    severity: isRtl ? "الخطورة" : "Severity",
    status: isRtl ? "الحالة" : "Status",
    type: isRtl ? "النوع" : "Type",
    all: isRtl ? "الكل" : "All",
    export: isRtl ? "تصدير" : "Export",
    refresh: isRtl ? "تحديث" : "Refresh",
    selected: isRtl ? "مختار" : "selected",
    acknowledgeAll: isRtl ? "تأكيد الكل" : "Acknowledge All",
    resolveAll: isRtl ? "حل الكل" : "Resolve All",
    noAlerts: isRtl ? "لا توجد تنبيهات" : "No alerts",
    allClear: isRtl ? "كل شيء على ما يرام!" : "All clear!",
    active: isRtl ? "نشط" : "Active",
    acknowledged: isRtl ? "تم الاطلاع" : "Acknowledged",
    resolved: isRtl ? "تم الحل" : "Resolved",
  };

  // Fetch data
  const { data: alertsData, isLoading: alertsLoading, refetch } = usePlatformAlerts(filters);
  const { data: statistics, isLoading: statsLoading } = useAlertStatistics();

  // Mutations
  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();
  const bulkAcknowledgeMutation = useBulkAcknowledgeAlerts();
  const bulkResolveMutation = useBulkResolveAlerts();

  const alerts = alertsData?.content || [];

  // Filter by search
  const filteredAlerts = alerts.filter((alert) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        alert.title.toLowerCase().includes(search) ||
        alert.message.toLowerCase().includes(search) ||
        (alert.organizationNameEn || "").toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAlerts(filteredAlerts.map((a) => a.id));
    } else {
      setSelectedAlerts([]);
    }
  };

  const handleSelectAlert = (alertId: string, checked: boolean) => {
    if (checked) {
      setSelectedAlerts([...selectedAlerts, alertId]);
    } else {
      setSelectedAlerts(selectedAlerts.filter((id) => id !== alertId));
    }
  };

  const handleBulkAcknowledge = async () => {
    await bulkAcknowledgeMutation.mutateAsync(selectedAlerts);
    setSelectedAlerts([]);
  };

  const handleBulkResolve = async () => {
    await bulkResolveMutation.mutateAsync(selectedAlerts);
    setSelectedAlerts([]);
  };

  const handleAlertClick = (alert: PlatformAlert) => {
    setSelectedAlert(alert);
    setIsPlaybookOpen(true);
  };

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeMutation.mutateAsync(alertId);
  };

  const handleResolve = async (alertId: string) => {
    await resolveMutation.mutateAsync({ alertId });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div className={isRtl ? "text-right" : ""}>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "حرج" : "Critical"}
                </p>
                <p className="text-2xl font-bold text-red-600">{statistics?.critical || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "تحذير" : "Warning"}
                </p>
                <p className="text-2xl font-bold text-yellow-600">{statistics?.warning || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "غير مقروء" : "Unacknowledged"}
                </p>
                <p className="text-2xl font-bold">{statistics?.unacknowledged || 0}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "تم الحل اليوم" : "Resolved Today"}
                </p>
                <p className="text-2xl font-bold text-green-600">{statistics?.resolvedToday || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={cn(
              "flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
              isRtl && "md:flex-row-reverse"
            )}
          >
            <div className={cn("flex flex-wrap items-center gap-2", isRtl && "flex-row-reverse")}>
              <Input
                placeholder={texts.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select
                value={filters.severity?.[0] || "ALL"}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    severity: v === "ALL" ? undefined : [v as AlertSeverity],
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={texts.severity} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="CRITICAL">{isRtl ? "حرج" : "Critical"}</SelectItem>
                  <SelectItem value="WARNING">{isRtl ? "تحذير" : "Warning"}</SelectItem>
                  <SelectItem value="INFO">{isRtl ? "معلومات" : "Info"}</SelectItem>
                  <SelectItem value="SUCCESS">{isRtl ? "نجاح" : "Success"}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status?.[0] || "ACTIVE"}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    status: v === "ALL" ? undefined : [v as AlertStatus],
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={texts.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="ACTIVE">{texts.active}</SelectItem>
                  <SelectItem value="ACKNOWLEDGED">{texts.acknowledged}</SelectItem>
                  <SelectItem value="RESOLVED">{texts.resolved}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedAlerts.length > 0 && (
              <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                <span className="text-sm text-muted-foreground">
                  {selectedAlerts.length} {texts.selected}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkAcknowledge}
                  disabled={bulkAcknowledgeMutation.isPending}
                >
                  {texts.acknowledgeAll}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkResolve}
                  disabled={bulkResolveMutation.isPending}
                >
                  {texts.resolveAll}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardContent className="pt-6">
          {alertsLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">{texts.noAlerts}</p>
              <p className="text-sm text-muted-foreground">{texts.allClear}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All */}
              <div
                className={cn(
                  "flex items-center gap-3 p-2 border-b",
                  isRtl && "flex-row-reverse"
                )}
              >
                <Checkbox
                  checked={
                    filteredAlerts.length > 0 &&
                    selectedAlerts.length === filteredAlerts.length
                  }
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {isRtl ? "تحديد الكل" : "Select All"}
                </span>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filteredAlerts.map((alert) => {
                    const severityConfig = ALERT_SEVERITY_CONFIG[alert.severity];
                    const statusConfig = ALERT_STATUS_CONFIG[alert.status];
                    const isNew = !alert.acknowledgedAt;

                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:shadow-sm transition-all",
                          severityConfig.bgColor,
                          isNew && "ring-2 ring-primary/20",
                          isRtl && "flex-row-reverse"
                        )}
                        onClick={() => handleAlertClick(alert)}
                      >
                        <Checkbox
                          checked={selectedAlerts.includes(alert.id)}
                          onCheckedChange={(checked) =>
                            handleSelectAlert(alert.id, checked as boolean)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className={cn("mt-0.5", severityConfig.color)}>
                          <SeverityIcon severity={alert.severity} className="h-5 w-5" />
                        </div>

                        <div className={cn("flex-1 min-w-0", isRtl && "text-right")}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {isRtl ? alert.titleAr || alert.title : alert.title}
                            </span>
                            {alert.organizationNameEn && (
                              <Badge variant="outline" className="text-xs">
                                {isRtl
                                  ? alert.organizationNameAr || alert.organizationNameEn
                                  : alert.organizationNameEn}
                              </Badge>
                            )}
                            {isNew && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {isRtl ? alert.messageAr || alert.message : alert.message}
                          </p>

                          <div
                            className={cn(
                              "flex items-center gap-3 mt-2 text-xs text-muted-foreground",
                              isRtl && "flex-row-reverse"
                            )}
                          >
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(alert.createdAt), {
                                addSuffix: true,
                                locale: isRtl ? ar : enUS,
                              })}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {isRtl ? statusConfig.labelAr : statusConfig.labelEn}
                            </Badge>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex items-center gap-1",
                            isRtl && "flex-row-reverse"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isNew && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleAcknowledge(alert.id)}
                              disabled={acknowledgeMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {alert.status !== "RESOLVED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleResolve(alert.id)}
                              disabled={resolveMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Playbook Dialog */}
      <AlertPlaybookDialog
        alert={selectedAlert}
        isOpen={isPlaybookOpen}
        onClose={() => {
          setIsPlaybookOpen(false);
          setSelectedAlert(undefined);
        }}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
      />
    </div>
  );
}
