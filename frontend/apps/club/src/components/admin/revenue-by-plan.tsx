"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { UUID } from "@liyaqa/shared/types/api";

interface RevenueByPlanData {
  planId: UUID;
  planName: string;
  revenue: number;
  subscriptionCount: number;
}

interface RevenueByPlanChartProps {
  data: RevenueByPlanData[];
  locale: string;
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function RevenueByPlanChart({ data, locale }: RevenueByPlanChartProps) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.revenue, 0);
    return data.map((item, index) => ({
      name: item.planName,
      value: Number(item.revenue),
      subscriptions: item.subscriptionCount,
      percentage: total > 0 ? ((item.revenue / total) * 100).toFixed(1) : "0",
      fill: COLORS[index % COLORS.length],
    }));
  }, [data]);

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
  }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        name: string;
        value: number;
        subscriptions: number;
        percentage: string;
      };
    }>;
  }) => {
    if (!active || !payload || !payload.length) return null;

    const item = payload[0].payload;

    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-neutral-900">{item.name}</p>
        <p className="text-success font-bold">{formatCurrency(item.value)}</p>
        <p className="text-sm text-neutral-500">
          {item.percentage}% {locale === "ar" ? "من الإجمالي" : "of total"}
        </p>
        <p className="text-sm text-neutral-500">
          {item.subscriptions} {locale === "ar" ? "اشتراك" : "subscriptions"}
        </p>
      </div>
    );
  };

  const CustomLegend = ({
    payload,
  }: {
    payload?: Array<{
      value: string;
      color: string;
    }>;
  }) => {
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-neutral-600">{entry.value}</span>
          </div>
        ))}
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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ payload }) => {
              const item = payload as { percentage?: string };
              return item.percentage ? `${item.percentage}%` : "";
            }}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
