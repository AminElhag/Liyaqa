"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import type { PipelineStats, LeadStatus } from "@liyaqa/shared/types/lead";
import { LEAD_STATUS_LABELS } from "@liyaqa/shared/types/lead";

interface ConversionFunnelChartProps {
  stats?: PipelineStats;
}

const FUNNEL_COLORS: Record<LeadStatus, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#8b5cf6",
  TOUR_SCHEDULED: "#eab308",
  TRIAL: "#f97316",
  NEGOTIATION: "#6366f1",
  WON: "#22c55e",
  LOST: "#ef4444",
};

const FUNNEL_ORDER: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "TOUR_SCHEDULED",
  "TRIAL",
  "NEGOTIATION",
  "WON",
];

export function ConversionFunnelChart({ stats }: ConversionFunnelChartProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const chartData = useMemo(() => {
    if (!stats?.byStatus) return [];

    return FUNNEL_ORDER.map((status) => ({
      status,
      label: isArabic
        ? LEAD_STATUS_LABELS[status].ar
        : LEAD_STATUS_LABELS[status].en,
      count: stats.byStatus[status] || 0,
      color: FUNNEL_COLORS[status],
    }));
  }, [stats, isArabic]);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: { label: string } }>;
  }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-neutral-900">{payload[0].payload.label}</p>
        <p className="text-lg font-bold">{payload[0].value}</p>
        <p className="text-sm text-neutral-500">
          {isArabic ? "عملاء محتملين" : "leads"}
        </p>
      </div>
    );
  };

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "قمع التحويل" : "Conversion Funnel"}</CardTitle>
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
        <CardTitle>{isArabic ? "قمع التحويل" : "Conversion Funnel"}</CardTitle>
        <CardDescription>
          {isArabic
            ? "توزيع العملاء المحتملين عبر مراحل البيع"
            : "Lead distribution across sales stages"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="label"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
