"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenueByPeriod } from "@liyaqa/shared/types/report";

interface RevenueChartProps {
  data: RevenueByPeriod[];
  locale: string;
}

export function RevenueChart({ data, locale }: RevenueChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        period: item.period,
        revenue: Number(item.revenue),
        invoices: item.invoiceCount,
      })),
    [data]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: { invoices: number } }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-neutral-900">{label}</p>
        <p className="text-success font-bold">
          {formatCurrency(payload[0].value)}
        </p>
        <p className="text-sm text-neutral-500">
          {payload[0].payload.invoices}{" "}
          {locale === "ar" ? "فاتورة" : "invoices"}
        </p>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-neutral-500">
        {locale === "ar" ? "لا توجد بيانات" : "No data available"}
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            tickFormatter={(value) =>
              new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
                notation: "compact",
                compactDisplay: "short",
              }).format(value)
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
