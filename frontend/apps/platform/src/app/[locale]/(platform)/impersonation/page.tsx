"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  UserCheck,
  Shield,
  Clock,
  XCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { cn } from "@liyaqa/shared/utils";
import {
  useActiveSessions,
  useSessionHistory,
  useForceEndSession,
} from "@liyaqa/shared/queries/platform/use-impersonation";
import type { ImpersonationFilters } from "@liyaqa/shared/types/platform/impersonation";
import { IMPERSONATION_STATUS_CONFIG } from "@liyaqa/shared/types/platform/impersonation";

type TabKey = "active" | "history";

/**
 * Impersonation Management Page
 *
 * Provides oversight of impersonation sessions — view active sessions,
 * force-end sessions, and review session history with status filtering.
 */
export default function ImpersonationManagementPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [filters, setFilters] = useState<ImpersonationFilters>({
    page: 0,
    size: 20,
  });

  const texts = {
    title: isRtl ? "إدارة انتحال الهوية" : "Impersonation Management",
    subtitle: isRtl
      ? "مراقبة وإدارة جلسات انتحال الهوية على المنصة"
      : "Monitor and manage platform impersonation sessions",
    activeSessions: isRtl ? "الجلسات النشطة" : "Active Sessions",
    sessionHistory: isRtl ? "سجل الجلسات" : "Session History",
    activeSessionsCount: isRtl ? "الجلسات النشطة" : "Active Sessions",
    platformUser: isRtl ? "مستخدم المنصة" : "Platform User",
    targetUser: isRtl ? "المستخدم المستهدف" : "Target User",
    tenant: isRtl ? "المستأجر" : "Tenant",
    role: isRtl ? "الدور" : "Role",
    startedAt: isRtl ? "وقت البدء" : "Started",
    expiresAt: isRtl ? "تنتهي في" : "Expires at",
    endedAt: isRtl ? "وقت الانتهاء" : "Ended at",
    duration: isRtl ? "المدة" : "Duration",
    status: isRtl ? "الحالة" : "Status",
    forceEnd: isRtl ? "إنهاء إجباري" : "Force End",
    refresh: isRtl ? "تحديث" : "Refresh",
    noActiveSessions: isRtl ? "لا توجد جلسات نشطة" : "No active sessions",
    noActiveDescription: isRtl
      ? "لا يوجد أي مستخدم ينتحل هوية مستخدم آخر حاليًا"
      : "No users are currently impersonating other users",
    noHistory: isRtl ? "لا يوجد سجل جلسات" : "No session history",
    noHistoryDescription: isRtl
      ? "لم يتم تسجيل أي جلسات انتحال هوية بعد"
      : "No impersonation sessions have been recorded yet",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    all: isRtl ? "الكل" : "All",
    filterByStatus: isRtl ? "تصفية بالحالة" : "Filter by status",
    impersonating: isRtl ? "ينتحل هوية" : "impersonating",
    ago: isRtl ? "منذ" : "ago",
  };

  // Data fetching
  const {
    data: activeData,
    isLoading: activeLoading,
    refetch: refetchActive,
  } = useActiveSessions();

  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useSessionHistory(filters);

  // Mutations
  const forceEndMutation = useForceEndSession();

  const handleForceEnd = async (sessionId: string) => {
    await forceEndMutation.mutateAsync(sessionId);
  };

  const handleRefresh = () => {
    if (activeTab === "active") {
      refetchActive();
    } else {
      refetchHistory();
    }
  };

  const handleStatusFilter = (value: string) => {
    setFilters({
      ...filters,
      status: value === "ALL" ? undefined : (value as ImpersonationFilters["status"]),
      page: 0,
    });
  };

  const sessions = activeData?.sessions || [];
  const historyItems = historyData?.content || [];

  /**
   * Calculate human-readable duration between two timestamps
   */
  function calculateDuration(startedAt: string, endedAt?: string): string {
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const diffMs = end - start;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const remainMin = diffMin % 60;

    if (diffHrs > 0) {
      return isRtl ? `${diffHrs} س ${remainMin} د` : `${diffHrs}h ${remainMin}m`;
    }
    return isRtl ? `${diffMin} دقيقة` : `${diffMin}m`;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div className={isRtl ? "text-right" : ""}>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {texts.title}
          </h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 me-1" />
            {texts.refresh}
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {texts.activeSessionsCount}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {activeData?.totalActive || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Switcher */}
      <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
        <Button
          variant={activeTab === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("active")}
          className="flex items-center gap-1.5"
        >
          <UserCheck className="h-4 w-4" />
          {texts.activeSessions}
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("history")}
          className="flex items-center gap-1.5"
        >
          <Clock className="h-4 w-4" />
          {texts.sessionHistory}
        </Button>
      </div>

      {/* Active Sessions Tab */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {activeLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{texts.loading}</p>
                </div>
              </CardContent>
            </Card>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="font-medium">{texts.noActiveSessions}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {texts.noActiveDescription}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="border-primary/20 hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div
                      className={cn(
                        "flex items-start justify-between",
                        isRtl && "flex-row-reverse"
                      )}
                    >
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        {session.platformUserName}
                      </CardTitle>
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      >
                        {isRtl
                          ? IMPERSONATION_STATUS_CONFIG.ACTIVE.labelAr
                          : IMPERSONATION_STATUS_CONFIG.ACTIVE.labelEn}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Platform User */}
                    <div className={isRtl ? "text-right" : ""}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {texts.platformUser}
                      </p>
                      <p className="font-medium">{session.platformUserName}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.platformUserEmail}
                      </p>
                    </div>

                    {/* Arrow / Impersonating indicator */}
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm text-muted-foreground",
                        isRtl && "flex-row-reverse"
                      )}
                    >
                      <UserCheck className="h-4 w-4 text-primary" />
                      <span>{texts.impersonating}</span>
                    </div>

                    {/* Target User */}
                    <div className={isRtl ? "text-right" : ""}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {texts.targetUser}
                      </p>
                      <p className="font-medium">{session.targetUserName}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.targetUserEmail}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {session.targetUserRole}
                      </Badge>
                    </div>

                    {/* Tenant */}
                    {session.tenantName && (
                      <div className={isRtl ? "text-right" : ""}>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {texts.tenant}
                        </p>
                        <p className="text-sm font-medium">{session.tenantName}</p>
                      </div>
                    )}

                    {/* Timing */}
                    <div
                      className={cn(
                        "flex items-center gap-4 text-sm text-muted-foreground",
                        isRtl && "flex-row-reverse"
                      )}
                    >
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {texts.startedAt}:{" "}
                        {formatDistanceToNow(new Date(session.startedAt), {
                          addSuffix: true,
                          locale: isRtl ? ar : enUS,
                        })}
                      </span>
                    </div>
                    <div className={cn("text-sm text-muted-foreground", isRtl ? "text-right" : "")}>
                      <span>
                        {texts.expiresAt}:{" "}
                        {new Date(session.expiresAt).toLocaleString(locale)}
                      </span>
                    </div>

                    {/* Reason */}
                    {session.reason && (
                      <div className={isRtl ? "text-right" : ""}>
                        <p className="text-xs text-muted-foreground italic">
                          &quot;{session.reason}&quot;
                        </p>
                      </div>
                    )}

                    {/* Force End */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleForceEnd(session.id)}
                      disabled={forceEndMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 me-1" />
                      {texts.forceEnd}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card>
            <CardContent className="pt-6">
              <div
                className={cn(
                  "flex items-center gap-3",
                  isRtl && "flex-row-reverse"
                )}
              >
                <Select
                  value={filters.status || "ALL"}
                  onValueChange={handleStatusFilter}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={texts.filterByStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{texts.all}</SelectItem>
                    <SelectItem value="ACTIVE">
                      {isRtl
                        ? IMPERSONATION_STATUS_CONFIG.ACTIVE.labelAr
                        : IMPERSONATION_STATUS_CONFIG.ACTIVE.labelEn}
                    </SelectItem>
                    <SelectItem value="ENDED">
                      {isRtl
                        ? IMPERSONATION_STATUS_CONFIG.ENDED.labelAr
                        : IMPERSONATION_STATUS_CONFIG.ENDED.labelEn}
                    </SelectItem>
                    <SelectItem value="EXPIRED">
                      {isRtl
                        ? IMPERSONATION_STATUS_CONFIG.EXPIRED.labelAr
                        : IMPERSONATION_STATUS_CONFIG.EXPIRED.labelEn}
                    </SelectItem>
                    <SelectItem value="FORCE_ENDED">
                      {isRtl
                        ? IMPERSONATION_STATUS_CONFIG.FORCE_ENDED.labelAr
                        : IMPERSONATION_STATUS_CONFIG.FORCE_ENDED.labelEn}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* History List */}
          <Card>
            <CardContent className="pt-6">
              {historyLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{texts.loading}</p>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="font-medium">{texts.noHistory}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {texts.noHistoryDescription}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Table Header */}
                  <div
                    className={cn(
                      "hidden md:grid md:grid-cols-7 gap-4 p-3 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide",
                      isRtl && "text-right"
                    )}
                  >
                    <span>{texts.platformUser}</span>
                    <span>{texts.targetUser}</span>
                    <span>{texts.tenant}</span>
                    <span>{texts.status}</span>
                    <span>{texts.startedAt}</span>
                    <span>{texts.endedAt}</span>
                    <span>{texts.duration}</span>
                  </div>

                  {/* Table Rows */}
                  {historyItems.map((session) => {
                    const statusConfig = IMPERSONATION_STATUS_CONFIG[session.status];

                    return (
                      <div
                        key={session.id}
                        className={cn(
                          "grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors",
                          isRtl && "text-right"
                        )}
                      >
                        {/* Platform User */}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {session.platformUserName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {session.platformUserEmail}
                          </p>
                        </div>

                        {/* Target User */}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {session.targetUserName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {session.targetUserEmail}
                          </p>
                          <Badge variant="outline" className="text-xs mt-0.5">
                            {session.targetUserRole}
                          </Badge>
                        </div>

                        {/* Tenant */}
                        <div className="flex items-center">
                          <p className="text-sm truncate">
                            {session.tenantName || "-"}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              statusConfig.color
                            )}
                          >
                            {isRtl ? statusConfig.labelAr : statusConfig.labelEn}
                          </span>
                        </div>

                        {/* Started At */}
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(session.startedAt), {
                              addSuffix: true,
                              locale: isRtl ? ar : enUS,
                            })}
                          </span>
                        </div>

                        {/* Ended At */}
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground">
                            {session.endedAt
                              ? formatDistanceToNow(new Date(session.endedAt), {
                                  addSuffix: true,
                                  locale: isRtl ? ar : enUS,
                                })
                              : "-"}
                          </span>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground">
                            {calculateDuration(session.startedAt, session.endedAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
