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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Percent,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnimatedNumber, AnimatedCurrency } from "@/components/ui/animated-number";
import type { RevenueReport } from "@/types/report";

interface RevenueOverviewProps {
  data: RevenueReport | undefined;
  isLoading?: boolean;
}

type GroupBy = "day" | "week" | "month";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function RevenueOverview({ data, isLoading }: RevenueOverviewProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [groupBy, setGroupBy] = useState<GroupBy>("day");

  const texts = {
    title: locale === "ar" ? "نظرة عامة على الإيرادات" : "Revenue Overview",
    thisMonth: locale === "ar" ? "هذا الشهر" : "This Month",
    totalRevenue: locale === "ar" ? "إجمالي الإيرادات" : "Total Revenue",
    pending: locale === "ar" ? "في الانتظار" : "Pending",
    overdue: locale === "ar" ? "متأخرة" : "Overdue",
    collectionRate: locale === "ar" ? "معدل التحصيل" : "Collection Rate",
    day: locale === "ar" ? "يومي" : "Day",
    week: locale === "ar" ? "أسبوعي" : "Week",
    month: locale === "ar" ? "شهري" : "Month",
  };

  if (isLoading) {
    return <RevenueOverviewSkeleton />;
  }

  // Calculate collection rate
  const totalRevenue = data?.summary.totalRevenue.amount || 0;
  const pendingRevenue = data?.summary.pendingRevenue.amount || 0;
  const overdueRevenue = data?.summary.overdueRevenue.amount || 0;
  const collectionRate = totalRevenue > 0
    ? ((totalRevenue - pendingRevenue - overdueRevenue) / totalRevenue) * 100
    : 100;

  // Format chart data
  const chartData = data?.byPeriod.map((item) => ({
    period: formatPeriodLabel(item.period, locale),
    revenue: item.revenue,
    invoices: item.invoiceCount,
  })) || [];

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card className="overflow-hidden">
        <CardHeader className={cn("pb-4", isRtl && "text-right")}>
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <CardTitle className="text-lg font-semibold">{texts.title}</CardTitle>
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {(["day", "week", "month"] as GroupBy[]).map((period) => (
                <Button
                  key={period}
                  variant={groupBy === period ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setGroupBy(period)}
                  className="h-7 px-3 text-xs"
                >
                  {texts[period]}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox
              icon={DollarSign}
              label={texts.totalRevenue}
              value={totalRevenue}
              isCurrency
              trend={8.2}
              locale={locale}
              isRtl={isRtl}
              color="primary"
            />
            <StatBox
              icon={Receipt}
              label={texts.pending}
              value={pendingRevenue}
              isCurrency
              count={data?.summary.pendingInvoices}
              locale={locale}
              isRtl={isRtl}
              color="warning"
            />
            <StatBox
              icon={Clock}
              label={texts.overdue}
              value={overdueRevenue}
              isCurrency
              count={data?.summary.overdueInvoices}
              locale={locale}
              isRtl={isRtl}
              color="danger"
            />
            <StatBox
              icon={Percent}
              label={texts.collectionRate}
              value={collectionRate}
              isPercentage
              locale={locale}
              isRtl={isRtl}
              color="success"
            />
          </div>

          {/* Chart */}
          <div className="h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: isRtl ? 30 : 10, left: isRtl ? 10 : 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  reversed={isRtl}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCompactNumber(value, locale)}
                  orientation={isRtl ? "right" : "left"}
                />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <CustomTooltip
                      active={active}
                      payload={payload}
                      label={label}
                      locale={locale}
                    />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatBoxProps {
  icon: React.ElementType;
  label: string;
  value: number;
  isCurrency?: boolean;
  isPercentage?: boolean;
  trend?: number;
  count?: number;
  locale: string;
  isRtl: boolean;
  color: "primary" | "success" | "warning" | "danger";
}

function StatBox({
  icon: Icon,
  label,
  value,
  isCurrency,
  isPercentage,
  trend,
  count,
  locale,
  isRtl,
  color,
}: StatBoxProps) {
  const bgColors: Record<string, string> = {
    primary: "bg-sky-500/10",
    success: "bg-green-500/10",
    warning: "bg-amber-500/10",
    danger: "bg-red-500/10",
  };

  const iconColors: Record<string, string> = {
    primary: "text-sky-600",
    success: "text-green-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };

  return (
    <div className={cn("rounded-lg p-3", bgColors[color])}>
      <div className={cn("flex items-center gap-2 mb-1", isRtl && "flex-row-reverse")}>
        <Icon className={cn("h-4 w-4", iconColors[color])} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={cn("flex items-baseline gap-2", isRtl && "flex-row-reverse justify-end")}>
        <span className="font-display text-xl font-bold">
          {isCurrency && (
            <AnimatedCurrency
              value={value}
              currency="SAR"
              locale={locale === "ar" ? "ar-SA" : "en-SA"}
            />
          )}
          {isPercentage && (
            <>
              <AnimatedNumber value={value} decimals={1} locale={locale} />
              <span className="text-sm">%</span>
            </>
          )}
          {!isCurrency && !isPercentage && (
            <AnimatedNumber value={value} locale={locale} />
          )}
        </span>
        {trend !== undefined && (
          <span className={cn(
            "flex items-center text-xs",
            trend > 0 ? "text-green-600" : "text-red-600"
          )}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
        {count !== undefined && (
          <span className="text-xs text-muted-foreground">
            ({count})
          </span>
        )}
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly { value?: number | string; name?: string; [key: string]: unknown }[];
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

function formatPeriodLabel(period: string, locale: string): string {
  try {
    const date = new Date(period);
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return period;
  }
}

function formatCompactNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
}

function RevenueOverviewSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-muted/50 p-3">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  );
}

export { RevenueOverviewSkeleton };
