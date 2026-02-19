"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  CalendarDays,
  CalendarCheck,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  ArrowUpRight,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useTrainerDashboard } from "@liyaqa/shared/queries/use-trainer-portal";
import { useMyUpcomingPTSessions } from "@liyaqa/shared/queries/use-pt-sessions";
import { cn, formatDate } from "@liyaqa/shared/utils";
import type { UpcomingSessionResponse } from "@liyaqa/shared/types/trainer-portal";

const text = {
  title: { en: "Dashboard", ar: "لوحة التحكم" },
  welcome: { en: "Welcome back", ar: "مرحبا بعودتك" },
  todaySessions: { en: "Today's Sessions", ar: "جلسات اليوم" },
  thisWeek: { en: "This Week", ar: "هذا الأسبوع" },
  totalClients: { en: "Total Clients", ar: "إجمالي العملاء" },
  completionRate: { en: "Completion Rate", ar: "معدل الإتمام" },
  upcomingSessions: { en: "Upcoming Sessions", ar: "الجلسات القادمة" },
  noUpcoming: { en: "No upcoming sessions", ar: "لا توجد جلسات قادمة" },
  viewAll: { en: "View All", ar: "عرض الكل" },
  sessions: { en: "sessions", ar: "جلسات" },
  completed: { en: "completed", ar: "مكتملة" },
  pt: { en: "1:1", ar: "1:1" },
  semiPrivate: { en: "Semi-Private", ar: "شبه خاصة" },
  class: { en: "Class", ar: "فصل" },
  club: { en: "Club", ar: "النادي" },
  home: { en: "Home", ar: "المنزل" },
  loading: { en: "Loading...", ar: "جاري التحميل..." },
  errorLoading: { en: "Failed to load dashboard", ar: "فشل في تحميل لوحة التحكم" },
};

export default function TrainerDashboardPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);

  const { user } = useAuthStore();

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useTrainerDashboard();

  const {
    data: upcomingData,
    isLoading: upcomingLoading,
  } = useMyUpcomingPTSessions({ size: 5 });

  const displayName = useMemo(() => {
    if (!user?.displayName) return "";
    return isAr
      ? user.displayName.ar || user.displayName.en
      : user.displayName.en;
  }, [user, isAr]);

  const stats = useMemo(() => {
    if (!dashboard) return null;
    const completedThisMonth = dashboard.schedule.completedThisMonth || 0;
    const totalSessions =
      completedThisMonth + (dashboard.schedule.upcomingSessions || 0);
    const completionRate =
      totalSessions > 0
        ? Math.round((completedThisMonth / totalSessions) * 100)
        : 0;

    return {
      todaySessions: dashboard.schedule.todaysSessions || 0,
      weekSessions: dashboard.schedule.upcomingSessions || 0,
      totalClients: dashboard.clients.totalClients || 0,
      completionRate,
    };
  }, [dashboard]);

  // Merge dashboard upcoming sessions with PT upcoming sessions
  const upcomingSessions: UpcomingSessionResponse[] = useMemo(() => {
    if (dashboard?.schedule?.nextSession) {
      // Use dashboard upcoming sessions if available
      const fromDashboard = dashboard.schedule.nextSession
        ? [dashboard.schedule.nextSession]
        : [];
      return fromDashboard;
    }
    // Fall back to upcoming PT sessions data
    if (upcomingData?.content) {
      return upcomingData.content.map((s) => ({
        sessionId: s.id,
        sessionType: "PT" as const,
        sessionDate: s.sessionDate,
        startTime: s.startTime,
        endTime: "",
        clientName: s.memberName || null,
        className: null,
        location: null,
        status: s.status,
      }));
    }
    return [];
  }, [dashboard, upcomingData]);

  const statCards = [
    {
      label: t("todaySessions"),
      value: stats?.todaySessions ?? 0,
      icon: CalendarDays,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: t("thisWeek"),
      value: stats?.weekSessions ?? 0,
      icon: CalendarCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: t("totalClients"),
      value: stats?.totalClients ?? 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: t("completionRate"),
      value: `${stats?.completionRate ?? 0}%`,
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  const getSessionTypeBadge = (session: UpcomingSessionResponse) => {
    if (session.sessionType === "PT") {
      return (
        <Badge variant="outline" className="text-xs">
          {t("pt")}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        {t("class")}
      </Badge>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "SCHEDULED":
        return "text-blue-600";
      case "IN_PROGRESS":
        return "text-amber-600";
      case "COMPLETED":
        return "text-green-600";
      case "CANCELLED":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("welcome")}, {displayName}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", card.bgColor)}>
                    <Icon className={cn("h-5 w-5", card.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    {dashboardLoading ? (
                      <Skeleton className="h-6 w-10 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold font-display text-foreground">
                        {card.value}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Error state */}
      {dashboardError && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("errorLoading")}
          </CardContent>
        </Card>
      )}

      {/* Upcoming sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">{t("upcomingSessions")}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/trainer/sessions`}>
              {t("viewAll")}
              <ArrowUpRight className="h-4 w-4 ms-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {(dashboardLoading || upcomingLoading) ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>{t("noUpcoming")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <Link
                  key={session.sessionId}
                  href={`/${locale}/trainer/sessions/${session.sessionId}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {session.clientName || session.className || "-"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDate(session.sessionDate, locale)} &middot;{" "}
                        {session.startTime}
                        {session.endTime ? ` - ${session.endTime}` : ""}
                      </span>
                    </div>
                    {session.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{session.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getSessionTypeBadge(session)}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        getStatusColor(session.status)
                      )}
                    >
                      {session.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
