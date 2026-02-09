import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  MessageSquare,
  Timer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ClientHealthMatrix } from "../client-health-matrix";
import { PlatformActivityFeed } from "../platform-activity-feed";
import { AlertCenter } from "../alert-center";
import { HealthOverview } from "../health-overview";
import { DunningStatusWidget } from "../dunning-status-widget";
import type { PlatformHealth, RecentActivity } from "@/types";
import type { PlatformAlert, AlertStatistics } from "@/types";
import type { DunningSequence, DunningStatistics } from "@/types";

interface SupportStats {
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  avgResponseTime: number; // in minutes
  pendingResponse: number;
  escalated: number;
}

interface SupportDashboardProps {
  supportStats: SupportStats | undefined;
  health: PlatformHealth | undefined;
  recentActivity: RecentActivity[] | undefined;
  isLoading?: boolean;
  // Alert Center props
  alerts?: PlatformAlert[];
  alertStatistics?: AlertStatistics;
  // At-Risk clients props
  healthStatistics?: {
    totalClients: number;
    averageScore: number;
    healthyCount: number;
    monitorCount: number;
    atRiskCount: number;
    criticalCount: number;
  };
  atRiskClients?: Array<{
    organizationId: string;
    organizationName: string;
    overallScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    trend: "IMPROVING" | "STABLE" | "DECLINING";
    usageScore: number;
    engagementScore: number;
    paymentScore: number;
    supportScore: number;
    scoreChange?: number;
  }>;
  // Dunning props
  dunningSequences?: DunningSequence[];
  dunningStatistics?: DunningStatistics;
  // Callbacks
  onAcknowledgeAlert?: (alertId: string) => void;
  onResolveAlert?: (alertId: string) => void;
  onRetryPayment?: (dunningId: string) => void;
  onSendPaymentLink?: (dunningId: string) => void;
  onEscalateDunning?: (dunningId: string) => void;
}

interface SupportKPI {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  suffix?: string;
  suffixAr?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  alert?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4 },
  },
};

/**
 * Support-focused dashboard layout for SUPPORT_REP role.
 * Emphasizes tickets, response times, and client health.
 */
