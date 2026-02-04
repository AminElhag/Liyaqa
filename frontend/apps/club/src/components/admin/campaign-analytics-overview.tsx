"use client";

import { useLocale } from "next-intl";
import {
  Users,
  CheckCircle2,
  Mail,
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { cn } from "@liyaqa/shared/utils";
import type { CampaignAnalytics } from "@liyaqa/shared/types/marketing";

interface CampaignAnalyticsOverviewProps {
  analytics: CampaignAnalytics | null;
  isLoading?: boolean;
  className?: string;
}

export function CampaignAnalyticsOverview({
  analytics,
  isLoading,
  className,
}: CampaignAnalyticsOverviewProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  if (isLoading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        {isArabic ? "لا توجد بيانات" : "No data available"}
      </div>
    );
  }

  const stats = [
    {
      title: isArabic ? "المسجلين" : "Enrolled",
      value: analytics.totalEnrolled,
      description: isArabic
        ? `${analytics.activeEnrollments} نشط`
        : `${analytics.activeEnrollments} active`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: isArabic ? "مكتمل" : "Completed",
      value: analytics.completedEnrollments,
      description: `${analytics.completionRate.toFixed(1)}% ${isArabic ? "معدل الإكمال" : "completion rate"}`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: isArabic ? "الرسائل المرسلة" : "Messages Sent",
      value: analytics.sentMessages,
      description: `${analytics.failedMessages} ${isArabic ? "فشل" : "failed"}`,
      icon: Send,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: isArabic ? "تم التوصيل" : "Delivered",
      value: analytics.deliveredMessages,
      description: `${analytics.deliveryRate.toFixed(1)}% ${isArabic ? "معدل التوصيل" : "delivery rate"}`,
      icon: Mail,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-full", stat.bgColor)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Engagement Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Open Rate Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-600" />
                {isArabic ? "معدل الفتح" : "Open Rate"}
              </CardTitle>
              <span className="text-2xl font-bold">{analytics.openRate.toFixed(1)}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={analytics.openRate} className="h-3 mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {analytics.openedMessages.toLocaleString()} {isArabic ? "مفتوح" : "opened"}
              </span>
              <span>
                {isArabic ? "من" : "of"} {analytics.deliveredMessages.toLocaleString()} {isArabic ? "تم توصيلها" : "delivered"}
              </span>
            </div>
            {analytics.openRate > 20 ? (
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                {isArabic ? "أداء جيد" : "Good performance"}
              </div>
            ) : analytics.openRate < 10 ? (
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {isArabic ? "يمكن تحسينه" : "Could be improved"}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Click Rate Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-blue-600" />
                {isArabic ? "معدل النقر" : "Click Rate"}
              </CardTitle>
              <span className="text-2xl font-bold">{analytics.clickRate.toFixed(1)}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={analytics.clickRate} className="h-3 mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {analytics.clickedMessages.toLocaleString()} {isArabic ? "نقرات" : "clicks"}
              </span>
              <span>
                {isArabic ? "من" : "of"} {analytics.openedMessages.toLocaleString()} {isArabic ? "مفتوح" : "opened"}
              </span>
            </div>
            {analytics.clickRate > 5 ? (
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                {isArabic ? "تفاعل ممتاز" : "Excellent engagement"}
              </div>
            ) : analytics.clickRate < 2 ? (
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {isArabic ? "حاول تحسين الدعوة للإجراء" : "Try improving call-to-action"}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
