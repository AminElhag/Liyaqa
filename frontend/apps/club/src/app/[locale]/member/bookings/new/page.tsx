"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { format, addDays, startOfDay } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@liyaqa/shared/components/ui/alert";
import { cn } from "@liyaqa/shared/utils";
import { useAvailableSessions, useBookSession } from "@liyaqa/shared/queries/use-member-portal";
import { toast } from "sonner";
import type { AvailableSession } from "@liyaqa/shared/types/member-portal";

export default function NewBookingPage() {
  const t = useTranslations("member.bookings");
  const locale = useLocale();
  const router = useRouter();
  const dateLocale = locale === "ar" ? ar : enUS;

  const [selectedDate, setSelectedDate] = React.useState<Date>(startOfDay(new Date()));
  const [selectedSession, setSelectedSession] = React.useState<AvailableSession | null>(null);

  // Calculate date range for fetching sessions (7 days window)
  const dateFrom = format(selectedDate, "yyyy-MM-dd");
  const dateTo = format(addDays(selectedDate, 6), "yyyy-MM-dd");

  const { data: sessionsData, isLoading: sessionsLoading } = useAvailableSessions({
    dateFrom,
    dateTo,
    size: 50,
  });

  const bookSessionMutation = useBookSession({
    onSuccess: () => {
      toast.success(t("bookingConfirmed"));
      router.push(`/${locale}/member/bookings`);
    },
    onError: () => {
      toast.error(
        locale === "ar" ? "فشل في حجز الصف" : "Failed to book class"
      );
    },
  });

  // Group sessions by date
  const sessionsByDate = React.useMemo(() => {
    const sessions = sessionsData?.content ?? [];
    const grouped: Record<string, AvailableSession[]> = {};

    sessions.forEach((session) => {
      const date = session.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });

    // Sort sessions by start time within each date
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
  }, [sessionsData]);

  // Generate date options (7 days from selected date)
  const dateOptions = React.useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(selectedDate, i));
    }
    return dates;
  }, [selectedDate]);

  const handlePreviousWeek = () => {
    setSelectedDate(addDays(selectedDate, -7));
    setSelectedSession(null);
  };

  const handleNextWeek = () => {
    setSelectedDate(addDays(selectedDate, 7));
    setSelectedSession(null);
  };

  const handleBookSession = () => {
    if (selectedSession) {
      bookSessionMutation.mutate({ sessionId: selectedSession.id });
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getSessionStatus = (session: AvailableSession) => {
    if (session.availableSpots === 0) {
      return { label: locale === "ar" ? "ممتلئ" : "Full", variant: "destructive" as const };
    }
    if (session.availableSpots <= 3) {
      return { label: locale === "ar" ? "متبقي القليل" : "Few spots", variant: "secondary" as const };
    }
    return { label: `${session.availableSpots} ${locale === "ar" ? "متاح" : "available"}`, variant: "default" as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          {locale === "ar" ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("bookClass")}</h1>
          <p className="text-neutral-500">
            {locale === "ar"
              ? "اختر صفاً وموعداً للحجز"
              : "Select a class and time to book"}
          </p>
        </div>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
              {locale === "ar" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {locale === "ar" ? "الأسبوع السابق" : "Previous"}
            </Button>
            <span className="font-medium">
              {format(selectedDate, "MMMM yyyy", { locale: dateLocale })}
            </span>
            <Button variant="ghost" size="sm" onClick={handleNextWeek}>
              {locale === "ar" ? "الأسبوع التالي" : "Next"}
              {locale === "ar" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* Date pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dateOptions.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const hasClasses = sessionsByDate[dateStr]?.length > 0;
              const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedSession(null)}
                  className={cn(
                    "flex flex-col items-center px-4 py-2 rounded-lg min-w-[70px] transition-colors",
                    hasClasses
                      ? "hover:bg-primary/10"
                      : "opacity-50 cursor-not-allowed",
                    isToday && "ring-2 ring-primary"
                  )}
                >
                  <span className="text-xs text-neutral-500">
                    {format(date, "EEE", { locale: dateLocale })}
                  </span>
                  <span className="text-lg font-semibold">{format(date, "d")}</span>
                  {hasClasses && (
                    <div className="h-1.5 w-1.5 bg-primary rounded-full mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {sessionsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {dateOptions.map((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const sessions = sessionsByDate[dateStr] || [];

            if (sessions.length === 0) return null;

            return (
              <div key={dateStr}>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {format(date, "EEEE, d MMMM", { locale: dateLocale })}
                </h3>
                <div className="grid gap-3">
                  {sessions.map((session) => {
                    const className =
                      locale === "ar"
                        ? session.className?.ar || session.className?.en
                        : session.className?.en;
                    const trainerName =
                      locale === "ar"
                        ? session.trainerName?.ar || session.trainerName?.en
                        : session.trainerName?.en;
                    const locationName =
                      locale === "ar"
                        ? session.locationName?.ar || session.locationName?.en
                        : session.locationName?.en;
                    const status = getSessionStatus(session);
                    const isSelected = selectedSession?.id === session.id;
                    const isFull = session.availableSpots === 0;

                    return (
                      <Card
                        key={session.id}
                        className={cn(
                          "cursor-pointer transition-all",
                          isSelected && "ring-2 ring-primary bg-primary/5",
                          isFull && "opacity-60 cursor-not-allowed"
                        )}
                        onClick={() => !isFull && setSelectedSession(session)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{className}</h4>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                </span>
                                {trainerName && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {trainerName}
                                  </span>
                                )}
                                {locationName && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {locationName}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {session.bookedCount}/{session.capacity}
                                </span>
                              </div>
                            </div>
                            {isSelected && !isFull && (
                              <div className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center">
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {Object.keys(sessionsByDate).length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {locale === "ar" ? "لا توجد صفوف متاحة" : "No Classes Available"}
              </AlertTitle>
              <AlertDescription>
                {locale === "ar"
                  ? "لا توجد صفوف متاحة في هذه الفترة. حاول تغيير التاريخ."
                  : "No classes are available for this period. Try changing the date range."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Confirm Booking Button */}
      {selectedSession && (
        <div className="fixed bottom-0 start-0 end-0 p-4 bg-white border-t shadow-lg lg:ms-64">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                {locale === "ar"
                  ? selectedSession.className?.ar || selectedSession.className?.en
                  : selectedSession.className?.en}
              </p>
              <p className="text-sm text-neutral-500">
                {format(new Date(selectedSession.date), "EEE, d MMM", { locale: dateLocale })} •{" "}
                {formatTime(selectedSession.startTime)}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleBookSession}
              disabled={bookSessionMutation.isPending}
            >
              {bookSessionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {locale === "ar" ? "جاري الحجز..." : "Booking..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 me-2" />
                  {t("confirmBooking")}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
