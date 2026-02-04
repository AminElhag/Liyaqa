"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { RefreshCw, List, LayoutGrid, TrendingUp } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { SalesStatsCards } from "@/components/admin/sales-stats-cards";
import { ConversionFunnelChart } from "@/components/admin/conversion-funnel-chart";
import { LeadSourceChart } from "@/components/admin/lead-source-chart";
import {
  usePipelineStats,
  useSourceStats,
  useActivityStats,
  useOverdueFollowUps,
  useLeads,
} from "@liyaqa/shared/queries/use-leads";
import { LEAD_ACTIVITY_TYPE_LABELS } from "@liyaqa/shared/types/lead";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export default function LeadsDashboardPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const {
    data: pipelineStats,
    isLoading: pipelineLoading,
    refetch: refetchPipeline,
  } = usePipelineStats();
  const { data: sourceStats, isLoading: sourceLoading } = useSourceStats();
  const { data: activityStats, isLoading: activityLoading } = useActivityStats();
  const { data: overdueFollowUps } = useOverdueFollowUps({ size: 5 });
  const { data: recentLeads } = useLeads({ size: 5, sortBy: "createdAt", sortDir: "desc" });

  const isLoading = pipelineLoading || sourceLoading || activityLoading;

  const handleRefresh = () => {
    refetchPipeline();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "لوحة المبيعات" : "Sales Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "نظرة عامة على أداء المبيعات والعملاء المحتملين"
              : "Overview of sales performance and leads"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/leads`}>
            <Button variant="outline" size="icon" title={isArabic ? "عرض الجدول" : "Table View"}>
              <List className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/leads/pipeline`}>
            <Button variant="outline" size="icon" title={isArabic ? "عرض كانبان" : "Kanban View"}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <SalesStatsCards pipelineStats={pipelineStats} activityStats={activityStats} />
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-[300px]" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-[300px]" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <ConversionFunnelChart stats={pipelineStats} />
            <LeadSourceChart stats={sourceStats} />
          </>
        )}
      </div>

      {/* Activity Stats & Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {isArabic ? "نشاط المبيعات" : "Sales Activity"}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? "إجمالي الأنشطة حسب النوع"
                : "Total activities by type"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activityStats?.byType ? (
              <div className="space-y-3">
                {Object.entries(activityStats.byType)
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">
                        {isArabic
                          ? LEAD_ACTIVITY_TYPE_LABELS[type as keyof typeof LEAD_ACTIVITY_TYPE_LABELS]?.ar
                          : LEAD_ACTIVITY_TYPE_LABELS[type as keyof typeof LEAD_ACTIVITY_TYPE_LABELS]?.en}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isArabic ? "لا توجد أنشطة" : "No activities yet"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Follow-ups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">
              {isArabic ? "متابعات متأخرة" : "Overdue Follow-ups"}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? "متابعات تحتاج اهتمام فوري"
                : "Follow-ups that need immediate attention"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overdueFollowUps?.content && overdueFollowUps.content.length > 0 ? (
              <div className="space-y-3">
                {overdueFollowUps.content.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/${locale}/leads/${activity.leadId}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {isArabic
                          ? LEAD_ACTIVITY_TYPE_LABELS[activity.type]?.ar
                          : LEAD_ACTIVITY_TYPE_LABELS[activity.type]?.en}
                      </span>
                      <span className="text-xs text-red-600">
                        {activity.followUpDate &&
                          formatDistanceToNow(new Date(activity.followUpDate), {
                            addSuffix: true,
                            locale: isArabic ? ar : enUS,
                          })}
                      </span>
                    </div>
                    {activity.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {activity.notes}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isArabic ? "لا توجد متابعات متأخرة" : "No overdue follow-ups"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "أحدث العملاء المحتملين" : "Recent Leads"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "آخر العملاء المحتملين المضافين"
              : "Latest leads added to the system"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentLeads?.content && recentLeads.content.length > 0 ? (
            <div className="space-y-3">
              {recentLeads.content.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/${locale}/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="font-medium">{lead.name}</span>
                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                  </div>
                  <div className="text-end">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lead.createdAt), {
                        addSuffix: true,
                        locale: isArabic ? ar : enUS,
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isArabic ? "لا توجد عملاء محتملين" : "No leads yet"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
