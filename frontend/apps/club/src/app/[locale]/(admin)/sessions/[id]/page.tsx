"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  Users,
  Clock,
  MapPin,
  Calendar,
  UserCheck,
  UserPlus,
  XCircle,
  Edit,
  Play,
  CheckCircle,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  useSession,
  useSessionBookings,
  useCheckInBooking,
  useCancelBooking,
  useMarkNoShow,
  useStartSession,
  useCompleteSession,
  useCancelSession,
  useCreateBooking,
} from "@liyaqa/shared/queries";
import { SessionQrCode } from "@/components/admin/session-qr-code";
import { BookingMemberSearch } from "@/components/admin/booking-member-search";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { formatDate, formatTime } from "@liyaqa/shared/utils";

export default function SessionDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const { data: session, isLoading, error } = useSession(id);
  const { data: bookings, isLoading: isLoadingBookings } =
    useSessionBookings(id);

  const checkInBooking = useCheckInBooking();
  const cancelBooking = useCancelBooking();
  const markNoShow = useMarkNoShow();
  const startSession = useStartSession();
  const completeSession = useCompleteSession();
  const cancelSession = useCancelSession();
  const createBooking = useCreateBooking();

  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const texts = {
    back: locale === "ar" ? "العودة للجلسات" : "Back to Sessions",
    sessionDetails: locale === "ar" ? "تفاصيل الجلسة" : "Session Details",
    class: locale === "ar" ? "الفصل" : "Class",
    date: locale === "ar" ? "التاريخ" : "Date",
    time: locale === "ar" ? "الوقت" : "Time",
    trainer: locale === "ar" ? "المدرب" : "Trainer",
    location: locale === "ar" ? "الموقع" : "Location",
    capacity: locale === "ar" ? "السعة" : "Capacity",
    booked: locale === "ar" ? "محجوز" : "Booked",
    available: locale === "ar" ? "متاح" : "Available",
    waitlist: locale === "ar" ? "قائمة الانتظار" : "Waitlist",
    bookings: locale === "ar" ? "الحجوزات" : "Bookings",
    noBookings: locale === "ar" ? "لا توجد حجوزات" : "No bookings yet",
    member: locale === "ar" ? "العضو" : "Member",
    status: locale === "ar" ? "الحالة" : "Status",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    checkIn: locale === "ar" ? "تسجيل الحضور" : "Check In",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    noShow: locale === "ar" ? "لم يحضر" : "No Show",
    error:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل الجلسة"
        : "Error loading session",
    notAssigned: locale === "ar" ? "غير محدد" : "Not assigned",
    spots: locale === "ar" ? "مقاعد" : "spots",
    edit: locale === "ar" ? "تعديل" : "Edit",
    start: locale === "ar" ? "بدء الجلسة" : "Start Session",
    complete: locale === "ar" ? "إنهاء الجلسة" : "Complete Session",
    cancelSession: locale === "ar" ? "إلغاء الجلسة" : "Cancel Session",
    sessionStarted: locale === "ar" ? "تم بدء الجلسة" : "Session started",
    sessionCompleted: locale === "ar" ? "تم إنهاء الجلسة" : "Session completed",
    sessionCancelled: locale === "ar" ? "تم إلغاء الجلسة" : "Session cancelled",
    errorAction: locale === "ar" ? "حدث خطأ" : "An error occurred",
    addMember: locale === "ar" ? "إضافة عضو" : "Add Member",
  };

  const handleStartSession = async () => {
    try {
      await startSession.mutateAsync(id);
      toast({
        title: texts.sessionStarted,
      });
    } catch {
      toast({
        title: texts.errorAction,
        variant: "destructive",
      });
    }
  };

  const handleCompleteSession = async () => {
    try {
      await completeSession.mutateAsync(id);
      toast({
        title: texts.sessionCompleted,
      });
    } catch {
      toast({
        title: texts.errorAction,
        variant: "destructive",
      });
    }
  };

  const handleCancelSession = async (reason?: string) => {
    try {
      await cancelSession.mutateAsync({ id, reason });
      toast({
        title: texts.sessionCancelled,
      });
    } catch {
      toast({
        title: texts.errorAction,
        variant: "destructive",
      });
    }
  };

  const handleBookMember = async (memberId: string) => {
    await createBooking.mutateAsync({ sessionId: id, memberId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !session) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {texts.error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/sessions`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              <LocalizedText text={session.className} />
            </h1>
            <div className="flex items-center gap-2">
              <StatusBadge status={session.status} locale={locale} />
              <span className="text-muted-foreground">
                {formatDate(session.date, locale)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/sessions/${id}/edit`}>
              <Edit className="me-2 h-4 w-4" />
              {texts.edit}
            </Link>
          </Button>
          {session.status === "SCHEDULED" && (
            <>
              <Button
                variant="default"
                onClick={handleStartSession}
                disabled={startSession.isPending}
              >
                <Play className="me-2 h-4 w-4" />
                {texts.start}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCancelSession()}
                disabled={cancelSession.isPending}
                className="text-destructive hover:text-destructive"
              >
                <Ban className="me-2 h-4 w-4" />
                {texts.cancelSession}
              </Button>
            </>
          )}
          {session.status === "IN_PROGRESS" && (
            <Button
              variant="default"
              onClick={handleCompleteSession}
              disabled={completeSession.isPending}
            >
              <CheckCircle className="me-2 h-4 w-4" />
              {texts.complete}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.sessionDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {texts.date}
                </p>
                <p>{formatDate(session.date, locale)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {texts.time}
                </p>
                <p className="font-mono">
                  {session.startTime} - {session.endTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {texts.trainer}
                </p>
                <p>
                  {session.trainerName ? (
                    <LocalizedText text={session.trainerName} />
                  ) : (
                    <span className="text-muted-foreground">
                      {texts.notAssigned}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {texts.location}
                </p>
                <p>
                  {session.locationName ? (
                    <LocalizedText text={session.locationName} />
                  ) : (
                    <span className="text-muted-foreground">
                      {texts.notAssigned}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacity */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.capacity}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {session.bookedCount}
                </p>
                <p className="text-sm text-muted-foreground">{texts.booked}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{session.availableSpots}</p>
                <p className="text-sm text-muted-foreground">
                  {texts.available}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {session.waitlistCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {texts.waitlist}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all"
                style={{
                  width: `${(session.bookedCount / session.capacity) * 100}%`,
                }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {session.bookedCount} / {session.capacity} {texts.spots}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* QR Code for Check-in (only show for scheduled or in-progress sessions) */}
      {(session.status === "SCHEDULED" || session.status === "IN_PROGRESS") && (
        <SessionQrCode sessionId={id} locale={locale} />
      )}

      {/* Bookings List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{texts.bookings}</CardTitle>
            <CardDescription>
              {bookings?.length || 0} {texts.booked}
            </CardDescription>
          </div>
          {(session.status === "SCHEDULED" || session.status === "IN_PROGRESS") && (
            <Button size="sm" variant="outline" onClick={() => setAddMemberOpen(true)}>
              <UserPlus className="me-2 h-4 w-4" />
              {texts.addMember}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="flex items-center justify-center py-10">
              <Loading />
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        <LocalizedText text={booking.memberName} />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.memberEmail}
                      </p>
                    </div>
                    {booking.waitlistPosition && (
                      <Badge variant="warning">
                        #{booking.waitlistPosition}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={booking.status} locale={locale} />
                    {booking.status === "CONFIRMED" && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => checkInBooking.mutate(booking.id)}
                          disabled={checkInBooking.isPending}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelBooking.mutate(booking.id)}
                          disabled={cancelBooking.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {booking.status === "CHECKED_IN" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markNoShow.mutate(booking.id)}
                        disabled={markNoShow.isPending}
                        className="text-destructive"
                      >
                        {texts.noShow}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              {texts.noBookings}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <BookingMemberSearch
        session={session}
        existingMemberIds={(bookings || []).map((b) => b.memberId)}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onBookMember={handleBookMember}
      />
    </div>
  );
}
