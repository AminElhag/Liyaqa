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
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { TimelineDataPoint } from "@liyaqa/shared/types/marketing";

interface CampaignTimelineChartProps {
  data: TimelineDataPoint[];
  isLoading?: boolean;
  days?: number;
  className?: string;
}

export function CampaignTimelineChart({
  data,
  isLoading,
  days = 7,
  className,
}: CampaignTimelineChartProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((point) => ({
    ...point,
    date: format(parseISO(point.date), "MMM dd", { locale: dateLocale }),
    fullDate: format(parseISO(point.date), "PPP", { locale: dateLocale }),
  }));

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const dataPoint = formattedData.find((p) => p.date === label);
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[150px]">
          <p className="font-medium mb-2">{dataPoint?.fullDate || label}</p>
          {payload.map((item, index) => (
            <div key={index} className="flex justify-between items-center gap-4 text-sm">
              <span style={{ color: item.color }}>{item.name}</span>
              <span className="font-medium">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const lineConfig = [
    {
      dataKey: "sent",
      name: isArabic ? "مرسل" : "Sent",
      color: "#6366f1",
    },
    {
      dataKey: "delivered",
      name: isArabic ? "تم التوصيل" : "Delivered",
      color: "#22c55e",
    },
    {
      dataKey: "opened",
      name: isArabic ? "مفتوح" : "Opened",
      color: "#f59e0b",
    },
    {
      dataKey: "clicked",
      name: isArabic ? "نقرات" : "Clicked",
      color: "#3b82f6",
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{isArabic ? "الجدول الزمني" : "Activity Timeline"}</CardTitle>
        <CardDescription>
          {isArabic
            ? `أداء الحملة خلال آخر ${days} أيام`
            : `Campaign performance over the last ${days} days`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {isArabic ? "لا توجد بيانات للفترة المحددة" : "No data for the selected period"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
              />
              {lineConfig.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
