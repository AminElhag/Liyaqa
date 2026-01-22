"use client";

import { useLocale } from "next-intl";
import {
  LineChart,
  Line,
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
  Percent,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { PlatformRevenue, MonthlyRevenue } from "@/types/platform";

interface RevenueChartProps {
  revenue: PlatformRevenue;
  monthlyRevenue: MonthlyRevenue[];
}

export function RevenueChart({ revenue, monthlyRevenue }: RevenueChartProps) {
  const locale = useLocale();

  // Format chart data
  const chartData = monthlyRevenue.map((item) => ({
    name: locale === "ar" ? item.monthName : item.monthName.slice(0, 3),
    revenue: item.revenue,
    invoices: item.invoiceCount,
  }));

  // Calculate month-over-month growth
  const revenueChange =
    revenue.revenueLastMonth > 0
      ? ((revenue.revenueThisMonth - revenue.revenueLastMonth) /
          revenue.revenueLastMonth) *
        100
      : 0;

  const isPositiveGrowth = revenueChange >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === "ar" ? "نظرة عامة على الإيرادات" : "Revenue Overview"}
        </CardTitle>
        <CardDescription>
          {locale === "ar"
            ? "الإيرادات الشهرية والمقاييس المالية"
            : "Monthly revenue and financial metrics"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* MRR */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              {locale === "ar" ? "الإيرادات الشهرية المتكررة" : "MRR"}
            </div>
            <div className="text-xl font-bold">
              {formatCurrency(
                revenue.monthlyRecurringRevenue,
                revenue.currency,
                locale
              )}
            </div>
          </div>

          {/* This Month */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {isPositiveGrowth ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              {locale === "ar" ? "هذا الشهر" : "This Month"}
            </div>
            <div className="text-xl font-bold">
              {formatCurrency(
                revenue.revenueThisMonth,
                revenue.currency,
                locale
              )}
            </div>
            <div
              className={`text-xs ${
                isPositiveGrowth ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositiveGrowth ? "+" : ""}
              {revenueChange.toFixed(1)}%{" "}
              {locale === "ar" ? "من الشهر الماضي" : "vs last month"}
            </div>
          </div>

          {/* Collection Rate */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Percent className="h-4 w-4" />
              {locale === "ar" ? "معدل التحصيل" : "Collection Rate"}
            </div>
            <div className="text-xl font-bold">
              {revenue.collectionRate.toFixed(1)}%
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-primary h-1.5 rounded-full"
                style={{ width: `${Math.min(revenue.collectionRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Outstanding */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertCircle className="h-4 w-4 text-warning" />
              {locale === "ar" ? "المبالغ المستحقة" : "Outstanding"}
            </div>
            <div className="text-xl font-bold">
              {formatCurrency(
                revenue.outstandingAmount,
                revenue.currency,
                locale
              )}
            </div>
            {revenue.overdueAmount > 0 && (
              <div className="text-xs text-destructive">
                {formatCurrency(revenue.overdueAmount, revenue.currency, locale)}{" "}
                {locale === "ar" ? "متأخرة" : "overdue"}
              </div>
            )}
          </div>
        </div>

        {/* Revenue Chart */}
        {chartData.length > 0 && (
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `${(value / 1000).toFixed(0)}K`
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value) || 0, revenue.currency, locale),
                    locale === "ar" ? "الإيرادات" : "Revenue",
                  ]}
                  labelStyle={{ color: "var(--foreground)" }}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
