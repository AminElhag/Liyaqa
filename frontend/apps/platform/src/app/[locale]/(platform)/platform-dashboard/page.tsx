"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { format } from "date-fns";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import { Label } from "@liyaqa/shared/components/ui/label";
import { useAuthStore, useHasHydrated } from "@liyaqa/shared/stores/auth-store";
import {
  usePlatformDashboard,
  useMonthlyRevenue,
  usePlatformHealth,
  useSupportStats,
} from "@liyaqa/shared/queries/platform/use-platform-dashboard";
import {
  AdminDashboard,
  SalesDashboard,
  SupportDashboard,
} from "@liyaqa/shared/components/platform/role-dashboards";
import { DateRangePicker, type DateRange } from "@liyaqa/shared/components/platform/date-range-picker";
import type { DateRangeParams } from "@liyaqa/shared/lib/api/platform/dashboard";
import type { UserRole } from "@liyaqa/shared/types/auth";

export default function PlatformDashboardPage() {
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const hasHydrated = useHasHydrated();

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

  // GUARD CLAUSE: Show loading while hydrating or if user not ready
  if (!hasHydrated || isAuthLoading || !user || !user.role) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading
          text={locale === "ar" ? "جاري التحميل..." : "Loading..."}
        />
      </div>
    );
  }

  // SAFE: TypeScript now knows user and user.role exist
  // No type assertion needed - user.role is already typed as UserRole
  const userRole: UserRole = user.role;

  // Determine which data to fetch based on role
  const isAdmin = userRole === "PLATFORM_ADMIN";
  const isSalesRep = userRole === "SALES_REP";
  const isSupport = userRole === "SUPPORT";

  // Fetch dashboard data with date range and auto-refresh
  const {
    data: dashboard,
    isLoading: isLoadingDashboard,
    isError: isDashboardError,
    refetch: refetchDashboard,
  } = usePlatformDashboard("Asia/Riyadh", dateRangeParams, {
    refetchInterval: autoRefreshEnabled ? AUTO_REFRESH_INTERVAL : false,
    staleTime: AUTO_REFRESH_INTERVAL,
  });

  // Fetch monthly revenue (PLATFORM_ADMIN only)
  const {
    data: monthlyRevenue,
    isLoading: isLoadingMonthlyRevenue,
    isError: isMonthlyRevenueError,
  } = useMonthlyRevenue(12, {
    enabled: isAdmin,
  });

  // Fetch platform health (PLATFORM_ADMIN and SUPPORT)
  const {
    data: health,
    isLoading: isLoadingHealth,
    isError: isHealthError,
  } = usePlatformHealth({
    enabled: isAdmin || isSupport,
  });

  // Fetch support stats (SUPPORT only)
  const { data: supportStatsData, isLoading: isLoadingSupportStats } = useSupportStats({
    enabled: isSupport,
  });

  // Progressive loading - don't block everything, let components show skeletons
  // Only block if primary dashboard data is loading (shows main content skeleton)
  const isPrimaryLoading = isLoadingDashboard;

  // Secondary loading states passed to child components for their own skeleton handling
  const isSecondaryLoading = {
    monthlyRevenue: isLoadingMonthlyRevenue,
    health: isLoadingHealth,
    supportStats: isLoadingSupportStats,
  };

  // Check for any errors
  const hasError = isDashboardError || (isAdmin && isMonthlyRevenueError) || ((isAdmin || isSupport) && isHealthError);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg text-destructive">
            {locale === "ar" ? "حدث خطأ أثناء تحميل لوحة التحكم" : "Error loading dashboard"}
          </h3>
          <p className="text-muted-foreground mt-1">
            {locale === "ar" ? "يرجى المحاولة مرة أخرى لاحقاً" : "Please try again later"}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetchDashboard()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {locale === "ar" ? "إعادة المحاولة" : "Retry"}
        </Button>
      </div>
    );
  }

  // Only show "no data" if loading is complete but data is still missing
  if (!isPrimaryLoading && !dashboard) {
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

  // Render role-based dashboard with progressive loading
  if (isAdmin) {
    return (
      <>
        {dateRangeSection}
        <AdminDashboard
          summary={dashboard?.summary}
          revenue={dashboard?.revenue}
          health={health}
          monthlyRevenue={monthlyRevenue}
          dealPipeline={dashboard?.dealPipeline}
          topClients={dashboard?.topClients}
          recentActivity={dashboard?.recentActivity}
          isLoading={isPrimaryLoading || isSecondaryLoading.monthlyRevenue || isSecondaryLoading.health}
        />
      </>
    );
  }

  if (isSalesRep) {
    return (
      <>
        {dateRangeSection}
        <SalesDashboard
          summary={dashboard?.summary}
          dealPipeline={dashboard?.dealPipeline}
          topClients={dashboard?.topClients}
          recentActivity={dashboard?.recentActivity}
          isLoading={isPrimaryLoading}
        />
      </>
    );
  }

  if (isSupport) {
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
      : undefined;

    return (
      <>
        {dateRangeSection}
        <SupportDashboard
          supportStats={supportStats}
          health={health}
          recentActivity={dashboard?.recentActivity}
          isLoading={isPrimaryLoading || isSecondaryLoading.health || isSecondaryLoading.supportStats}
        />
      </>
    );
  }

  // Default: Admin view for any other role
  return (
    <>
      {dateRangeSection}
      <AdminDashboard
        summary={dashboard?.summary}
        revenue={dashboard?.revenue}
        health={health}
        monthlyRevenue={monthlyRevenue}
        dealPipeline={dashboard?.dealPipeline}
        topClients={dashboard?.topClients}
        recentActivity={dashboard?.recentActivity}
        isLoading={isPrimaryLoading || isSecondaryLoading.monthlyRevenue || isSecondaryLoading.health}
      />
    </>
  );
}