export function SupportDashboard({
  supportStats,
  health,
  recentActivity,
  isLoading,
  alerts,
  alertStatistics,
  healthStatistics,
  atRiskClients,
  dunningSequences,
  dunningStatistics,
  onAcknowledgeAlert,
  onResolveAlert,
  onRetryPayment,
  onSendPaymentLink,
  onEscalateDunning,
}: SupportDashboardProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const navigate = useNavigate();
  const isRtl = locale === "ar";

  const texts = {
    welcome: locale === "ar" ? "لوحة الدعم" : "Support Dashboard",
    subtitle:
      locale === "ar" ? "إدارة تذاكر الدعم الفني" : "Manage support tickets",
    newTicket: locale === "ar" ? "تذكرة جديدة" : "New Ticket",
    ticketQueue: locale === "ar" ? "قائمة التذاكر" : "Ticket Queue",
    viewAll: locale === "ar" ? "عرض الكل" : "View All",
    recentTickets: locale === "ar" ? "التذاكر الأخيرة" : "Recent Tickets",
  };

  // Default stats if undefined
  const stats: SupportStats = supportStats || {
    openTickets: 12,
    inProgressTickets: 5,
    resolvedToday: 8,
    avgResponseTime: 45,
    pendingResponse: 3,
    escalated: 2,
  };

  // Compute alert statistics if not provided
  const computedAlertStats: AlertStatistics = alertStatistics ?? {
    totalActive: alerts?.length || 0,
    unacknowledged: alerts?.filter((a) => !a.acknowledgedAt)?.length || 0,
    critical: alerts?.filter((a) => a.severity === "CRITICAL")?.length || 0,
    warning: alerts?.filter((a) => a.severity === "WARNING")?.length || 0,
    info: alerts?.filter((a) => a.severity === "INFO")?.length || 0,
    success: alerts?.filter((a) => a.severity === "SUCCESS")?.length || 0,
    resolvedToday: 0,
    averageResolutionTime: 0,
  };

  // Compute health statistics if not provided
  const computedHealthStats = healthStatistics ?? {
    totalClients: health?.totalClients || 0,
    averageScore: health?.overallHealthScore || 0,
    healthyCount: Math.round((health?.totalClients || 0) * 0.7),
    monitorCount: Math.round((health?.totalClients || 0) * 0.2),
    atRiskCount: Math.round((health?.totalClients || 0) * 0.08),
    criticalCount: Math.round((health?.totalClients || 0) * 0.02),
  };

  const hasActiveDunning = dunningSequences && dunningSequences.length > 0;

  const kpis: SupportKPI[] = [
    {
      id: "open",
      labelEn: "Open Tickets",
      labelAr: "التذاكر المفتوحة",
      value: stats.openTickets,
      icon: Ticket,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      alert: stats.openTickets > 15,
    },
    {
      id: "in-progress",
      labelEn: "In Progress",
      labelAr: "قيد التنفيذ",
      value: stats.inProgressTickets,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    },
    {
      id: "response-time",
      labelEn: "Avg Response",
      labelAr: "متوسط الرد",
      value: stats.avgResponseTime,
      suffix: "min",
      suffixAr: "دقيقة",
      icon: Timer,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
      alert: stats.avgResponseTime > 60,
    },
    {
      id: "resolved",
      labelEn: "Resolved Today",
      labelAr: "تم حلها اليوم",
      value: stats.resolvedToday,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      id: "pending",
      labelEn: "Pending Response",
      labelAr: "في انتظار الرد",
      value: stats.pendingResponse,
      icon: MessageSquare,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
      alert: stats.pendingResponse > 5,
    },
    {
      id: "escalated",
      labelEn: "Escalated",
      labelAr: "مصعدة",
      value: stats.escalated,
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10 dark:bg-red-500/20",
      alert: stats.escalated > 0,
    },
  ];

  if (isLoading) {
    return <SupportDashboardSkeleton />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Quick Actions */}
      <div
        className={cn(
          "flex items-start justify-between flex-wrap gap-4",
          isRtl && "flex-row-reverse"
        )}
      >
        <div className={cn(isRtl && "text-right")}>
          <h1 className="text-2xl font-bold tracking-tight">{texts.welcome}</h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <div className={cn("flex gap-2", isRtl && "flex-row-reverse")}>
          <Link to="/support/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {texts.newTicket}
            </Button>
          </Link>
          <Link to="/support">
            <Button variant="outline" className="gap-2">
              <Ticket className="h-4 w-4" />
              {texts.viewAll}
            </Button>
          </Link>
        </div>
      </div>

      {/* Support KPIs - 6 cards in 2 rows */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <motion.div key={kpi.id} variants={cardVariants}>
            <Card
              className={cn(
                "dark:border-neutral-800 h-full",
                kpi.alert && "border-amber-500/50 dark:border-amber-500/30"
              )}
            >
              <CardContent className="p-4">
                <div
                  className={cn(
                    "flex items-center justify-between mb-3",
                    isRtl && "flex-row-reverse"
                  )}
                >
                  <div className={cn("p-2 rounded-lg", kpi.bgColor)}>
                    <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                  </div>
                  {kpi.alert && (
                    <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
                  )}
                </div>
                <div className={cn(isRtl && "text-right")}>
                  <span className="font-display text-2xl font-bold">
                    <AnimatedNumber
                      value={kpi.value}
                      locale={locale === "ar" ? "ar-SA" : "en-SA"}
                    />
                    {kpi.suffix && (
                      <span className="text-sm font-normal text-muted-foreground ms-1">
                        {locale === "ar" ? kpi.suffixAr : kpi.suffix}
                      </span>
                    )}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {locale === "ar" ? kpi.labelAr : kpi.labelEn}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alert Center + At-Risk Clients Row - NEW */}
      <motion.div variants={cardVariants} className="grid gap-6 lg:grid-cols-2">
        <AlertCenter
          alerts={alerts || []}
          statistics={computedAlertStats}
          onAcknowledge={onAcknowledgeAlert}
          onResolve={onResolveAlert}
          onViewAll={() => navigate(`/platform/alerts`)}
          onAlertClick={(alert) =>
            navigate(`/platform/alerts?id=${alert.id}`)
          }
        />
        <HealthOverview
          statistics={computedHealthStats}
          atRiskClients={atRiskClients}
          onViewAllClick={() => navigate(`/platform/health`)}
          onClientClick={(orgId) =>
            navigate(`/platform/clients/${orgId}/health`)
          }
        />
      </motion.div>

      {/* Dunning Status Widget - NEW (only shown if there are active sequences) */}
      {hasActiveDunning && (
        <motion.div variants={cardVariants}>
          <DunningStatusWidget
            statistics={dunningStatistics}
            sequences={dunningSequences}
            onRetryPayment={onRetryPayment}
            onSendPaymentLink={onSendPaymentLink}
            onEscalate={onEscalateDunning}
            onViewAll={() => navigate(`/platform/dunning`)}
            onSequenceClick={(id) =>
              navigate(`/platform/dunning?id=${id}`)
            }
            isLoading={isLoading}
          />
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Feed - 2/3 width */}
        <div className="lg:col-span-2">
          <PlatformActivityFeed
            activities={recentActivity}
            isLoading={isLoading}
            maxActivities={10}
          />
        </div>

        {/* Client Health Matrix - 1/3 width */}
        <div className="lg:col-span-1">
          <ClientHealthMatrix health={health} isLoading={isLoading} />
        </div>
      </div>
    </motion.div>
  );
}

function SupportDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Center + Health Overview Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>

      {/* Dunning Skeleton */}
      <Skeleton className="h-[300px]" />

      {/* Activity Feed + Client Health Matrix Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-[450px]" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-[450px]" />
        </div>
      </div>
    </div>
  );
}
