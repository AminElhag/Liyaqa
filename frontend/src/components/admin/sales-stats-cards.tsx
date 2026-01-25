"use client";

import { useLocale } from "next-intl";
import {
  Users,
  UserCheck,
  UserPlus,
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineStats, ActivityStats } from "@/types/lead";
import { cn } from "@/lib/utils";

interface SalesStatsCardsProps {
  pipelineStats?: PipelineStats;
  activityStats?: ActivityStats;
}

export function SalesStatsCards({ pipelineStats, activityStats }: SalesStatsCardsProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const stats = [
    {
      title: isArabic ? "إجمالي العملاء" : "Total Leads",
      value: pipelineStats?.total ?? 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: isArabic ? "عملاء نشطون" : "Active Leads",
      value: pipelineStats?.active ?? 0,
      icon: UserPlus,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: isArabic ? "معدل التحويل" : "Conversion Rate",
      value: `${((pipelineStats?.conversionRate ?? 0) * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: isArabic ? "مكتسب" : "Won",
      value: pipelineStats?.byStatus?.WON ?? 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: isArabic ? "متابعات معلقة" : "Pending Follow-ups",
      value: activityStats?.pendingFollowUps ?? 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: isArabic ? "متابعات متأخرة" : "Overdue Follow-ups",
      value: activityStats?.overdueFollowUps ?? 0,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={cn("p-2 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
