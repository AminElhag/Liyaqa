"use client";

import { useLocale } from "next-intl";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useSourceStats } from "@liyaqa/shared/queries/use-leads";
import { LEAD_SOURCE_LABELS, type LeadSource } from "@liyaqa/shared/types/lead";

const SOURCE_COLORS: Record<LeadSource, string> = {
  REFERRAL: "#22c55e",
  WALK_IN: "#3b82f6",
  SOCIAL_MEDIA: "#8b5cf6",
  PAID_ADS: "#f59e0b",
  WEBSITE: "#06b6d4",
  PHONE_CALL: "#ef4444",
  EMAIL: "#ec4899",
  PARTNER: "#14b8a6",
  EVENT: "#f97316",
  OTHER: "#6b7280",
};

interface LeadSourceBreakdownProps {
  className?: string;
}

export function LeadSourceBreakdown({ className }: LeadSourceBreakdownProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { data: stats, isLoading } = useSourceStats();

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

  if (!stats || !stats.bySource) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{isArabic ? "توزيع المصادر" : "Source Distribution"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {isArabic ? "لا توجد بيانات" : "No data available"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(stats.bySource)
    .filter(([, count]) => count > 0)
    .map(([source, count]) => ({
      source: source as LeadSource,
      name: isArabic
        ? LEAD_SOURCE_LABELS[source as LeadSource].ar
        : LEAD_SOURCE_LABELS[source as LeadSource].en,
      value: count,
      percentage: stats.total > 0 ? Math.round((count / stats.total) * 100) : 0,
      fill: SOURCE_COLORS[source as LeadSource],
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {isArabic ? "العدد: " : "Count: "}{data.value}
          </p>
          <p className="text-sm text-muted-foreground">
            {isArabic ? "النسبة: " : "Percentage: "}{data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{isArabic ? "توزيع المصادر" : "Source Distribution"}</CardTitle>
        <CardDescription>
          {isArabic
            ? `إجمالي ${stats.total} عميل محتمل`
            : `Total ${stats.total} leads`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie">
          <TabsList className="mb-4">
            <TabsTrigger value="pie">
              {isArabic ? "دائري" : "Pie"}
            </TabsTrigger>
            <TabsTrigger value="bar">
              {isArabic ? "شريطي" : "Bar"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pie">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, payload }) => `${name} (${(payload as { percentage: number })?.percentage ?? 0}%)`}
                  labelLine={false}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.source} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="bar">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.source} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {chartData.slice(0, 6).map((item) => (
            <div key={item.source} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-sm truncate">{item.name}</span>
              <span className="text-sm text-muted-foreground ms-auto">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
