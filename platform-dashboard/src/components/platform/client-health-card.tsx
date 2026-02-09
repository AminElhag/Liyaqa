import { useTranslation } from "react-i18next";
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
import { LoadingSkeleton } from "@/components/feedback";
import { useClientHealth } from "@/hooks/use-client-health";
import type { ClientHealthAlertType, ClientHealthAlertSeverity } from "@/types";
import {
  getHealthScoreColor,
  getHealthScoreLabel,
} from "@/types/client-health";

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
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const { data: health, isLoading, error } = useClientHealth(clientId);

  const texts = {
    title: locale === "ar" ? "\u0635\u062D\u0629 \u0627\u0644\u0639\u0645\u064A\u0644" : "Client Health",
    lastActive: locale === "ar" ? "\u0622\u062E\u0631 \u0646\u0634\u0627\u0637" : "Last Active",
    lastLogin: locale === "ar" ? "\u0622\u062E\u0631 \u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644" : "Last Login",
    openTickets: locale === "ar" ? "\u062A\u0630\u0627\u0643\u0631 \u0645\u0641\u062A\u0648\u062D\u0629" : "Open Tickets",
    activeSubscriptions: locale === "ar" ? "\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A \u0646\u0634\u0637\u0629" : "Active Subscriptions",
    clubs: locale === "ar" ? "\u0627\u0644\u0623\u0646\u062F\u064A\u0629" : "Clubs",
    notes: locale === "ar" ? "\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A" : "Notes",
    never: locale === "ar" ? "\u0644\u0645 \u064A\u0633\u062C\u0644 \u062F\u062E\u0648\u0644" : "Never",
    alerts: locale === "ar" ? "\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A" : "Alerts",
    noAlerts: locale === "ar" ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0646\u0628\u064A\u0647\u0627\u062A" : "No alerts",
    errorLoading: locale === "ar" ? "\u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" : "Error loading health data",
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <LoadingSkeleton variant="card" />
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
        return locale === "ar" ? "\u0627\u0644\u0622\u0646" : "Just now";
      } else if (diffMins < 60) {
        return locale === "ar" ? `\u0645\u0646\u0630 ${diffMins} \u062F\u0642\u064A\u0642\u0629` : `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return locale === "ar" ? `\u0645\u0646\u0630 ${diffHours} \u0633\u0627\u0639\u0629` : `${diffHours}h ago`;
      } else if (diffDays < 30) {
        return locale === "ar" ? `\u0645\u0646\u0630 ${diffDays} \u064A\u0648\u0645` : `${diffDays}d ago`;
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
