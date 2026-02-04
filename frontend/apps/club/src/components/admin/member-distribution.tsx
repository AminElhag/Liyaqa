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

interface MemberStatusData {
  status: string;
  count: number;
}

interface MemberDistributionChartProps {
  data: MemberStatusData[];
  locale: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#22c55e",
  EXPIRED: "#6b7280",
  FROZEN: "#3b82f6",
  CANCELLED: "#ef4444",
  PENDING: "#f59e0b",
  SUSPENDED: "#f97316",
};

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  ACTIVE: { en: "Active", ar: "نشط" },
  EXPIRED: { en: "Expired", ar: "منتهي" },
  FROZEN: { en: "Frozen", ar: "مجمد" },
  CANCELLED: { en: "Cancelled", ar: "ملغي" },
  PENDING: { en: "Pending", ar: "معلق" },
  SUSPENDED: { en: "Suspended", ar: "موقوف" },
};

const DEFAULT_COLOR = "#9ca3af";

export function MemberDistributionChart({ data, locale }: MemberDistributionChartProps) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    return data.map((item) => ({
      name: STATUS_LABELS[item.status]?.[locale === "ar" ? "ar" : "en"] || item.status,
      value: item.count,
      status: item.status,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : "0",
      fill: STATUS_COLORS[item.status] || DEFAULT_COLOR,
    }));
  }, [data, locale]);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        name: string;
        value: number;
        percentage: string;
      };
    }>;
  }) => {
    if (!active || !payload || !payload.length) return null;

    const item = payload[0].payload;

    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-neutral-900">{item.name}</p>
        <p className="text-lg font-bold text-primary">{item.value}</p>
        <p className="text-sm text-neutral-500">
          {item.percentage}% {locale === "ar" ? "من الإجمالي" : "of total"}
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
