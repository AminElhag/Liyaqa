"use client";

import { useLocale } from "next-intl";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Mail, MessageSquare, MessageCircle, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { cn } from "@liyaqa/shared/utils";
import type { CampaignStep, MarketingChannel } from "@liyaqa/shared/types/marketing";

const CHANNEL_CONFIG: Record<MarketingChannel, { icon: React.ComponentType<{ className?: string }>; color: string; label: { en: string; ar: string } }> = {
  EMAIL: {
    icon: Mail,
    color: "#6366f1",
    label: { en: "Email", ar: "البريد الإلكتروني" },
  },
  SMS: {
    icon: MessageSquare,
    color: "#22c55e",
    label: { en: "SMS", ar: "رسالة نصية" },
  },
  WHATSAPP: {
    icon: MessageCircle,
    color: "#25d366",
    label: { en: "WhatsApp", ar: "واتساب" },
  },
  PUSH: {
    icon: Bell,
    color: "#f59e0b",
    label: { en: "Push", ar: "إشعار" },
  },
};

interface CampaignChannelBreakdownProps {
  steps: CampaignStep[];
  isLoading?: boolean;
  className?: string;
}

export function CampaignChannelBreakdown({
  steps,
  isLoading,
  className,
}: CampaignChannelBreakdownProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Count steps by channel
  const channelCounts = steps.reduce<Record<string, number>>((acc, step) => {
    acc[step.channel] = (acc[step.channel] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(channelCounts).map(([channel, count]) => ({
    channel: channel as MarketingChannel,
    name: isArabic
      ? CHANNEL_CONFIG[channel as MarketingChannel]?.label.ar || channel
      : CHANNEL_CONFIG[channel as MarketingChannel]?.label.en || channel,
    value: count,
    color: CHANNEL_CONFIG[channel as MarketingChannel]?.color || "#6b7280",
  }));

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{isArabic ? "توزيع القنوات" : "Channel Breakdown"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {isArabic ? "لا توجد خطوات بعد" : "No steps configured"}
          </p>
        </CardContent>
      </Card>
    );
  }

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{ payload: typeof chartData[0] }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} {isArabic ? "خطوة" : "step(s)"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{isArabic ? "توزيع القنوات" : "Channel Breakdown"}</CardTitle>
        <CardDescription>
          {isArabic
            ? `${steps.length} خطوة في هذه الحملة`
            : `${steps.length} step(s) in this campaign`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Pie Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {chartData.map((item) => {
              const config = CHANNEL_CONFIG[item.channel];
              const Icon = config?.icon;
              return (
                <div key={item.channel} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground ms-auto">
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
