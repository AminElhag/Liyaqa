"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Calendar,
  CalendarDays,
  Clock,
  Users,
  TrendingUp,
  Plus,
  BarChart3,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocalizedText } from "@/components/ui/localized-text";
import { Loading } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import {
  useClass,
  useUpcomingSessionsByClass,
  useAddSchedule,
  useDeleteSchedule,
  useSessionBookings,
  useCreateBooking,
  useCancelBooking,
  useCheckInBooking,
  useMarkNoShow,
  useCancelSession,
  useStartSession,
  useCompleteSession,
} from "@/queries";
import { ClassDetailHeader } from "@/components/admin/class-detail-header";
import { ScheduleCalendar } from "@/components/admin/schedule-calendar";
import { SessionCard, SessionGroup } from "@/components/admin/session-card";
import { SessionAttendeesPanel } from "@/components/admin/session-attendees-panel";
import { BookingMemberSearch } from "@/components/admin/booking-member-search";
import type { ClassSession, DayOfWeek } from "@/types/scheduling";

const texts = {
  en: {
    overview: "Overview",
    schedule: "Schedule",
    sessions: "Sessions",
    stats: "Statistics",
    error: "Error loading class",
    description: "Description",
    noDescription: "No description available",
    classSettings: "Class Settings",
    trainer: "Trainer",
    location: "Location",
    notAssigned: "Not assigned",
    upcomingSessions: "Upcoming Sessions",
    noSessions: "No upcoming sessions",
    generateSessions: "Generate Sessions",
    generateSessionsDesc:
      "Create sessions for this class based on the weekly schedule",
    viewAllSessions: "View All Sessions",
    today: "Today",
    tomorrow: "Tomorrow",
    thisWeek: "This Week",
    nextWeek: "Next Week",
    comingSoon: "Statistics coming soon",
    statsDesc: "Track class performance and attendance trends",
    totalBookings: "Total Bookings",
    avgAttendance: "Avg. Attendance",
    noShows: "No Shows",
    addedToSession: "Member added to session",
    removedFromSession: "Member removed from session",
    checkedIn: "Member checked in",
    markedNoShow: "Member marked as no-show",
    sessionStarted: "Session started",
    sessionCompleted: "Session completed",
    sessionCancelled: "Session cancelled",
    actionFailed: "Action failed",
  },
  ar: {
    overview: "نظرة عامة",
    schedule: "الجدول",
    sessions: "الجلسات",
    stats: "الإحصائيات",
    error: "حدث خطأ أثناء تحميل الفصل",
    description: "الوصف",
    noDescription: "لا يوجد وصف متاح",
    classSettings: "إعدادات الفصل",
    trainer: "المدرب",
    location: "الموقع",
    notAssigned: "غير محدد",
    upcomingSessions: "الجلسات القادمة",
    noSessions: "لا توجد جلسات قادمة",
    generateSessions: "إنشاء جلسات",
    generateSessionsDesc: "إنشاء جلسات لهذا الفصل بناءً على الجدول الأسبوعي",
    viewAllSessions: "عرض كل الجلسات",
    today: "اليوم",
    tomorrow: "غداً",
    thisWeek: "هذا الأسبوع",
    nextWeek: "الأسبوع القادم",
    comingSoon: "الإحصائيات قريباً",
    statsDesc: "تتبع أداء الفصل واتجاهات الحضور",
    totalBookings: "إجمالي الحجوزات",
    avgAttendance: "متوسط الحضور",
    noShows: "عدم الحضور",
    addedToSession: "تمت إضافة العضو للجلسة",
    removedFromSession: "تمت إزالة العضو من الجلسة",
    checkedIn: "تم تسجيل حضور العضو",
    markedNoShow: "تم تسجيل عدم الحضور",
    sessionStarted: "بدأت الجلسة",
    sessionCompleted: "اكتملت الجلسة",
    sessionCancelled: "تم إلغاء الجلسة",
    actionFailed: "فشل الإجراء",
  },
};

// Group sessions by date proximity
function groupSessionsByDate(
  sessions: ClassSession[],
  locale: string
): { label: string; sessions: ClassSession[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

  const t = texts[locale as "en" | "ar"];

  const groups: { label: string; sessions: ClassSession[] }[] = [
    { label: t.today, sessions: [] },
    { label: t.tomorrow, sessions: [] },
    { label: t.thisWeek, sessions: [] },
    { label: t.nextWeek, sessions: [] },
  ];

  sessions.forEach((session) => {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === today.getTime()) {
      groups[0].sessions.push(session);
    } else if (sessionDate.getTime() === tomorrow.getTime()) {
      groups[1].sessions.push(session);
    } else if (sessionDate <= endOfWeek) {
      groups[2].sessions.push(session);
    } else if (sessionDate <= endOfNextWeek) {
      groups[3].sessions.push(session);
    }
  });

  return groups.filter((g) => g.sessions.length > 0);
}

