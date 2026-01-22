"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  X,
  UserPlus,
  UserCheck,
  UserMinus,
  UserX,
  QrCode,
  Clock,
  Users,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { LocalizedText, useLocalizedText } from "@/components/ui/localized-text";
import { Loading } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { SessionQrCode } from "@/components/admin/session-qr-code";
import type { ClassSession, Booking, BookingStatus } from "@/types/scheduling";

interface SessionAttendeesPanelProps {
  session: ClassSession | null;
  bookings: Booking[];
  isLoading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMember: () => void;
  onCheckIn: (bookingId: string) => Promise<void>;
  onMarkNoShow: (bookingId: string) => Promise<void>;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onStartSession: (sessionId: string) => Promise<void>;
  onCompleteSession: (sessionId: string) => Promise<void>;
  onCancelSession: (sessionId: string) => Promise<void>;
}

const texts = {
  en: {
    title: "Session Attendees",
    status: "Status",
    capacity: "Capacity",
    waitlist: "Waitlist",
    available: "available",
    attendees: "Attendees",
    waitlistTitle: "Waitlist",
    addMember: "Add Member",
    checkIn: "Check In",
    noShow: "No Show",
    remove: "Remove",
    promote: "Promote",
    showQrCode: "Show QR Code for Check-in",
    hideQrCode: "Hide QR Code",
    startSession: "Start Session",
    completeSession: "Complete Session",
    cancelSession: "Cancel Session",
    scheduled: "Scheduled",
    inProgress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    confirmed: "Confirmed",
    waitlisted: "Waitlisted",
    checkedIn: "Checked In",
    noShowed: "No Show",
    cancelledBooking: "Cancelled",
    noAttendees: "No attendees yet",
    noWaitlist: "No waitlist",
    confirmCancel: "Cancel Session?",
    confirmCancelDesc:
      "This will notify all booked members. This action cannot be undone.",
    confirmRemove: "Remove Booking?",
    confirmRemoveDesc: "This will remove the member from the session.",
    yes: "Yes",
    no: "No",
    success: "Success",
    error: "An error occurred",
    memberCheckedIn: "Member checked in",
    memberMarkedNoShow: "Member marked as no show",
    bookingCancelled: "Booking cancelled",
    sessionStarted: "Session started",
    sessionCompleted: "Session completed",
    sessionCancelled: "Session cancelled",
  },
  ar: {
    title: "حضور الجلسة",
    status: "الحالة",
    capacity: "السعة",
    waitlist: "قائمة الانتظار",
    available: "متاح",
    attendees: "الحضور",
    waitlistTitle: "قائمة الانتظار",
    addMember: "إضافة عضو",
    checkIn: "تسجيل الحضور",
    noShow: "لم يحضر",
    remove: "إزالة",
    promote: "ترقية",
    showQrCode: "عرض رمز QR للتسجيل",
    hideQrCode: "إخفاء رمز QR",
    startSession: "بدء الجلسة",
    completeSession: "إنهاء الجلسة",
    cancelSession: "إلغاء الجلسة",
    scheduled: "مجدول",
    inProgress: "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغى",
    confirmed: "مؤكد",
    waitlisted: "قائمة الانتظار",
    checkedIn: "حاضر",
    noShowed: "لم يحضر",
    cancelledBooking: "ملغى",
    noAttendees: "لا يوجد حضور بعد",
    noWaitlist: "لا توجد قائمة انتظار",
    confirmCancel: "إلغاء الجلسة؟",
    confirmCancelDesc:
      "سيتم إخطار جميع الأعضاء المحجوزين. لا يمكن التراجع عن هذا الإجراء.",
    confirmRemove: "إزالة الحجز؟",
    confirmRemoveDesc: "سيتم إزالة العضو من الجلسة.",
    yes: "نعم",
    no: "لا",
    success: "تم بنجاح",
    error: "حدث خطأ",
    memberCheckedIn: "تم تسجيل حضور العضو",
    memberMarkedNoShow: "تم تسجيل عدم حضور العضو",
    bookingCancelled: "تم إلغاء الحجز",
    sessionStarted: "بدأت الجلسة",
    sessionCompleted: "اكتملت الجلسة",
    sessionCancelled: "تم إلغاء الجلسة",
  },
};

