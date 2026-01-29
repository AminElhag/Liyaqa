"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Handshake,
  Building2,
  CreditCard,
  Trophy,
  Plus,
  TrendingUp,
  TrendingDown,
  PlayCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AnimatedNumber, AnimatedCurrency } from "@/components/ui/animated-number";
import { DealPipelinePreview } from "../deal-pipeline-preview";
import { TopClientsLeaderboard } from "../top-clients-leaderboard";
import { PlatformActivityFeed } from "../platform-activity-feed";
import { DashboardExportMenu } from "../dashboard-export-menu";
import { QuickActionMenu } from "../quick-action-menu";
import type {
  PlatformSummary,
  DealPipelineOverview,
  TopClient,
  RecentActivity,
  ExpiringClientSubscription,
} from "@/types/platform/dashboard";

/**
 * Trial client data
 */
interface TrialClient {
  organizationId: string;
  organizationNameEn: string;
  organizationNameAr?: string;
  daysRemaining: number;
  onboardingProgress: number;
  source?: string;
  lastActivityAt?: string;
}

/**
 * Upsell opportunity
 */
interface UpsellOpportunity {
  organizationId: string;
  organizationNameEn: string;
  organizationNameAr?: string;
  currentPlan: string;
  usagePercent: number;
  recommendedPlan?: string;
  potentialUpgrade: number;
}

interface SalesDashboardProps {
  summary: PlatformSummary | undefined;
  dealPipeline: DealPipelineOverview | undefined;
  topClients: TopClient[] | undefined;
  recentActivity: RecentActivity[] | undefined;
  // New props
  trialClients?: TrialClient[];
  upsellOpportunities?: UpsellOpportunity[];
  conversionRate?: number;
  expiringSubscriptions?: ExpiringClientSubscription[];
  isLoading?: boolean;
}

