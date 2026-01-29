"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PlatformHeroStats } from "../platform-hero-stats";
import { PlatformRevenueDashboard } from "../platform-revenue-dashboard";
import { ClientHealthMatrix } from "../client-health-matrix";
import { DealPipelinePreview } from "../deal-pipeline-preview";
import { TopClientsLeaderboard } from "../top-clients-leaderboard";
import { PlatformActivityFeed } from "../platform-activity-feed";
import { DashboardExportMenu } from "../dashboard-export-menu";
import { ClientLifecycleFunnel, type LifecycleOverview } from "../client-lifecycle-funnel";
import { OnboardingMonitor } from "../onboarding-monitor";
import { HealthOverview } from "../health-overview";
import { AlertCenter } from "../alert-center";
import { DunningStatusWidget } from "../dunning-status-widget";
import type {
  PlatformSummary,
  PlatformRevenue,
  PlatformHealth,
  MonthlyRevenue,
  DealPipelineOverview,
  TopClient,
  RecentActivity,
} from "@/types/platform/dashboard";
import type { OnboardingSummary, OnboardingOverview } from "@/types/platform/onboarding";
import type { PlatformAlert, AlertStatistics } from "@/types/platform/alerts";
import type { DunningSequence, DunningStatistics } from "@/types/platform/dunning";

interface AdminDashboardProps {
  summary: PlatformSummary | undefined;
  revenue: PlatformRevenue | undefined;
  health: PlatformHealth | undefined;
  monthlyRevenue: MonthlyRevenue[] | undefined;
  dealPipeline: DealPipelineOverview | undefined;
  topClients: TopClient[] | undefined;
  recentActivity: RecentActivity[] | undefined;
  // New props for enhanced dashboard
  lifecycleOverview?: LifecycleOverview;
  onboardingOverview?: OnboardingOverview;
  onboardingClients?: OnboardingSummary[];
  alerts?: PlatformAlert[];
  alertStatistics?: AlertStatistics;
  dunningSequences?: DunningSequence[];
  dunningStatistics?: DunningStatistics;
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
  isLoading?: boolean;
  // Callbacks
  onSendOnboardingReminder?: (organizationId: string) => void;
  onScheduleCall?: (organizationId: string) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
  onResolveAlert?: (alertId: string) => void;
  onRetryPayment?: (dunningId: string) => void;
  onSendPaymentLink?: (dunningId: string) => void;
  onEscalateDunning?: (dunningId: string) => void;
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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Enhanced Admin Dashboard for PLATFORM_ADMIN role.
 * Shows client lifecycle, onboarding progress, health monitoring, alerts, dunning, and more.
 */
export function AdminDashboard({
  summary,
  revenue,
  health,
  monthlyRevenue,
  dealPipeline,
  topClients,
  recentActivity,
  lifecycleOverview,
  onboardingOverview,
  onboardingClients,
  alerts,
  alertStatistics,
  dunningSequences,
  dunningStatistics,
  healthStatistics,
  atRiskClients,
  isLoading,
  onSendOnboardingReminder,
  onScheduleCall,
  onAcknowledgeAlert,
  onResolveAlert,
  onRetryPayment,
  onSendPaymentLink,
  onEscalateDunning,
}: AdminDashboardProps) {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  const texts = {
    welcome: locale === "ar" ? "مرحباً بك في لوحة التحكم" : "Welcome to Dashboard",
    subtitle:
      locale === "ar"
        ? "نظرة عامة على أداء المنصة"
        : "Overview of platform performance",
  };

  // Compute lifecycle overview from summary if not provided
  const computedLifecycleOverview: LifecycleOverview | undefined = lifecycleOverview ?? (summary ? {
    trial: { stage: "TRIAL", count: summary.trialSubscriptions || 0 },
    onboarding: { stage: "ONBOARDING", count: onboardingClients?.length || 0 },
    active: { stage: "ACTIVE", count: summary.activeClients || 0 },
    atRisk: { stage: "AT_RISK", count: healthStatistics?.atRiskCount || 0 },
    churned: { stage: "CHURNED", count: summary.suspendedClients || 0 },
    totalClients: summary.totalClients || 0,
  } : undefined);

  // Compute health statistics if not provided
  const computedHealthStats = healthStatistics ?? {
    totalClients: summary?.totalClients || 0,
    averageScore: health?.overallHealthScore || 0,
    healthyCount: Math.round((summary?.activeClients || 0) * 0.7),
    monitorCount: Math.round((summary?.activeClients || 0) * 0.2),
    atRiskCount: Math.round((summary?.activeClients || 0) * 0.08),
    criticalCount: Math.round((summary?.activeClients || 0) * 0.02),
  };

  // Compute alert statistics if not provided
  const computedAlertStats: AlertStatistics = alertStatistics ?? {
    totalActive: alerts?.length || 0,
    unacknowledged: alerts?.filter(a => !a.acknowledgedAt)?.length || 0,
    critical: alerts?.filter(a => a.severity === "CRITICAL")?.length || 0,
    warning: alerts?.filter(a => a.severity === "WARNING")?.length || 0,
    info: alerts?.filter(a => a.severity === "INFO")?.length || 0,
    success: alerts?.filter(a => a.severity === "SUCCESS")?.length || 0,
    resolvedToday: 0,
    averageResolutionTime: 0,
  };

  const hasActiveDunning = dunningSequences && dunningSequences.length > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div
        variants={itemVariants}
        className={cn("flex items-start justify-between gap-4", isRtl && "flex-row-reverse")}
      >
        <div className={cn(isRtl && "text-right")}>
          <h1 className="text-2xl font-bold tracking-tight">{texts.welcome}</h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <DashboardExportMenu />
      </motion.div>

      {/* Hero Stats Row - 5 KPIs */}
      <motion.div variants={itemVariants}>
        <PlatformHeroStats
          summary={summary}
          revenue={revenue}
          health={health}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Client Lifecycle Funnel - NEW */}
      <motion.div variants={itemVariants}>
        <ClientLifecycleFunnel
          data={computedLifecycleOverview}
          onStageClick={(stage) => {
            const routes: Record<string, string> = {
              TRIAL: `/${locale}/platform/clients?status=TRIAL`,
              ONBOARDING: `/${locale}/platform/clients?status=ONBOARDING`,
              ACTIVE: `/${locale}/platform/clients?status=ACTIVE`,
              AT_RISK: `/${locale}/platform/health?risk=HIGH`,
              CHURNED: `/${locale}/platform/clients?status=CHURNED`,
            };
            router.push(routes[stage]);
          }}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Main Grid - Revenue (2/3) + Health Overview (1/3) */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlatformRevenueDashboard
            revenue={revenue}
            monthlyData={monthlyRevenue}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <HealthOverview
            statistics={computedHealthStats}
            atRiskClients={atRiskClients}
            onViewAllClick={() => router.push(`/${locale}/platform/health`)}
            onClientClick={(orgId) => router.push(`/${locale}/platform/clients/${orgId}/health`)}
          />
        </div>
      </motion.div>

