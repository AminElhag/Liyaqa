"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { Loading } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import {
  usePlatformDashboard,
  useMonthlyRevenue,
  usePlatformHealth,
  useSupportStats,
} from "@/queries/platform/use-platform-dashboard";
import {
  AdminDashboard,
  SalesDashboard,
  SupportDashboard,
} from "@/components/platform/role-dashboards";
import { DateRangePicker, type DateRange } from "@/components/platform/date-range-picker";
import type { DateRangeParams } from "@/lib/api/platform/dashboard";
import type { UserRole } from "@/types/auth";

export default function PlatformDashboardPage() {
  const locale = useLocale();
  const { user } = useAuthStore();
  const userRole = user?.role as UserRole;

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Auto-refresh state (default: enabled, every 5 minutes)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Convert DateRange to DateRangeParams (ISO format strings)
  const dateRangeParams: DateRangeParams | undefined = dateRange
    ? {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      }
    : undefined;

  // Determine which data to fetch based on role
  const isAdmin = userRole === "PLATFORM_ADMIN";
  const isSalesRep = userRole === "SALES_REP";
  const isSupport = userRole === "SUPPORT";

  // Fetch dashboard data with date range and auto-refresh
  const {
    data: dashboard,
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard,
  } = usePlatformDashboard("Asia/Riyadh", dateRangeParams, {
    refetchInterval: autoRefreshEnabled ? AUTO_REFRESH_INTERVAL : false,
    staleTime: AUTO_REFRESH_INTERVAL,
  });

  // Fetch monthly revenue (PLATFORM_ADMIN only)
  const { data: monthlyRevenue, isLoading: isLoadingMonthlyRevenue } = useMonthlyRevenue(12, {
    enabled: isAdmin,
  });

  // Fetch platform health (PLATFORM_ADMIN and SUPPORT)
  const { data: health, isLoading: isLoadingHealth } = usePlatformHealth({
    enabled: isAdmin || isSupport,
  });

  const isLoading =
    isLoadingDashboard ||
    (isAdmin && isLoadingMonthlyRevenue) ||
    ((isAdmin || isSupport) && isLoadingHealth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading
          text={locale === "ar" ? "جاري تحميل لوحة التحكم..." : "Loading dashboard..."}
        />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          {locale === "ar" ? "لا توجد بيانات متاحة" : "No data available"}
        </p>
      </div>
    );
  }

  // Texts for auto-refresh controls
  const refreshTexts = {
    refresh: locale === "ar" ? "تحديث" : "Refresh",
    autoRefresh: locale === "ar" ? "تحديث تلقائي (كل 5 دقائق)" : "Auto-refresh (every 5 min)",
    refreshing: locale === "ar" ? "جاري التحديث..." : "Refreshing...",
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    refetchDashboard();
  };

  // Render date range picker and refresh controls (above dashboard content)
  const dateRangeSection = (
    <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
      <DateRangePicker value={dateRange} onChange={setDateRange} />

      <div className="flex items-center gap-4">
        {/* Auto-refresh toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="auto-refresh"
            checked={autoRefreshEnabled}
            onCheckedChange={setAutoRefreshEnabled}
          />
          <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
            {refreshTexts.autoRefresh}
          </Label>
        </div>

        {/* Manual refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isLoadingDashboard}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingDashboard ? "animate-spin" : ""}`} />
          {isLoadingDashboard ? refreshTexts.refreshing : refreshTexts.refresh}
        </Button>
      </div>
    </div>
  );

  // Render role-based dashboard
  if (isAdmin) {
    return (
      <>
        {dateRangeSection}
        <AdminDashboard
          summary={dashboard.summary}
          revenue={dashboard.revenue}
          health={health}
          monthlyRevenue={monthlyRevenue}
          dealPipeline={dashboard.dealPipeline}
          topClients={dashboard.topClients}
          recentActivity={dashboard.recentActivity}
          isLoading={isLoading}
        />
      </>
    );
  }

  if (isSalesRep) {
    return (
      <>
        {dateRangeSection}
        <SalesDashboard
          summary={dashboard.summary}
          dealPipeline={dashboard.dealPipeline}
          topClients={dashboard.topClients}
          recentActivity={dashboard.recentActivity}
          isLoading={isLoading}
        />
      </>
    );
  }

  if (isSupport) {
    // Fetch support stats using the real API
    const { data: supportStatsData, isLoading: isLoadingSupportStats } = useSupportStats({
      enabled: isSupport,
    });

    // Transform API response to match SupportDashboard component expectations
    const supportStats = supportStatsData
      ? {
          openTickets: supportStatsData.openTickets,
          inProgressTickets: supportStatsData.inProgressTickets,
          resolvedToday: supportStatsData.resolvedTickets, // Using resolvedTickets as resolvedToday
          avgResponseTime: supportStatsData.averageResponseTime,
          pendingResponse: supportStatsData.waitingOnClientTickets,
          escalated: 0, // Not available in current API, using 0 as placeholder
        }
      : {
          openTickets: 0,
          inProgressTickets: 0,
          resolvedToday: 0,
          avgResponseTime: 0,
          pendingResponse: 0,
          escalated: 0,
        };

    return (
      <>
        {dateRangeSection}
        <SupportDashboard
          supportStats={supportStats}
          health={health}
          recentActivity={dashboard.recentActivity}
          isLoading={isLoading || isLoadingSupportStats}
        />
      </>
    );
  }

  // Default: Admin view for any other role
  return (
    <>
      {dateRangeSection}
      <AdminDashboard
        summary={dashboard.summary}
        revenue={dashboard.revenue}
        health={health}
        monthlyRevenue={monthlyRevenue}
        dealPipeline={dashboard.dealPipeline}
        topClients={dashboard.topClients}
        recentActivity={dashboard.recentActivity}
        isLoading={isLoading}
      />
    </>
  );
}
