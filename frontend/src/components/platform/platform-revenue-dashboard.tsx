"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnimatedCurrency, AnimatedPercentage } from "@/components/ui/animated-number";
import type { PlatformRevenue, MonthlyRevenue } from "@/types/platform/dashboard";

interface PlatformRevenueDashboardProps {
  revenue: PlatformRevenue | undefined;
  monthlyData: MonthlyRevenue[] | undefined;
  isLoading?: boolean;
}

type Period = "month" | "quarter" | "year";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.15 },
  },
};

export function PlatformRevenueDashboard({
  revenue,
  monthlyData,
  isLoading,
}: PlatformRevenueDashboardProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [period, setPeriod] = useState<Period>("month");

  const texts = {
    title: locale === "ar" ? "نظرة عامة على الإيرادات" : "Revenue Overview",
    mrr: locale === "ar" ? "الإيرادات الشهرية المتكررة" : "Monthly Recurring Revenue",
    thisMonth: locale === "ar" ? "هذا الشهر" : "This Month",
    collectionRate: locale === "ar" ? "معدل التحصيل" : "Collection Rate",
    outstanding: locale === "ar" ? "المبالغ المستحقة" : "Outstanding",
    overdue: locale === "ar" ? "المتأخرة" : "Overdue",
    month: locale === "ar" ? "شهر" : "Month",
    quarter: locale === "ar" ? "ربع سنة" : "Quarter",
    year: locale === "ar" ? "سنة" : "Year",
  };

  if (isLoading) {
    return <PlatformRevenueDashboardSkeleton />;
  }

  const chartData = (monthlyData || []).map((item) => ({
    name: item.monthName,
    revenue: item.revenue,
    invoices: item.invoiceCount,
  }));

  // Check if we have valid chart data to prevent dimension errors
  const hasChartData = chartData.length > 0;

  const mrrTrend = revenue
    ? ((revenue.revenueThisMonth - revenue.revenueLastMonth) / (revenue.revenueLastMonth || 1)) * 100
    : 0;

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card className="dark:border-neutral-800">
        <CardHeader className={cn("pb-4", isRtl && "text-right")}>
          <div className={cn("flex items-center justify-between flex-wrap gap-2", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-lg font-semibold">{texts.title}</CardTitle>
            </div>
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {(["month", "quarter", "year"] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className="h-7 px-3 text-xs"
                >
                  {texts[p]}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatBox
              label={texts.mrr}
              value={revenue?.monthlyRecurringRevenue || 0}
              isCurrency
              trend={mrrTrend}
              icon={TrendingUp}
              color="emerald"
              locale={locale}
              isRtl={isRtl}
            />
            <StatBox
              label={texts.thisMonth}
              value={revenue?.revenueThisMonth || 0}
              isCurrency
              icon={Banknote}
              color="coral"
              locale={locale}
              isRtl={isRtl}
            />
            <StatBox
              label={texts.collectionRate}
              value={revenue?.collectionRate || 0}
              isPercentage
              icon={TrendingUp}
              color="violet"
              locale={locale}
              isRtl={isRtl}
            />
            <StatBox
              label={texts.outstanding}
              value={revenue?.outstandingAmount || 0}
              isCurrency
              secondaryValue={revenue?.overdueAmount}
              secondaryLabel={texts.overdue}
              icon={revenue?.overdueAmount ? AlertTriangle : Clock}
              color={revenue?.overdueAmount ? "amber" : "slate"}
              locale={locale}
              isRtl={isRtl}
            />
          </div>

          {/* Chart */}
          <div className="h-[220px] mt-4">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: isRtl ? 30 : 10, left: isRtl ? 10 : 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="platformRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6B4A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E85D3A" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    reversed={isRtl}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCompactNumber(value, locale)}
                    orientation={isRtl ? "right" : "left"}
                  />
                  <Tooltip content={<CustomTooltip locale={locale} />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FF6B4A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#platformRevenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>{locale === "ar" ? "لا توجد بيانات للعرض" : "No data to display"}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatBoxProps {
  label: string;
  value: number;
  isCurrency?: boolean;
  isPercentage?: boolean;
  trend?: number;
  secondaryValue?: number;
  secondaryLabel?: string;
  icon: React.ElementType;
  color: "emerald" | "blue" | "violet" | "amber" | "slate" | "coral";
  locale: string;
  isRtl: boolean;
}

function StatBox({
  label,
  value,
  isCurrency,
  isPercentage,
  trend,
  secondaryValue,
  secondaryLabel,
  icon: Icon,
  color,
  locale,
  isRtl,
}: StatBoxProps) {
  const bgColors: Record<string, string> = {
    emerald: "bg-emerald-500/10 dark:bg-emerald-500/20",
    blue: "bg-blue-500/10 dark:bg-blue-500/20",
    violet: "bg-violet-500/10 dark:bg-violet-500/20",
    amber: "bg-amber-500/10 dark:bg-amber-500/20",
    slate: "bg-slate-500/10 dark:bg-slate-500/20",
    coral: "bg-[#FF6B4A]/10 dark:bg-[#FF6B4A]/20",
  };

  const iconColors: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    violet: "text-violet-600 dark:text-violet-400",
    amber: "text-amber-600 dark:text-amber-400",
    slate: "text-slate-600 dark:text-slate-400",
    coral: "text-[#FF6B4A] dark:text-[#FF9A82]",
  };

  return (
    <div className={cn("rounded-lg p-3", bgColors[color])}>
      <div className={cn("flex items-center gap-2 mb-1", isRtl && "flex-row-reverse")}>
        <Icon className={cn("h-4 w-4", iconColors[color])} />
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className={cn("flex items-baseline gap-2 flex-wrap", isRtl && "flex-row-reverse justify-end")}>
        <span className="font-display text-xl font-bold">
          {isCurrency && (
            <AnimatedCurrency
              value={value}
              currency="SAR"
              locale={locale === "ar" ? "ar-SA" : "en-SA"}
              compact
            />
          )}
          {isPercentage && <AnimatedPercentage value={value} decimals={1} />}
          {!isCurrency && !isPercentage && value.toLocaleString(locale === "ar" ? "ar-SA" : "en-SA")}
        </span>
        {trend !== undefined && (
          <span
            className={cn(
              "flex items-center text-xs",
              trend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        )}
      </div>
      {secondaryValue !== undefined && secondaryLabel && (
        <p className="text-xs text-muted-foreground mt-1">
          <span className="font-medium text-amber-600 dark:text-amber-400">
            {secondaryValue.toLocaleString(locale === "ar" ? "ar-SA" : "en-SA")}
          </span>{" "}
          {secondaryLabel}
        </p>
      )}
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly { value?: number | string; [key: string]: unknown }[];
  label?: string | number;
  locale: string;
}

function CustomTooltip({ active, payload, label, locale }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const value = typeof payload[0].value === "number" ? payload[0].value : 0;
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(value);

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-bold">{formatted}</p>
    </div>
  );
}

function formatCompactNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
}

function PlatformRevenueDashboardSkeleton() {
  return (
    <Card className="dark:border-neutral-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-muted/50 p-3">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[220px] w-full" />
      </CardContent>
    </Card>
  );
}

export { PlatformRevenueDashboardSkeleton };