      {/* Onboarding Monitor + Alert Center - NEW */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        <OnboardingMonitor
          overview={onboardingOverview}
          clients={onboardingClients}
          onSendReminder={onSendOnboardingReminder}
          onScheduleCall={onScheduleCall}
          onViewAll={() => router.push(`/${locale}/platform/clients?status=ONBOARDING`)}
          onClientClick={(orgId) => router.push(`/${locale}/platform/clients/${orgId}`)}
          isLoading={isLoading}
        />
        <AlertCenter
          alerts={alerts || []}
          statistics={computedAlertStats}
          onAcknowledge={onAcknowledgeAlert}
          onResolve={onResolveAlert}
          onViewAll={() => router.push(`/${locale}/platform/alerts`)}
          onAlertClick={(alert) => router.push(`/${locale}/platform/alerts?id=${alert.id}`)}
        />
      </motion.div>

      {/* Dunning Status Widget - NEW (only shown if there are active sequences) */}
      {hasActiveDunning && (
        <motion.div variants={itemVariants}>
          <DunningStatusWidget
            statistics={dunningStatistics}
            sequences={dunningSequences}
            onRetryPayment={onRetryPayment}
            onSendPaymentLink={onSendPaymentLink}
            onEscalate={onEscalateDunning}
            onViewAll={() => router.push(`/${locale}/platform/dunning`)}
            onSequenceClick={(id) => router.push(`/${locale}/platform/dunning?id=${id}`)}
            isLoading={isLoading}
          />
        </motion.div>
      )}

      {/* Pipeline + Top Clients */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        <DealPipelinePreview pipeline={dealPipeline} isLoading={isLoading} />
        <TopClientsLeaderboard clients={topClients} isLoading={isLoading} />
      </motion.div>

      {/* Activity Feed - Full Width */}
      <motion.div variants={itemVariants}>
        <PlatformActivityFeed activities={recentActivity} isLoading={isLoading} />
      </motion.div>
    </motion.div>
  );
}