// Status badge config
const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { color: string; icon: typeof UserCheck }
> = {
  CONFIRMED: { color: "bg-blue-100 text-blue-700", icon: Users },
  CHECKED_IN: { color: "bg-emerald-100 text-emerald-700", icon: UserCheck },
  WAITLISTED: { color: "bg-amber-100 text-amber-700", icon: Clock },
  NO_SHOW: { color: "bg-red-100 text-red-700", icon: UserX },
  CANCELLED: { color: "bg-slate-100 text-slate-500", icon: UserMinus },
};

function formatTime(time: string): string {
  const parts = time.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

export function SessionAttendeesPanel({
  session,
  bookings,
  isLoading = false,
  open,
  onOpenChange,
  onAddMember,
  onCheckIn,
  onMarkNoShow,
  onCancelBooking,
  onStartSession,
  onCompleteSession,
  onCancelSession,
}: SessionAttendeesPanelProps) {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const { toast } = useToast();

  const [showQrCode, setShowQrCode] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [removeBookingId, setRemoveBookingId] = useState<string | null>(null);

  if (!session) return null;

  // Separate confirmed/checked-in from waitlisted
  const confirmedBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN"
  );
  const waitlistBookings = bookings
    .filter((b) => b.status === "WAITLISTED")
    .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));

  const isFull = session.availableSpots === 0;
  const canCheckIn =
    session.status === "SCHEDULED" || session.status === "IN_PROGRESS";

  // Format session date
  const sessionDate = new Date(session.date);
  const dateFormatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      weekday: "long",
      month: "short",
      day: "numeric",
    }
  );

  const handleAction = async (
    actionId: string,
    action: () => Promise<void>,
    successMessage: string
  ) => {
    setActionLoading(actionId);
    try {
      await action();
      toast({ title: successMessage });
    } catch {
      toast({ title: t.error, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSession = async () => {
    setCancelDialogOpen(false);
    await handleAction(
      "cancel-session",
      () => onCancelSession(session.id),
      t.sessionCancelled
    );
  };

  const handleRemoveBooking = async () => {
    if (!removeBookingId) return;
    const bookingId = removeBookingId;
    setRemoveBookingId(null);
    await handleAction(
      `remove-${bookingId}`,
      () => onCancelBooking(bookingId),
      t.bookingCancelled
    );
  };

  const statusText = {
    SCHEDULED: t.scheduled,
    IN_PROGRESS: t.inProgress,
    COMPLETED: t.completed,
    CANCELLED: t.cancelled,
  }[session.status];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-lg">
                  <LocalizedText text={session.className} />
                </SheetTitle>
                <SheetDescription>
                  {dateFormatter.format(sessionDate)} •{" "}
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </SheetDescription>
              </div>
              <Badge
                className={cn(
                  session.status === "SCHEDULED" && "bg-sky-100 text-sky-700",
                  session.status === "IN_PROGRESS" && "bg-emerald-100 text-emerald-700",
                  session.status === "COMPLETED" && "bg-slate-100 text-slate-600",
                  session.status === "CANCELLED" && "bg-red-100 text-red-700"
                )}
              >
                {statusText}
              </Badge>
            </div>

            {/* Session stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-2xl font-bold">
                  {session.bookedCount}/{session.capacity}
                </p>
                <p className="text-xs text-muted-foreground">{t.capacity}</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-2xl font-bold">{session.availableSpots}</p>
                <p className="text-xs text-muted-foreground">{t.available}</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-2xl font-bold">{session.waitlistCount}</p>
                <p className="text-xs text-muted-foreground">{t.waitlist}</p>
              </div>
            </div>

            {/* Session actions */}
            {session.status !== "CANCELLED" && session.status !== "COMPLETED" && (
              <div className="flex flex-wrap gap-2">
                {session.status === "SCHEDULED" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      handleAction(
                        "start",
                        () => onStartSession(session.id),
                        t.sessionStarted
                      )
                    }
                    disabled={actionLoading === "start"}
                  >
                    {actionLoading === "start" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                    {t.startSession}
                  </Button>
                )}
                {session.status === "IN_PROGRESS" && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() =>
                      handleAction(
                        "complete",
                        () => onCompleteSession(session.id),
                        t.sessionCompleted
                      )
                    }
                    disabled={actionLoading === "complete"}
                  >
                    {actionLoading === "complete" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {t.completeSession}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <XCircle className="h-4 w-4" />
                  {t.cancelSession}
                </Button>
              </div>
            )}
          </SheetHeader>

          <Separator className="my-6" />

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Attendees section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t.attendees} ({confirmedBookings.length})
                  </h3>
                  {session.status !== "CANCELLED" &&
                    session.status !== "COMPLETED" && (
                      <Button size="sm" variant="outline" onClick={onAddMember}>
                        <UserPlus className="h-4 w-4" />
                        {t.addMember}
                      </Button>
                    )}
                </div>

                {confirmedBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t.noAttendees}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {confirmedBookings.map((booking) => {
                      const config = BOOKING_STATUS_CONFIG[booking.status];
                      const StatusIcon = config.icon;

                      return (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center",
                                config.color
                              )}
                            >
                              <StatusIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                <LocalizedText text={booking.memberName} />
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {booking.memberEmail}
                              </p>
                            </div>
                          </div>

                          {canCheckIn && booking.status === "CONFIRMED" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() =>
                                  handleAction(
                                    `checkin-${booking.id}`,
                                    () => onCheckIn(booking.id),
                                    t.memberCheckedIn
                                  )
                                }
                                disabled={actionLoading === `checkin-${booking.id}`}
                              >
                                {actionLoading === `checkin-${booking.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UserCheck className="h-3 w-3" />
                                )}
                                {t.checkIn}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  handleAction(
                                    `noshow-${booking.id}`,
                                    () => onMarkNoShow(booking.id),
                                    t.memberMarkedNoShow
                                  )
                                }
                                disabled={actionLoading === `noshow-${booking.id}`}
                              >
                                {actionLoading === `noshow-${booking.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UserX className="h-3 w-3" />
                                )}
                                {t.noShow}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-slate-600 hover:text-slate-700"
                                onClick={() => setRemoveBookingId(booking.id)}
                              >
                                <UserMinus className="h-3 w-3" />
                                {t.remove}
                              </Button>
                            </div>
                          )}

                          {booking.status === "CHECKED_IN" && (
                            <Badge variant="success" className="text-xs">
                              {t.checkedIn}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Waitlist section */}
              {waitlistBookings.length > 0 && (
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4" />
                    {t.waitlistTitle} ({waitlistBookings.length})
                  </h3>

                  <div className="space-y-2">
                    {waitlistBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-semibold">
                            #{booking.waitlistPosition}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              <LocalizedText text={booking.memberName} />
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.memberEmail}
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-slate-600 hover:text-slate-700"
                          onClick={() => setRemoveBookingId(booking.id)}
                        >
                          <UserMinus className="h-3 w-3" />
                          {t.remove}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QR Code section */}
              {canCheckIn && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowQrCode(!showQrCode)}
                  >
                    <QrCode className="h-4 w-4" />
                    {showQrCode ? t.hideQrCode : t.showQrCode}
                  </Button>

                  {showQrCode && (
                    <div className="mt-4">
                      <SessionQrCode sessionId={session.id} locale={locale} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Session Confirmation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmCancel}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmCancelDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.no}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.yes}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Booking Confirmation */}
      <AlertDialog
        open={!!removeBookingId}
        onOpenChange={(open) => !open && setRemoveBookingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmRemove}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmRemoveDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.no}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.yes}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