interface SalesKPI {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  secondaryValue?: number;
  secondaryLabelEn?: string;
  secondaryLabelAr?: string;
  trend?: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href: string;
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
 * Trial Follow-up Card Component
 */
function TrialFollowUpCard({
  trials,
  locale,
  onViewAll,
  onClientClick,
}: {
  trials: TrialClient[];
  locale: string;
  onViewAll: () => void;
  onClientClick: (organizationId: string) => void;
}) {
  const isRtl = locale === "ar";

  const texts = {
    title: isRtl ? "العملاء التجريبيين" : "Trial Clients",
    subtitle: isRtl ? "يحتاجون متابعة" : "Needing follow-up",
    viewAll: isRtl ? "عرض الكل" : "View All",
    daysLeft: isRtl ? "أيام متبقية" : "days left",
    progress: isRtl ? "التقدم" : "progress",
    noTrials: isRtl ? "لا يوجد عملاء تجريبيين" : "No trial clients",
  };

  // Sort by days remaining (most urgent first)
  const sortedTrials = [...trials].sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
          <div>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-blue-500" />
              {texts.title}
            </CardTitle>
            <CardDescription>{texts.subtitle}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            {texts.viewAll}
            <ChevronRight className={cn("h-4 w-4 ms-1", isRtl && "rotate-180")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedTrials.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <PlayCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{texts.noTrials}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTrials.slice(0, 5).map((trial) => (
              <button
                key={trial.organizationId}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left",
                  trial.daysRemaining <= 3 && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
                  trial.daysRemaining <= 7 && trial.daysRemaining > 3 && "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20",
                  isRtl && "text-right flex-row-reverse"
                )}
                onClick={() => onClientClick(trial.organizationId)}
              >
                <div className={cn("flex-1", isRtl && "text-right")}>
                  <div className="font-medium">
                    {isRtl ? trial.organizationNameAr || trial.organizationNameEn : trial.organizationNameEn}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        trial.daysRemaining <= 3 && "border-red-500 text-red-600",
                        trial.daysRemaining <= 7 && trial.daysRemaining > 3 && "border-amber-500 text-amber-600"
                      )}
                    >
                      <Clock className="h-3 w-3 me-1" />
                      {trial.daysRemaining} {texts.daysLeft}
                    </Badge>
                    <span>{trial.onboardingProgress}% {texts.progress}</span>
                  </div>
                </div>
                <QuickActionMenu context="trial" entityId={trial.organizationId} />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Conversion Funnel Component
 */
function ConversionFunnel({
  pipeline,
  conversionRate,
  locale,
}: {
  pipeline?: DealPipelineOverview;
  conversionRate?: number;
  locale: string;
}) {
  const isRtl = locale === "ar";

  const texts = {
    title: isRtl ? "قمع التحويل" : "Conversion Funnel",
    subtitle: isRtl ? "مسار العميل من التجربة إلى التحويل" : "Trial to conversion path",
    trial: isRtl ? "تجربة" : "Trial",
    qualified: isRtl ? "مؤهل" : "Qualified",
    proposal: isRtl ? "عرض سعر" : "Proposal",
    won: isRtl ? "ربح" : "Won",
    conversionRate: isRtl ? "معدل التحويل" : "Conversion Rate",
  };

  const stages = [
    { key: "trial", label: texts.trial, count: pipeline?.leads || 0, color: "bg-blue-500" },
    { key: "qualified", label: texts.qualified, count: pipeline?.qualified || 0, color: "bg-amber-500" },
    { key: "proposal", label: texts.proposal, count: pipeline?.proposal || 0, color: "bg-purple-500" },
    { key: "won", label: texts.won, count: pipeline?.negotiation || 0, color: "bg-green-500" },
  ];

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {texts.title}
        </CardTitle>
        <CardDescription>{texts.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.key}>
              <div
                className={cn(
                  "flex items-center justify-between mb-1 text-sm",
                  isRtl && "flex-row-reverse"
                )}
              >
                <span className="font-medium">{stage.label}</span>
                <span className="text-muted-foreground">{stage.count}</span>
              </div>
              <div className="relative">
                <Progress
                  value={(stage.count / maxCount) * 100}
                  className="h-6"
                  indicatorClassName={stage.color}
                />
                {index < stages.length - 1 && (
                  <ArrowRight
                    className={cn(
                      "absolute -bottom-4 left-1/2 -translate-x-1/2 h-4 w-4 text-muted-foreground",
                      isRtl && "rotate-180"
                    )}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {conversionRate !== undefined && (
          <div className="mt-6 pt-4 border-t">
            <div
              className={cn(
                "flex items-center justify-between",
                isRtl && "flex-row-reverse"
              )}
            >
              <span className="text-sm text-muted-foreground">{texts.conversionRate}</span>
              <span className="text-2xl font-bold text-green-600">{conversionRate}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Upsell Opportunities Card
 */
function UpsellOpportunitiesCard({
  opportunities,
  locale,
  onViewAll,
  onClientClick,
}: {
  opportunities: UpsellOpportunity[];
  locale: string;
  onViewAll: () => void;
  onClientClick: (organizationId: string) => void;
}) {
  const isRtl = locale === "ar";

  const texts = {
    title: isRtl ? "فرص الترقية" : "Upsell Opportunities",
    subtitle: isRtl ? "عملاء يقتربون من حدودهم" : "Clients approaching limits",
    viewAll: isRtl ? "عرض الكل" : "View All",
    usage: isRtl ? "استخدام" : "usage",
    upgrade: isRtl ? "ترقية" : "Upgrade",
    noOpportunities: isRtl ? "لا توجد فرص ترقية" : "No upsell opportunities",
  };

  // Sort by usage percent (highest first)
  const sortedOpportunities = [...opportunities].sort((a, b) => b.usagePercent - a.usagePercent);

  return (
    <Card className="border-emerald-200 dark:border-emerald-800">
      <CardHeader className="pb-2">
        <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              {texts.title}
            </CardTitle>
            <CardDescription>{texts.subtitle}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            {texts.viewAll}
            <ChevronRight className={cn("h-4 w-4 ms-1", isRtl && "rotate-180")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedOpportunities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{texts.noOpportunities}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedOpportunities.slice(0, 5).map((opp) => (
              <button
                key={opp.organizationId}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left",
                  opp.usagePercent >= 90 && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
                  isRtl && "text-right flex-row-reverse"
                )}
                onClick={() => onClientClick(opp.organizationId)}
              >
                <div className={cn("flex-1", isRtl && "text-right")}>
                  <div className="font-medium">
                    {isRtl ? opp.organizationNameAr || opp.organizationNameEn : opp.organizationNameEn}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={opp.usagePercent}
                      className="h-2 w-24"
                      indicatorClassName={cn(
                        opp.usagePercent >= 90 && "bg-red-500",
                        opp.usagePercent >= 80 && opp.usagePercent < 90 && "bg-amber-500"
                      )}
                    />
                    <span className="text-xs text-muted-foreground">
                      {opp.usagePercent}% {texts.usage}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="ms-2">
                  {texts.upgrade}
                </Button>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Sales-focused dashboard layout for SALES_REP role.
 * Emphasizes deals, trials, clients, and upsell opportunities.
 */
export function SalesDashboard({
  summary,
  dealPipeline,
  topClients,
  recentActivity,
  trialClients = [],
  upsellOpportunities = [],
  conversionRate,
  expiringSubscriptions,
  isLoading,
}: SalesDashboardProps) {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  const texts = {
    welcome: locale === "ar" ? "لوحة المبيعات" : "Sales Dashboard",
    subtitle:
      locale === "ar" ? "تتبع صفقاتك وعملائك" : "Track your deals and clients",
    quickActions: locale === "ar" ? "إجراءات سريعة" : "Quick Actions",
    newDeal: locale === "ar" ? "صفقة جديدة" : "New Deal",
    newClient: locale === "ar" ? "عميل جديد" : "New Client",
  };

  const kpis: SalesKPI[] = [
    {
      id: "deals",
      labelEn: "Open Deals",
      labelAr: "الصفقات المفتوحة",
      value: summary?.openDeals || 0,
      trend: 12.5,
      icon: Handshake,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
      href: "/platform/deals",
    },
    {
      id: "clients",
      labelEn: "Active Clients",
      labelAr: "العملاء النشطين",
      value: summary?.activeClients || 0,
      secondaryValue: summary?.pendingClients || 0,
      secondaryLabelEn: "pending",
      secondaryLabelAr: "في الانتظار",
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      href: "/platform/clients",
    },
    {
      id: "subscriptions",
      labelEn: "Active Subscriptions",
      labelAr: "الاشتراكات النشطة",
      value: summary?.activeSubscriptions || 0,
      secondaryValue: summary?.expiringSubscriptions || 0,
      secondaryLabelEn: "expiring",
      secondaryLabelAr: "تنتهي قريباً",
      icon: CreditCard,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
      href: "/platform/client-subscriptions",
    },
    {
      id: "won",
      labelEn: "Won This Month",
      labelAr: "ربحت هذا الشهر",
      value: summary?.wonDealsThisMonth || 0,
      secondaryValue: summary?.lostDealsThisMonth || 0,
      secondaryLabelEn: "lost",
      secondaryLabelAr: "خسرت",
      icon: Trophy,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
      href: "/platform/deals?status=WON",
    },
  ];

  if (isLoading) {
    return <SalesDashboardSkeleton />;
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
          <Link href={`/${locale}/platform/deals/new`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {texts.newDeal}
            </Button>
          </Link>
          <Link href={`/${locale}/platform/clients/new`}>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              {texts.newClient}
            </Button>
          </Link>
          <DashboardExportMenu />
        </div>
      </div>

      {/* Sales KPIs - 4 cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.id} variants={cardVariants}>
            <Link href={`/${locale}${kpi.href}`}>
              <Card
                className={cn(
                  "hover:shadow-md transition-all cursor-pointer dark:border-neutral-800",
                  "hover:scale-[1.02]"
                )}
              >
                <CardContent className="p-4">
                  <div
                    className={cn(
                      "flex items-center gap-3 mb-3",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", kpi.bgColor)}>
                      <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {locale === "ar" ? kpi.labelAr : kpi.labelEn}
                    </span>
                  </div>
                  <div className={cn(isRtl && "text-right")}>
                    <span className="font-display text-3xl font-bold">
                      <AnimatedNumber
                        value={kpi.value}
                        locale={locale === "ar" ? "ar-SA" : "en-SA"}
                      />
                    </span>
                    {kpi.trend && (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs mt-1",
                          kpi.trend > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400",
                          isRtl && "flex-row-reverse justify-end"
                        )}
                      >
                        {kpi.trend > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {kpi.trend > 0 ? "+" : ""}
                          {kpi.trend}%
                        </span>
                      </div>
                    )}
                    {kpi.secondaryValue !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span
                          className={cn(
                            "font-semibold",
                            kpi.secondaryValue > 0 && "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {kpi.secondaryValue}
                        </span>{" "}
                        {locale === "ar" ? kpi.secondaryLabelAr : kpi.secondaryLabelEn}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Trial Follow-up + Conversion Funnel - NEW */}
      <motion.div variants={cardVariants} className="grid gap-6 lg:grid-cols-2">
        <TrialFollowUpCard
          trials={trialClients}
          locale={locale}
          onViewAll={() => router.push(`/${locale}/platform/clients?status=TRIAL`)}
          onClientClick={(orgId) => router.push(`/${locale}/platform/clients/${orgId}`)}
        />
        <ConversionFunnel
          pipeline={dealPipeline}
          conversionRate={conversionRate}
          locale={locale}
        />
      </motion.div>

      {/* Deal Pipeline - Full Width */}
      <DealPipelinePreview pipeline={dealPipeline} isLoading={isLoading} />

      {/* Top Clients + Upsell Opportunities - NEW */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopClientsLeaderboard clients={topClients} isLoading={isLoading} />
        <UpsellOpportunitiesCard
          opportunities={upsellOpportunities}
          locale={locale}
          onViewAll={() => router.push(`/${locale}/platform/health?filter=usage`)}
          onClientClick={(orgId) => router.push(`/${locale}/platform/clients/${orgId}`)}
        />
      </div>

      {/* Activity Feed */}
      <PlatformActivityFeed
        activities={recentActivity?.filter(
          (a) =>
            a.entityType.includes("DEAL") ||
            a.entityType.includes("CLIENT") ||
            a.entityType.includes("SUBSCRIPTION")
        )}
        isLoading={isLoading}
        maxActivities={6}
      />
    </motion.div>
  );
}

function SalesDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
      <Skeleton className="h-[250px] w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
      </div>
    </div>
  );
}
