"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Shield,
  MapPin,
  Monitor,
  Clock,
  AlertTriangle,
  Lock,
  CheckCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { useSecurityAlerts, useAcknowledgeAlert } from "@/queries/use-security-alerts";
import { AlertSeverity, type SecurityAlertResponse } from "@/types/security";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALERT_TYPE_LABELS: Record<string, { en: string; ar: string; icon: React.ComponentType<{ className?: string }> }> = {
  IMPOSSIBLE_TRAVEL: {
    en: "Impossible Travel",
    ar: "سفر مستحيل",
    icon: MapPin,
  },
  NEW_DEVICE: {
    en: "New Device",
    ar: "جهاز جديد",
    icon: Monitor,
  },
  BRUTE_FORCE: {
    en: "Brute Force Attempt",
    ar: "محاولة القوة الغاشمة",
    icon: AlertTriangle,
  },
  UNUSUAL_TIME: {
    en: "Unusual Login Time",
    ar: "وقت تسجيل دخول غير معتاد",
    icon: Clock,
  },
  NEW_LOCATION: {
    en: "New Location",
    ar: "موقع جديد",
    icon: MapPin,
  },
  MULTIPLE_FAILED_MFA: {
    en: "Multiple Failed MFA",
    ar: "فشل متعدد في المصادقة الثنائية",
    icon: Lock,
  },
  SESSION_HIJACKING: {
    en: "Potential Session Hijacking",
    ar: "احتمال اختطاف الجلسة",
    icon: AlertTriangle,
  },
};

function AlertIcon({ type, className }: { type: string; className?: string }) {
  const config = ALERT_TYPE_LABELS[type];
  const Icon = config?.icon || Shield;
  return <Icon className={className} />;
}

function AlertSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ isArabic }: { isArabic: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <CheckCircle className="h-16 w-16 text-success mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {isArabic ? "لا توجد تنبيهات أمنية" : "No Security Alerts"}
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          {isArabic
            ? "لا توجد تنبيهات أمنية نشطة. سيتم إعلامك هنا عند اكتشاف أي نشاط مشبوه."
            : "You have no active security alerts. You'll be notified here when any suspicious activity is detected."}
        </p>
      </CardContent>
    </Card>
  );
}

interface AlertCardProps {
  alert: SecurityAlertResponse;
  isArabic: boolean;
  dateLocale: typeof enUS | typeof ar;
  onAcknowledge: (alertId: string) => void;
  acknowledging: boolean;
}

function AlertCard({ alert, isArabic, dateLocale, onAcknowledge, acknowledging }: AlertCardProps) {
  const typeConfig = ALERT_TYPE_LABELS[alert.alertType] || {
    en: alert.alertType,
    ar: alert.alertType,
    icon: Shield,
  };

  const severityColors = {
    [AlertSeverity.CRITICAL]: "border-red-500/50 bg-red-50/50 dark:bg-red-950/20",
    [AlertSeverity.HIGH]: "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20",
    [AlertSeverity.MEDIUM]: "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20",
    [AlertSeverity.LOW]: "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20",
  };

  return (
    <Card className={cn("transition-all", severityColors[alert.severity])}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-background border">
            <AlertIcon type={alert.alertType} className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {isArabic ? typeConfig.ar : typeConfig.en}
              </h3>
              <SeverityBadge severity={alert.severity} />
            </div>
            {alert.details && (
              <p className="text-sm text-muted-foreground">{alert.details}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(alert.createdAt), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </p>
          </div>
          {!alert.resolved && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAcknowledge(alert.id)}
              disabled={acknowledging}
            >
              {isArabic ? "هل كنت أنت؟" : "Was this you?"}
            </Button>
          )}
          {alert.resolved && (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isArabic ? "تم التأكيد" : "Acknowledged"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SecurityAlertsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "ALL">("ALL");

  const { data: alerts, isLoading } = useSecurityAlerts();
  const acknowledgeMutation = useAcknowledgeAlert();

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeMutation.mutateAsync(alertId);
      toast.success(isArabic ? "تم تأكيد التنبيه" : "Alert acknowledged");
    } catch {
      toast.error(isArabic ? "فشل في تأكيد التنبيه" : "Failed to acknowledge alert");
    }
  };

  const filteredAlerts = alerts?.filter((alert) => {
    if (severityFilter === "ALL") return true;
    return alert.severity === severityFilter;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isArabic ? "التنبيهات الأمنية" : "Security Alerts"}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? "مراقبة ومراجعة التنبيهات الأمنية والأنشطة المشبوهة"
            : "Monitor and review security alerts and suspicious activities"}
        </p>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {isArabic ? "تصفية" : "Filter"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">
              {isArabic ? "الخطورة:" : "Severity:"}
            </label>
            <Select
              value={severityFilter}
              onValueChange={(value) => setSeverityFilter(value as AlertSeverity | "ALL")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={isArabic ? "جميع المستويات" : "All Severities"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {isArabic ? "الكل" : "All"}
                </SelectItem>
                <SelectItem value={AlertSeverity.CRITICAL}>
                  {isArabic ? "حرجة" : "Critical"}
                </SelectItem>
                <SelectItem value={AlertSeverity.HIGH}>
                  {isArabic ? "عالية" : "High"}
                </SelectItem>
                <SelectItem value={AlertSeverity.MEDIUM}>
                  {isArabic ? "متوسطة" : "Medium"}
                </SelectItem>
                <SelectItem value={AlertSeverity.LOW}>
                  {isArabic ? "منخفضة" : "Low"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {alerts && alerts.length > 0 && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? "الإجمالي" : "Total"}
                  </p>
                  <p className="text-2xl font-bold">{alerts.length}</p>
                </div>
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? "نشط" : "Active"}
                  </p>
                  <p className="text-2xl font-bold">
                    {alerts.filter((a) => !a.resolved).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? "حرجة" : "Critical"}
                  </p>
                  <p className="text-2xl font-bold">
                    {alerts.filter((a) => a.severity === AlertSeverity.CRITICAL).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? "تم التأكيد" : "Acknowledged"}
                  </p>
                  <p className="text-2xl font-bold">
                    {alerts.filter((a) => a.resolved).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <AlertSkeleton />
            <AlertSkeleton />
            <AlertSkeleton />
          </>
        ) : filteredAlerts.length === 0 ? (
          <EmptyState isArabic={isArabic} />
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              isArabic={isArabic}
              dateLocale={dateLocale}
              onAcknowledge={handleAcknowledge}
              acknowledging={acknowledgeMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}
