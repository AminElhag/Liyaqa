"use client";

import { useLocale } from "next-intl";
import { Calendar, Clock, Dumbbell, Users } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useTrainerSchedule,
  useTodaySchedule,
  useUpcomingSessions,
  useUpdateTrainerAvailability,
} from "@liyaqa/shared/queries/use-trainer-portal";
import { useMyTrainerProfile } from "@liyaqa/shared/queries/use-trainers";
import { UpcomingSessionsList } from "@/components/trainer/upcoming-sessions-list";
import { ScheduleAvailabilityEditor } from "@/components/trainer/schedule-availability-editor";
import type { AvailabilityFormValues } from "@liyaqa/shared/lib/validations/trainer-schedule";
import type { UpcomingSessionResponse } from "@liyaqa/shared/types/trainer-portal";
import { cn } from "@liyaqa/shared/utils";

function formatDate(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "PPP", { locale: locale === "ar" ? ar : enUS });
  } catch {
    return dateString;
  }
}

function SessionCard({ session }: { session: UpcomingSessionResponse }) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    ptSession: locale === "ar" ? "تدريب شخصي" : "PT Session",
    classSession: locale === "ar" ? "جلسة جماعية" : "Class Session",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border bg-muted/50",
        isRtl && "flex-row-reverse"
      )}
    >
      <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
        <Badge variant={session.sessionType === "PT" ? "default" : "secondary"}>
          {session.sessionType === "PT" ? texts.ptSession : texts.classSession}
        </Badge>
        <div className={cn(isRtl && "text-right")}>
          <p className="font-medium text-sm">
            {session.clientName || session.className}
          </p>
          <p className="text-xs text-muted-foreground">
            {session.startTime} - {session.endTime}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();

  // Get trainer profile
  const { data: trainerProfile } = useMyTrainerProfile();
  const trainerId = trainerProfile?.id;

  // Fetch schedule data
  const { data: schedule, isLoading: scheduleLoading } = useTrainerSchedule(trainerId);
  const { data: todaySessions } = useTodaySchedule(trainerId);
  const { data: upcomingSessions } = useUpcomingSessions({
    trainerId,
    limit: 50,
  });

  // Update availability mutation
  const updateAvailability = useUpdateTrainerAvailability();

  const texts = {
    title: locale === "ar" ? "إدارة الجدول" : "Schedule Management",
    description:
      locale === "ar"
        ? "إدارة جدولك الزمني وتحديد التوفر وعرض الجلسات القادمة"
        : "Manage your schedule, set availability, and view upcoming sessions",
    // Tabs
    overview: locale === "ar" ? "نظرة عامة" : "Overview",
    upcoming: locale === "ar" ? "القادم" : "Upcoming",
    availability: locale === "ar" ? "التوفر" : "Availability",
    // Overview
    todaysSessions: locale === "ar" ? "جلسات اليوم" : "Today's Sessions",
    weekSummary: locale === "ar" ? "ملخص الأسبوع" : "Week Summary",
    next7Days: locale === "ar" ? "الأيام السبعة القادمة" : "Next 7 Days",
    noSessionsToday: locale === "ar" ? "لا توجد جلسات اليوم" : "No sessions today",
    totalSessions: locale === "ar" ? "إجمالي الجلسات" : "Total Sessions",
    ptSessions: locale === "ar" ? "جلسات تدريب شخصي" : "PT Sessions",
    classSessions: locale === "ar" ? "جلسات جماعية" : "Class Sessions",
    // Upcoming
    allUpcomingSessions:
      locale === "ar" ? "جميع الجلسات القادمة" : "All Upcoming Sessions",
    sessionsScheduled: locale === "ar" ? "جلسة مجدولة" : "sessions scheduled",
    noUpcomingSessions:
      locale === "ar" ? "لا توجد جلسات قادمة" : "No upcoming sessions",
    noUpcomingSessionsDesc:
      locale === "ar"
        ? "لا توجد جلسات مجدولة في الوقت الحالي"
        : "You have no sessions scheduled at the moment",
    // Availability
    weeklyAvailability: locale === "ar" ? "التوفر الأسبوعي" : "Weekly Availability",
    availabilityDesc:
      locale === "ar"
        ? "حدد أوقات توفرك الأسبوعية للجلسات"
        : "Set your weekly availability for sessions",
    unavailableDates: locale === "ar" ? "التواريخ غير المتاحة" : "Unavailable Dates",
    availabilityUpdated:
      locale === "ar" ? "تم تحديث التوفر بنجاح" : "Availability updated successfully",
    error: locale === "ar" ? "خطأ" : "Error",
  };

  const handleSaveAvailability = (data: AvailabilityFormValues) => {
    if (!trainerId) return;

    updateAvailability.mutate(
      { trainerId, data: { availability: data } },
      {
        onSuccess: () => {
          toast({
            title: texts.availabilityUpdated,
          });
        },
        onError: (error: Error) => {
          toast({
            title: texts.error,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (scheduleLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Calculate session stats from upcoming sessions
  const next7DaysSessions = schedule?.upcomingSessions?.slice(0, 7) || [];
  const totalUpcoming = schedule?.upcomingSessions?.length || 0;
  const ptSessionCount =
    schedule?.upcomingSessions?.filter((s) => s.sessionType === "PT").length || 0;
  const classSessionCount =
    schedule?.upcomingSessions?.filter((s) => s.sessionType === "CLASS").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{texts.title}</h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">{texts.overview}</TabsTrigger>
          <TabsTrigger value="upcoming">{texts.upcoming}</TabsTrigger>
          <TabsTrigger value="availability">{texts.availability}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Today's Sessions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {texts.todaysSessions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaySessions && todaySessions.length > 0 ? (
                  <div className="space-y-2">
                    {todaySessions.map((session) => (
                      <SessionCard key={session.sessionId} session={session} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {texts.noSessionsToday}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Week Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {texts.weekSummary}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div
                    className={cn(
                      "flex justify-between items-center",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <span className="text-sm text-muted-foreground">
                      {texts.totalSessions}
                    </span>
                    <span className="text-2xl font-bold">{totalUpcoming}</span>
                  </div>
                  <div
                    className={cn(
                      "flex justify-between items-center",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                      <Dumbbell className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-muted-foreground">
                        {texts.ptSessions}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">
                      {ptSessionCount}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex justify-between items-center",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-muted-foreground">
                        {texts.classSessions}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">
                      {classSessionCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next 7 Days Preview */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.next7Days}</CardTitle>
            </CardHeader>
            <CardContent>
              {next7DaysSessions.length > 0 ? (
                <UpcomingSessionsList
                  sessions={next7DaysSessions}
                  locale={locale}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {texts.noUpcomingSessions}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Tab */}
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>{texts.allUpcomingSessions}</CardTitle>
              <CardDescription>
                {upcomingSessions?.length || 0} {texts.sessionsScheduled}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSessions && upcomingSessions.length > 0 ? (
                <UpcomingSessionsList sessions={upcomingSessions} locale={locale} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="font-medium">{texts.noUpcomingSessions}</p>
                  <p className="text-sm text-muted-foreground">
                    {texts.noUpcomingSessionsDesc}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{texts.weeklyAvailability}</CardTitle>
              <CardDescription>{texts.availabilityDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleAvailabilityEditor
                availability={schedule?.availability || null}
                onSave={handleSaveAvailability}
                isLoading={updateAvailability.isPending}
              />
            </CardContent>
          </Card>

          {/* Unavailable Dates Card */}
          {schedule?.unavailableDates && schedule.unavailableDates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{texts.unavailableDates}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {schedule.unavailableDates.map((date) => (
                    <Badge key={date} variant="secondary">
                      {formatDate(date, locale)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