export default function ClassDetailPage() {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(
    null
  );
  const [isAttendeePanelOpen, setIsAttendeePanelOpen] = useState(false);
  const [isMemberSearchOpen, setIsMemberSearchOpen] = useState(false);

  // Data fetching
  const { data: gymClass, isLoading, error } = useClass(id);
  const { data: sessions = [], isLoading: isLoadingSessions } =
    useUpcomingSessionsByClass(id);

  // Mutations
  const addSchedule = useAddSchedule();
  const deleteSchedule = useDeleteSchedule();
  const createBooking = useCreateBooking();
  const cancelBooking = useCancelBooking();
  const checkInBooking = useCheckInBooking();
  const markNoShow = useMarkNoShow();
  const cancelSession = useCancelSession();
  const startSession = useStartSession();
  const completeSession = useCompleteSession();

  // Session bookings for selected session
  const { data: sessionBookings = [], refetch: refetchBookings } =
    useSessionBookings(selectedSession?.id ?? "", {
      enabled: !!selectedSession?.id,
    });

  // Group sessions for display
  const groupedSessions = useMemo(
    () => groupSessionsByDate(sessions, locale),
    [sessions, locale]
  );

  // Calculate weekly booking count
  const weeklyBookings = useMemo(() => {
    return sessions.reduce((sum, session) => sum + session.bookedCount, 0);
  }, [sessions]);

  // Handlers
  const handleAddSchedule = useCallback(
    async (schedule: {
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
    }) => {
      await addSchedule.mutateAsync({
        classId: id,
        schedule: {
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        },
      });
    },
    [addSchedule, id]
  );

  const handleDeleteSchedule = useCallback(
    async (scheduleId: string) => {
      await deleteSchedule.mutateAsync({ classId: id, scheduleId });
    },
    [deleteSchedule, id]
  );

  const handleSessionClick = useCallback((session: ClassSession) => {
    setSelectedSession(session);
    setIsAttendeePanelOpen(true);
  }, []);

  const handleBookMember = useCallback(
    async (memberId: string) => {
      if (!selectedSession) return;
      try {
        await createBooking.mutateAsync({
          sessionId: selectedSession.id,
          memberId,
        });
        toast({ title: t.addedToSession });
        refetchBookings();
      } catch {
        toast({ title: t.actionFailed, variant: "destructive" });
      }
    },
    [selectedSession, createBooking, toast, t, refetchBookings]
  );

  const handleCancelBooking = useCallback(
    async (bookingId: string) => {
      try {
        await cancelBooking.mutateAsync(bookingId);
        toast({ title: t.removedFromSession });
        refetchBookings();
      } catch {
        toast({ title: t.actionFailed, variant: "destructive" });
      }
    },
    [cancelBooking, toast, t, refetchBookings]
  );

  const handleCheckIn = useCallback(
    async (bookingId: string) => {
      try {
        await checkInBooking.mutateAsync(bookingId);
        toast({ title: t.checkedIn });
        refetchBookings();
      } catch {
        toast({ title: t.actionFailed, variant: "destructive" });
      }
    },
    [checkInBooking, toast, t, refetchBookings]
  );

  const handleMarkNoShow = useCallback(
    async (bookingId: string) => {
      try {
        await markNoShow.mutateAsync(bookingId);
        toast({ title: t.markedNoShow });
        refetchBookings();
      } catch {
        toast({ title: t.actionFailed, variant: "destructive" });
      }
    },
    [markNoShow, toast, t, refetchBookings]
  );

  const handleStartSession = useCallback(
    async (sessionId: string) => {
      try {
        await startSession.mutateAsync(sessionId);
        toast({ title: t.sessionStarted });
        setIsAttendeePanelOpen(false);
        setSelectedSession(null);
      } catch {
        toast({ title: t.actionFailed, variant: "destructive" });
      }
    },
    [startSession, toast, t]
  );

  const handleCompleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await completeSession.mutateAsync(sessionId);
        toast({ title: t.sessionCompleted });
        setIsAttendeePanelOpen(false);
        setSelectedSession(null);
      } catch {
        toast({ title: t.actionFailed, variant: "destructive" });
      }
    },
    [completeSession, toast, t]
  );

  const handleCancelSession = useCallback(
    async (sessionId: string) => {
      try {
        await cancelSession.mutateAsync(sessionId);
        toast({ title: t.sessionCancelled });
        setIsAttendeePanelOpen(false);
        setSelectedSession(null);
      } catch {
        toast({ title: t.actionFailed, variant: "destructive" });
      }
    },
    [cancelSession, toast, t]
  );

  const handleStatusChange = useCallback(
    (action: "activate" | "deactivate" | "archive") => {
      // Status change is handled by the header component
      // Just navigate back to list if archived
      if (action === "archive") {
        router.push(`/${locale}/classes`);
      }
    },
    [router, locale]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  // Error state
  if (error || !gymClass) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive font-medium">{t.error}</p>
        </CardContent>
      </Card>
    );
  }

  // Get existing booking member IDs for the selected session
  const existingMemberIds = sessionBookings.map((b) => b.memberId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <ClassDetailHeader
        gymClass={gymClass}
        bookingsThisWeek={weeklyBookings}
        onStatusChange={handleStatusChange}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t.overview}</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">{t.schedule}</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">{t.sessions}</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t.stats}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.description}</CardTitle>
              </CardHeader>
              <CardContent>
                {gymClass.description ? (
                  <p className="text-muted-foreground leading-relaxed">
                    <LocalizedText text={gymClass.description} />
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {t.noDescription}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.classSettings}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">
                      {t.trainer}
                    </span>
                    <p className="font-medium">
                      {gymClass.trainerName ? (
                        <LocalizedText text={gymClass.trainerName} />
                      ) : (
                        <span className="text-muted-foreground">
                          {t.notAssigned}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">
                      {t.location}
                    </span>
                    <p className="font-medium">
                      {gymClass.locationName ? (
                        <LocalizedText text={gymClass.locationName} />
                      ) : (
                        <span className="text-muted-foreground">
                          {t.notAssigned}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <span className="text-sm text-muted-foreground block mb-1">
                      {locale === "ar" ? "عدد الجداول" : "Schedules"}
                    </span>
                    <p className="font-medium">
                      {gymClass.schedules?.length ?? 0}{" "}
                      {locale === "ar" ? "جدول" : "schedule(s)"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Sessions Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">{t.upcomingSessions}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("sessions")}
              >
                {t.viewAllSessions}
                <ChevronRight className="h-4 w-4 ms-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="flex justify-center py-8">
                  <Loading />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">{t.noSessions}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    asChild
                  >
                    <Link href={`/${locale}/classes/${id}/generate-sessions`}>
                      <Plus className="h-4 w-4 me-2" />
                      {t.generateSessions}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sessions.slice(0, 6).map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onClick={() => handleSessionClick(session)}
                      compact
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <ScheduleCalendar
            schedules={gymClass.schedules ?? []}
            classId={id}
            onAddSchedule={handleAddSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />

          {/* Generate Sessions CTA */}
          <Card className="border-dashed">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
              <div className="text-center sm:text-start">
                <h3 className="font-semibold">{t.generateSessions}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.generateSessionsDesc}
                </p>
              </div>
              <Button asChild>
                <Link href={`/${locale}/classes/${id}/generate-sessions`}>
                  <Plus className="h-4 w-4 me-2" />
                  {t.generateSessions}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          {/* Generate button */}
          <div className="flex justify-end">
            <Button asChild>
              <Link href={`/${locale}/classes/${id}/generate-sessions`}>
                <Plus className="h-4 w-4 me-2" />
                {t.generateSessions}
              </Link>
            </Button>
          </div>

          {isLoadingSessions ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{t.noSessions}</h3>
                <p className="text-muted-foreground mb-4">
                  {t.generateSessionsDesc}
                </p>
                <Button asChild>
                  <Link href={`/${locale}/classes/${id}/generate-sessions`}>
                    <Plus className="h-4 w-4 me-2" />
                    {t.generateSessions}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedSessions.map((group) => (
                <SessionGroup
                  key={group.label}
                  title={group.label}
                  sessions={group.sessions}
                  onViewAttendees={handleSessionClick}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t.totalBookings}
                    </p>
                    <p className="text-2xl font-bold">{weeklyBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t.avgAttendance}
                    </p>
                    <p className="text-2xl font-bold">
                      {sessions.length > 0
                        ? Math.round(
                            (sessions.reduce(
                              (sum, s) => sum + s.bookedCount,
                              0
                            ) /
                              sessions.reduce((sum, s) => sum + s.capacity, 0)) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.noShows}</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar" ? "الجلسات" : "Sessions"}
                    </p>
                    <p className="text-2xl font-bold">{sessions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder for future charts */}
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{t.comingSoon}</h3>
              <p className="text-muted-foreground">{t.statsDesc}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Attendees Panel */}
      {selectedSession && (
        <SessionAttendeesPanel
          session={selectedSession}
          bookings={sessionBookings}
          open={isAttendeePanelOpen}
          onOpenChange={(open) => {
            setIsAttendeePanelOpen(open);
            if (!open) setSelectedSession(null);
          }}
          onAddMember={() => setIsMemberSearchOpen(true)}
          onCheckIn={handleCheckIn}
          onMarkNoShow={handleMarkNoShow}
          onCancelBooking={handleCancelBooking}
          onStartSession={handleStartSession}
          onCompleteSession={handleCompleteSession}
          onCancelSession={handleCancelSession}
        />
      )}

      {/* Member Search Dialog */}
      {selectedSession && (
        <BookingMemberSearch
          session={selectedSession}
          existingMemberIds={existingMemberIds}
          open={isMemberSearchOpen}
          onOpenChange={setIsMemberSearchOpen}
          onBookMember={handleBookMember}
        />
      )}
    </div>
  );
}
