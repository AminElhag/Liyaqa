"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MemberGrowthByPeriod } from "@/types/report";

interface MemberGrowthChartProps {
  data: MemberGrowthByPeriod[];
  locale: string;
}

export function MemberGrowthChart({ data, locale }: MemberGrowthChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        period: item.period,
        total: item.totalMembers,
        new: item.newMembers,
        churned: item.churnedMembers,
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

    const labels = {
      total: locale === "ar" ? "الإجمالي" : "Total",
      new: locale === "ar" ? "جدد" : "New",
      churned: locale === "ar" ? "مغادرون" : "Churned",
    };

    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-neutral-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {labels[entry.dataKey as keyof typeof labels]}:
            <span className="font-bold ms-1">
              {entry.dataKey === "churned" ? `-${entry.value}` : entry.value}
            </span>
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
        <LineChart
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
          <Legend
            formatter={(value) => {
              const labels = {
                total: locale === "ar" ? "الإجمالي" : "Total",
                new: locale === "ar" ? "جدد" : "New",
                churned: locale === "ar" ? "مغادرون" : "Churned",
              };
              return labels[value as keyof typeof labels] || value;
            }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="new"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="churned"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
