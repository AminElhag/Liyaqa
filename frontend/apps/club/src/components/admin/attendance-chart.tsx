"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AttendanceByPeriod } from "@liyaqa/shared/types/report";

interface AttendanceChartProps {
  data: AttendanceByPeriod[];
  locale: string;
}

export function AttendanceChart({ data, locale }: AttendanceChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        period: item.period,
        checkIns: item.checkIns,
        uniqueMembers: item.uniqueMembers,
      })),
    [data]
  );

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-neutral-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey === "checkIns"
              ? locale === "ar"
                ? "الزيارات:"
                : "Check-ins:"
              : locale === "ar"
                ? "أعضاء فريدون:"
                : "Unique members:"}
            <span className="font-bold ms-1">{entry.value}</span>
          </p>
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
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="checkIns"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name={locale === "ar" ? "الزيارات" : "Check-ins"}
          />
          <Bar
            dataKey="uniqueMembers"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            name={locale === "ar" ? "أعضاء فريدون" : "Unique Members"}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
