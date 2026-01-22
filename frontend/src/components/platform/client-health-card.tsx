"use client";

import { useLocale } from "next-intl";
import {
  Activity,
  AlertTriangle,
  Clock,
  Ticket,
  CreditCard,
  FileWarning,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/spinner";
import { useClientHealth } from "@/queries/platform/use-platform-clients";
import type { ClientHealth, ClientHealthAlertType, ClientHealthAlertSeverity } from "@/types/platform/client-health";
import {
  getHealthScoreColor,
  getHealthScoreLabel,
  CLIENT_HEALTH_ALERT_CONFIG,
  CLIENT_SEVERITY_COLORS,
} from "@/types/platform/client-health";

interface ClientHealthCardProps {
  clientId: string;
}

const alertIcons: Record<ClientHealthAlertType, React.ReactNode> = {
  NO_RECENT_ACTIVITY: <Clock className="h-4 w-4" />,
  OPEN_TICKETS: <Ticket className="h-4 w-4" />,
  NO_ACTIVE_SUBSCRIPTION: <CreditCard className="h-4 w-4" />,
  SUBSCRIPTION_EXPIRING_SOON: <AlertTriangle className="h-4 w-4" />,
  OVERDUE_INVOICE: <FileWarning className="h-4 w-4" />,
};

const severityIcons: Record<ClientHealthAlertSeverity, React.ReactNode> = {
  INFO: <AlertCircle className="h-3 w-3" />,
  WARNING: <AlertTriangle className="h-3 w-3" />,
  CRITICAL: <XCircle className="h-3 w-3" />,
};

const severityClasses: Record<ClientHealthAlertSeverity, string> = {
  INFO: "bg-blue-50 text-blue-700 border-blue-200",
  WARNING: "bg-amber-50 text-amber-700 border-amber-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
};

const scoreColorClasses: Record<string, string> = {
  emerald: "text-emerald-600 bg-emerald-100",
  yellow: "text-yellow-600 bg-yellow-100",
  orange: "text-orange-600 bg-orange-100",
  red: "text-red-600 bg-red-100",
};

export function ClientHealthCard({ clientId }: ClientHealthCardProps) {
  const locale = useLocale();
  const { data: health, isLoading, error } = useClientHealth(clientId);

  const texts = {
    title: locale === "ar" ? "صحة العميل" : "Client Health",
    lastActive: locale === "ar" ? "آخر نشاط" : "Last Active",
    lastLogin: locale === "ar" ? "آخر تسجيل دخول" : "Last Login",
    openTickets: locale === "ar" ? "تذاكر مفتوحة" : "Open Tickets",
    activeSubscriptions: locale === "ar" ? "اشتراكات نشطة" : "Active Subscriptions",
    clubs: locale === "ar" ? "الأندية" : "Clubs",
    notes: locale === "ar" ? "الملاحظات" : "Notes",
    never: locale === "ar" ? "لم يسجل دخول" : "Never",
    alerts: locale === "ar" ? "التنبيهات" : "Alerts",
    noAlerts: locale === "ar" ? "لا توجد تنبيهات" : "No alerts",
    errorLoading: locale === "ar" ? "خطأ في تحميل البيانات" : "Error loading health data",
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loading />
        </CardContent>
      </Card>
    );
  }

  if (error || !health) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          {texts.errorLoading}
        </CardContent>
      </Card>
    );
  }

  const scoreColor = getHealthScoreColor(health.healthScore);
  const scoreLabel = getHealthScoreLabel(health.healthScore, locale);

  // Simple relative time formatter without date-fns
  const formatTimeAgo = (dateString: string | undefined) => {
    if (!dateString) return texts.never;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return locale === "ar" ? "الآن" : "Just now";
      } else if (diffMins < 60) {
        return locale === "ar" ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return locale === "ar" ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
      } else if (diffDays < 30) {
        return locale === "ar" ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
      } else {
        // Use date formatting for older dates
        return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
          month: "short",
          day: "numeric",
        });
      }
    } catch {
      return texts.never;
    }
  };

  return (
    <Card className="border-teal-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            {texts.title}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${
                scoreColorClasses[scoreColor]?.split(" ")[0] || "text-slate-600"
              }`}
            >
              {health.healthScore}
            </span>
            <Badge
              variant="outline"
              className={scoreColorClasses[scoreColor] || "bg-slate-100 text-slate-600"}
            >
              {scoreLabel}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{texts.lastActive}</p>
            <p className="text-sm font-medium">{formatTimeAgo(health.lastActiveAt)}</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{texts.openTickets}</p>
            <p className="text-sm font-medium">{health.openTicketsCount}</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{texts.activeSubscriptions}</p>
            <p className="text-sm font-medium">{health.activeSubscriptionsCount}</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{texts.clubs}</p>
            <p className="text-sm font-medium">{health.totalClubs}</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{texts.notes}</p>
            <p className="text-sm font-medium">{health.totalNotes}</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{texts.lastLogin}</p>
            <p className="text-sm font-medium">{formatTimeAgo(health.lastLoginAt)}</p>
          </div>
        </div>

        {/* Alerts */}
        {health.alerts && health.alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{texts.alerts}</p>
            <div className="space-y-1">
              {health.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-lg border ${severityClasses[alert.severity]}`}
                >
                  <span className="shrink-0">{alertIcons[alert.type]}</span>
                  <span className="text-sm flex-1">{alert.message}</span>
                  <span className="shrink-0">{severityIcons[alert.severity]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {health.alerts.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{texts.noAlerts}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
