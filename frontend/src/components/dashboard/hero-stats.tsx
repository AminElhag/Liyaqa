"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CreditCard,
  UserCheck,
  Banknote,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";
import type { DashboardSummary } from "@/lib/api/dashboard";

interface HeroStatsProps {
  summary: DashboardSummary | undefined;
  isLoading?: boolean;
}

interface StatCardData {
  titleEn: string;
  titleAr: string;
  value: number;
  secondaryValue?: number;
  secondaryLabelEn?: string;
  secondaryLabelAr?: string;
  trend?: number;
  icon: LucideIcon;
  href: string;
  accentColor: "primary" | "success" | "warning" | "danger";
  alert?: boolean;
  sparklineData?: number[];
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

// Generate mock sparkline data
function generateSparklineData(baseValue: number, length: number = 7): number[] {
  return Array.from({ length }, (_, i) => {
    const variance = Math.random() * 0.3 - 0.15;
    const trend = (i / length) * 0.1;
    return Math.max(0, Math.round(baseValue * (1 + variance + trend)));
  });
}

export function HeroStats({ summary, isLoading }: HeroStatsProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  if (isLoading || !summary) {
    return <HeroStatsSkeleton />;
  }

  const stats: StatCardData[] = [
    {
      titleEn: "Total Members",
      titleAr: "إجمالي الأعضاء",
      value: summary.totalMembers,
      secondaryValue: summary.activeMembers,
      secondaryLabelEn: "active",
      secondaryLabelAr: "نشط",
      trend: summary.newMembersThisMonth > 0 ? 5.2 : -2.1,
      icon: Users,
      href: "/members",
      accentColor: "primary",
      sparklineData: generateSparklineData(summary.totalMembers),
    },
    {
      titleEn: "Active Subscriptions",
      titleAr: "الاشتراكات النشطة",
      value: summary.activeSubscriptions,
      secondaryValue: summary.expiringThisWeek,
      secondaryLabelEn: "expiring this week",
      secondaryLabelAr: "تنتهي هذا الأسبوع",
      icon: CreditCard,
      href: "/subscriptions",
      accentColor: "success",
      alert: summary.expiringThisWeek > 0,
      sparklineData: generateSparklineData(summary.activeSubscriptions),
    },
    {
      titleEn: "Today's Check-ins",
      titleAr: "تسجيلات اليوم",
      value: summary.todayCheckIns,
      trend: 12.5,
      icon: UserCheck,
      href: "/attendance",
      accentColor: "warning",
      sparklineData: generateSparklineData(summary.todayCheckIns),
    },
    {
      titleEn: "Monthly Revenue",
      titleAr: "الإيرادات الشهرية",
      value: summary.monthlyRevenue,
      secondaryValue: summary.pendingInvoices + summary.overdueInvoices,
      secondaryLabelEn: "pending invoices",
      secondaryLabelAr: "فواتير معلقة",
      icon: Banknote,
      href: "/invoices",
      accentColor: "danger",
      alert: summary.overdueInvoices > 0,
      sparklineData: generateSparklineData(summary.monthlyRevenue / 100),
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat, index) => (
        <HeroStatCard key={index} stat={stat} locale={locale} isRtl={isRtl} />
      ))}
    </motion.div>
  );
}

interface HeroStatCardProps {
  stat: StatCardData;
  locale: string;
  isRtl: boolean;
}

function HeroStatCard({ stat, locale, isRtl }: HeroStatCardProps) {
  const Icon = stat.icon;
  const title = locale === "ar" ? stat.titleAr : stat.titleEn;
  const secondaryLabel = locale === "ar" ? stat.secondaryLabelAr : stat.secondaryLabelEn;

  const gradientClasses: Record<string, string> = {
    primary: "from-sky-500/10 to-sky-500/5 hover:from-sky-500/20 hover:to-sky-500/10",
    success: "from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10",
    warning: "from-amber-500/10 to-amber-500/5 hover:from-amber-500/20 hover:to-amber-500/10",
    danger: "from-red-500/10 to-red-500/5 hover:from-red-500/20 hover:to-red-500/10",
  };

  const iconClasses: Record<string, string> = {
    primary: "bg-sky-500/20 text-sky-600",
    success: "bg-green-500/20 text-green-600",
    warning: "bg-amber-500/20 text-amber-600",
    danger: "bg-red-500/20 text-red-600",
  };

  const chartColors: Record<string, string> = {
    primary: "#0ea5e9",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
  };

  return (
    <motion.div variants={cardVariants}>
      <Link href={`/${locale}${stat.href}`}>
        <div
          className={cn(
            "relative overflow-hidden rounded-md3-lg border bg-gradient-to-br p-4 transition-all duration-300",
            "hover:shadow-md3-2 hover:scale-[1.02] cursor-pointer",
            "md3-state-layer",
            gradientClasses[stat.accentColor]
          )}
        >
          {/* Header */}
          <div className={cn("flex items-center justify-between mb-3", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <div className={cn("p-2 rounded-lg", iconClasses[stat.accentColor])}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            {stat.alert && (
              <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
            )}
          </div>

          {/* Main Value */}
          <div className={cn("mb-2", isRtl && "text-right")}>
            <span className="font-display text-3xl font-bold tracking-tight">
              <AnimatedNumber
                value={stat.value}
                locale={locale === "ar" ? "ar-SA" : "en-SA"}
                compact={stat.value > 9999}
              />
            </span>
          </div>

          {/* Secondary Info & Trend */}
          <div className={cn("flex items-center justify-between text-sm", isRtl && "flex-row-reverse")}>
            {stat.secondaryValue !== undefined && (
              <span className={cn("text-muted-foreground", stat.alert && "text-amber-600")}>
                <span className="font-medium">{stat.secondaryValue}</span> {secondaryLabel}
              </span>
            )}
            {stat.trend !== undefined && !stat.secondaryValue && (
              <div className={cn(
                "flex items-center gap-1",
                stat.trend > 0 ? "text-green-600" : "text-red-600",
                isRtl && "flex-row-reverse"
              )}>
                {stat.trend > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-xs font-medium">
                  {stat.trend > 0 ? "+" : ""}{stat.trend.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Sparkline */}
          {stat.sparklineData && (
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-50">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stat.sparklineData.map((v, i) => ({ value: v, index: i }))}>
                  <defs>
                    <linearGradient id={`gradient-${stat.accentColor}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors[stat.accentColor]} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={chartColors[stat.accentColor]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColors[stat.accentColor]}
                    strokeWidth={2}
                    fill={`url(#gradient-${stat.accentColor})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function HeroStatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-md3-lg border bg-card p-4 animate-pulse shadow-md3-1"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-md3-md bg-muted" />
            <div className="h-4 w-24 rounded-md3-sm bg-muted" />
          </div>
          <div className="h-8 w-20 rounded-md3-sm bg-muted mb-2" />
          <div className="h-4 w-32 rounded-md3-sm bg-muted" />
        </div>
      ))}
    </div>
  );
}

export { HeroStatsSkeleton };
