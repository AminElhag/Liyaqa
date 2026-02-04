"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import type { SourceStats, LeadSource } from "@liyaqa/shared/types/lead";
import { LEAD_SOURCE_LABELS } from "@liyaqa/shared/types/lead";

interface LeadSourceChartProps {
  stats?: SourceStats;
}

const SOURCE_COLORS: Record<LeadSource, string> = {
  REFERRAL: "#22c55e",
  WALK_IN: "#3b82f6",
  SOCIAL_MEDIA: "#ec4899",
  PAID_ADS: "#f97316",
  WEBSITE: "#6366f1",
  PHONE_CALL: "#14b8a6",
  EMAIL: "#8b5cf6",
  PARTNER: "#eab308",
  EVENT: "#06b6d4",
  OTHER: "#64748b",
};

export function LeadSourceChart({ stats }: LeadSourceChartProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const chartData = useMemo(() => {
    if (!stats?.bySource) return [];

    return Object.entries(stats.bySource)
      .filter(([, count]) => count > 0)
      .map(([source, count]) => ({
        source: source as LeadSource,
        label: isArabic
          ? LEAD_SOURCE_LABELS[source as LeadSource].ar
          : LEAD_SOURCE_LABELS[source as LeadSource].en,
        count,
        color: SOURCE_COLORS[source as LeadSource],
      }))
      .sort((a, b) => b.count - a.count);
  }, [stats, isArabic]);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: { label: string; count: number } }>;
  }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const percentage = stats?.total
      ? ((data.count / stats.total) * 100).toFixed(1)
      : 0;

    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-neutral-900">{data.label}</p>
        <p className="text-lg font-bold">{data.count}</p>
        <p className="text-sm text-neutral-500">{percentage}%</p>
      </div>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <ul className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: { value: string; color: string }, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-1.5 text-sm">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "مصادر العملاء" : "Lead Sources"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {isArabic ? "لا توجد بيانات" : "No data available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isArabic ? "مصادر العملاء" : "Lead Sources"}</CardTitle>
        <CardDescription>
          {isArabic
            ? "توزيع العملاء المحتملين حسب المصدر"
            : "Lead distribution by acquisition source"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                nameKey="label"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
