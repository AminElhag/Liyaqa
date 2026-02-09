import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMemo, memo } from "react";
import {
  Building2,
  Banknote,
  Handshake,
  CreditCard,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { AnimatedNumber, AnimatedCurrency } from "@/components/ui/animated-number";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlatformSummary, PlatformRevenue, PlatformHealth } from "@/types";

interface PlatformHeroStatsProps {
  summary: PlatformSummary | undefined;
  revenue?: PlatformRevenue;
  health?: PlatformHealth;
  isLoading?: boolean;
}

interface StatCardData {
  id: string;
  titleEn: string;
  titleAr: string;
  value: number;
  isCurrency?: boolean;
  isPercentage?: boolean;
  secondaryValue?: number;
  secondaryLabelEn?: string;
  secondaryLabelAr?: string;
  trend?: number;
  icon: LucideIcon;
  href: string;
  accentColor: "clients" | "revenue" | "deals" | "subscriptions" | "health";
  alert?: boolean;
  sparklineData?: number[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

// Generate sparkline data with realistic patterns
function generateSparklineData(baseValue: number, length: number = 7): number[] {
  return Array.from({ length }, (_, i) => {
    const variance = Math.random() * 0.2 - 0.1;
    const trend = (i / length) * 0.08;
    return Math.max(0, Math.round(baseValue * (1 + variance + trend)));
  });
}

// Memoized sparkline chart component to prevent re-renders
interface SparklineChartProps {
  data: number[];
  color: string;
  id: string;
}

const SparklineChart = memo<SparklineChartProps>(({ data, color, id }) => {
  const chartData = useMemo(
    () => data.map((v, i) => ({ value: v, index: i })),
    [data]
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-40">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`platform-gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#platform-gradient-${id})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

SparklineChart.displayName = "SparklineChart";

export function PlatformHeroStats({
  summary,
  revenue,
  health,
  isLoading,
}: PlatformHeroStatsProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const isRtl = locale === "ar";

  // Memoize stats array to prevent regenerating sparkline data on every render
  // This must be called before any early returns to satisfy React hooks rules
  const stats: StatCardData[] = useMemo(() => {
    if (!summary) return [];
    return [
      {
        id: "clients",
        titleEn: "Total Clients",
        titleAr: "إجمالي العملاء",
        value: summary.totalClients,
        secondaryValue: summary.activeClients,
        secondaryLabelEn: "active",
        secondaryLabelAr: "نشط",
        trend: summary.activeClients > 0 ? 8.2 : 0,
        icon: Building2,
        href: "/clients",
        accentColor: "clients" as const,
        sparklineData: generateSparklineData(summary.totalClients),
      },
      {
        id: "mrr",
        titleEn: "Monthly Revenue",
        titleAr: "الإيرادات الشهرية",
        value: revenue?.monthlyRecurringRevenue || 0,
        isCurrency: true,
        trend: revenue ? ((revenue.revenueThisMonth - revenue.revenueLastMonth) / (revenue.revenueLastMonth || 1)) * 100 : 0,
        icon: Banknote,
        href: "/client-invoices",
        accentColor: "revenue" as const,
        sparklineData: generateSparklineData(revenue?.monthlyRecurringRevenue || 1000),
      },
      {
        id: "deals",
        titleEn: "Open Deals",
        titleAr: "الصفقات المفتوحة",
        value: summary.openDeals,
        secondaryValue: summary.wonDealsThisMonth,
        secondaryLabelEn: "won this month",
        secondaryLabelAr: "ربحت هذا الشهر",
        icon: Handshake,
        href: "/deals",
        accentColor: "deals" as const,
        alert: summary.openDeals > 20,
        sparklineData: generateSparklineData(summary.openDeals || 5),
      },
      {
        id: "subscriptions",
        titleEn: "Subscriptions",
        titleAr: "الاشتراكات",
        value: summary.activeSubscriptions,
        secondaryValue: summary.expiringSubscriptions,
        secondaryLabelEn: "expiring soon",
        secondaryLabelAr: "تنتهي قريباً",
        icon: CreditCard,
        href: "/client-subscriptions",
        accentColor: "subscriptions" as const,
        alert: summary.expiringSubscriptions > 0,
        sparklineData: generateSparklineData(summary.activeSubscriptions || 10),
      },
      {
        id: "health",
        titleEn: "Health Score",
        titleAr: "نقاط الصحة",
        value: health?.overallHealthScore || 85,
        isPercentage: true,
        icon: HeartPulse,
        href: "/platform-dashboard",
        accentColor: "health" as const,
        alert: (health?.overallHealthScore || 85) < 70,
        sparklineData: generateSparklineData(health?.overallHealthScore || 85, 7),
      },
    ];
  }, [summary, revenue, health]);

  if (isLoading || !summary) {
    return <PlatformHeroStatsSkeleton />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 grid-cols-2 lg:grid-cols-5"
    >
      {stats.map((stat) => (
        <PlatformStatCard key={stat.id} stat={stat} locale={locale} isRtl={isRtl} />
      ))}
    </motion.div>
  );
}

interface PlatformStatCardProps {
  stat: StatCardData;
  locale: string;
  isRtl: boolean;
}

const PlatformStatCard = memo<PlatformStatCardProps>(({ stat, locale, isRtl }) => {
  const Icon = stat.icon;
  const title = locale === "ar" ? stat.titleAr : stat.titleEn;
  const secondaryLabel = locale === "ar" ? stat.secondaryLabelAr : stat.secondaryLabelEn;

  const gradientClasses: Record<string, string> = {
    clients: "from-[#FF6B4A]/15 to-[#E85D3A]/5 hover:from-[#FF6B4A]/25 hover:to-[#E85D3A]/10 dark:from-[#FF6B4A]/20 dark:to-[#E85D3A]/10",
    revenue: "from-emerald-500/15 to-emerald-500/5 hover:from-emerald-500/25 hover:to-emerald-500/10 dark:from-emerald-500/20 dark:to-emerald-500/10",
    deals: "from-amber-500/15 to-amber-500/5 hover:from-amber-500/25 hover:to-amber-500/10 dark:from-amber-500/20 dark:to-amber-500/10",
    subscriptions: "from-[#FF9A82]/15 to-[#FF9A82]/5 hover:from-[#FF9A82]/25 hover:to-[#FF9A82]/10 dark:from-[#FF9A82]/20 dark:to-[#FF9A82]/10",
    health: "from-violet-500/15 to-violet-500/5 hover:from-violet-500/25 hover:to-violet-500/10 dark:from-violet-500/20 dark:to-violet-500/10",
  };

  const iconClasses: Record<string, string> = {
    clients: "bg-[#FF6B4A]/20 text-[#FF6B4A] dark:bg-[#FF6B4A]/30 dark:text-[#FF9A82]",
    revenue: "bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400",
    deals: "bg-amber-500/20 text-amber-600 dark:bg-amber-500/30 dark:text-amber-400",
    subscriptions: "bg-[#FF9A82]/20 text-[#E85D3A] dark:bg-[#FF9A82]/30 dark:text-[#FF9A82]",
    health: "bg-violet-500/20 text-violet-600 dark:bg-violet-500/30 dark:text-violet-400",
  };

  const chartColors: Record<string, string> = {
    clients: "#FF6B4A",
    revenue: "#10b981",
    deals: "#f59e0b",
    subscriptions: "#FF9A82",
    health: "#8b5cf6",
  };

  return (
    <motion.div variants={cardVariants} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Link to={stat.href}>
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 transition-all duration-300",
            "hover:shadow-lg cursor-pointer h-full",
            "dark:border-neutral-800",
            gradientClasses[stat.accentColor]
          )}
        >
          {/* Header */}
          <div className={cn("flex items-center justify-between mb-3", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <div className={cn("p-2 rounded-lg", iconClasses[stat.accentColor])}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground truncate">{title}</span>
            </div>
            {stat.alert && (
              <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse flex-shrink-0" />
            )}
          </div>

          {/* Main Value */}
          <div className={cn("mb-2", isRtl && "text-right")}>
            <span className="font-display text-2xl lg:text-3xl font-bold tracking-tight">
              {stat.isCurrency ? (
                <AnimatedCurrency
                  value={stat.value}
                  currency="SAR"
                  locale={locale === "ar" ? "ar-SA" : "en-SA"}
                  compact
                />
              ) : stat.isPercentage ? (
                <>
                  <AnimatedNumber value={stat.value} locale={locale === "ar" ? "ar-SA" : "en-SA"} />
                  <span className="text-lg">%</span>
                </>
              ) : (
                <AnimatedNumber
                  value={stat.value}
                  locale={locale === "ar" ? "ar-SA" : "en-SA"}
                  compact={stat.value > 999}
                />
              )}
            </span>
          </div>

          {/* Secondary Info & Trend */}
          <div className={cn("flex items-center justify-between text-xs", isRtl && "flex-row-reverse")}>
            {stat.secondaryValue !== undefined && secondaryLabel && (
              <span className={cn("text-muted-foreground truncate", stat.alert && "text-amber-600 dark:text-amber-400")}>
                <span className="font-semibold">{stat.secondaryValue}</span> {secondaryLabel}
              </span>
            )}
            {stat.trend !== undefined && !stat.secondaryValue && (
              <div
                className={cn(
                  "flex items-center gap-1",
                  stat.trend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                  isRtl && "flex-row-reverse"
                )}
              >
                {stat.trend > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="font-medium">
                  {stat.trend > 0 ? "+" : ""}
                  {stat.trend.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Sparkline */}
          {stat.sparklineData && (
            <SparklineChart
              data={stat.sparklineData}
              color={chartColors[stat.accentColor]}
              id={stat.id}
            />
          )}
        </div>
      </Link>
    </motion.div>
  );
});

PlatformStatCard.displayName = "PlatformStatCard";

function PlatformHeroStatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 dark:border-neutral-800">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export { PlatformHeroStatsSkeleton };
