"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  User,
  Clock,
  MapPin,
  UserCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { LocalizedText } from "@/components/ui/localized-text";
import { Badge } from "@/components/ui/badge";
import {
  useBooking,
  useCancelBooking,
  useCheckInBooking,
  useMarkNoShow,
} from "@/queries/use-bookings";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatTime } from "@/lib/utils";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const { data: booking, isLoading, error } = useBooking(id);
  const cancelBooking = useCancelBooking();
  const checkInBooking = useCheckInBooking();
  const markNoShow = useMarkNoShow();

  const texts = {
    back: locale === "ar" ? "العودة للحجوزات" : "Back to Bookings",
    notFound: locale === "ar" ? "لم يتم العثور على الحجز" : "Booking not found",
    bookingDetails: locale === "ar" ? "تفاصيل الحجز" : "Booking Details",
    member: locale === "ar" ? "العضو" : "Member",
    session: locale === "ar" ? "الجلسة" : "Session",
    class: locale === "ar" ? "الفصل" : "Class",
    date: locale === "ar" ? "التاريخ" : "Date",
    time: locale === "ar" ? "الوقت" : "Time",
    status: locale === "ar" ? "الحالة" : "Status",
    waitlistPosition: locale === "ar" ? "موقع قائمة الانتظار" : "Waitlist Position",
    checkedInAt: locale === "ar" ? "وقت تسجيل الحضور" : "Checked In At",
    cancelledAt: locale === "ar" ? "وقت الإلغاء" : "Cancelled At",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created At",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    checkIn: locale === "ar" ? "تسجيل الحضور" : "Check In",
    cancel: locale === "ar" ? "إلغاء الحجز" : "Cancel Booking",
    markNoShow: locale === "ar" ? "تحديد لم يحضر" : "Mark No Show",
    viewMember: locale === "ar" ? "عرض العضو" : "View Member",
    viewSession: locale === "ar" ? "عرض الجلسة" : "View Session",
    confirmCancel:
      locale === "ar"
        ? "هل أنت متأكد من إلغاء هذا الحجز؟"
        : "Are you sure you want to cancel this booking?",
    cancelSuccess: locale === "ar" ? "تم إلغاء الحجز" : "Booking cancelled",
    checkInSuccess: locale === "ar" ? "تم تسجيل الحضور" : "Checked in successfully",
    noShowSuccess: locale === "ar" ? "تم تحديد عدم الحضور" : "Marked as no-show",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };

  const handleCheckIn = async () => {
    try {
      await checkInBooking.mutateAsync(id);
      toast({
        title: texts.checkInSuccess,
      });
    } catch {
      toast({
        title: texts.errorTitle,
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    if (!confirm(texts.confirmCancel)) return;
    try {
      await cancelBooking.mutateAsync(id);
      toast({
        title: texts.cancelSuccess,
      });
    } catch {
      toast({
        title: texts.errorTitle,
        variant: "destructive",
      });
    }
  };

  const handleMarkNoShow = async () => {
    try {
      await markNoShow.mutateAsync(id);
      toast({
        title: texts.noShowSuccess,
      });
    } catch {
      toast({
        title: texts.errorTitle,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/bookings`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>{texts.notFound}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/bookings`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
              <Calendar className="h-6 w-6" />
              {texts.bookingDetails}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={booking.status} locale={locale} />
              {booking.waitlistPosition && (
                <Badge variant="warning" className="text-xs">
                  #{booking.waitlistPosition}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking Info */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.bookingDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Member */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-neutral-400 mt-0.5" />
              <div>
                <p className="text-sm text-neutral-500">{texts.member}</p>
                <Link
                  href={`/${locale}/members/${booking.memberId}`}
                  className="font-medium hover:underline text-primary"
                >
                  <LocalizedText text={booking.memberName} />
                </Link>
                <p className="text-sm text-muted-foreground">
                  {booking.memberEmail}
                </p>
              </div>
            </div>

            {/* Class */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-neutral-400 mt-0.5" />
              <div>
                <p className="text-sm text-neutral-500">{texts.class}</p>
                <p className="font-medium">
                  <LocalizedText text={booking.className} />
                </p>
              </div>
            </div>

            {/* Session Date & Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-neutral-400 mt-0.5" />
              <div>
                <p className="text-sm text-neutral-500">{texts.date}</p>
                <Link
                  href={`/${locale}/sessions/${booking.sessionId}`}
                  className="font-medium hover:underline text-primary"
                >
                  {formatDate(booking.sessionDate, locale)}
                </Link>
                <p className="text-sm text-muted-foreground font-mono">
                  {booking.sessionTime}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-neutral-400 mt-0.5" />
              <div>
                <p className="text-sm text-neutral-500">{texts.status}</p>
                <StatusBadge status={booking.status} locale={locale} />
              </div>
            </div>

            {/* Waitlist Position */}
            {booking.waitlistPosition && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-500">{texts.waitlistPosition}</p>
                  <p className="font-medium">#{booking.waitlistPosition}</p>
                </div>
              </div>
            )}

            {/* Checked In At */}
            {booking.checkedInAt && (
              <div className="flex items-start gap-3">
                <UserCheck className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-500">{texts.checkedInAt}</p>
                  <p className="font-medium">
                    {formatDate(booking.checkedInAt, locale)}{" "}
                    {formatTime(booking.checkedInAt, locale)}
                  </p>
                </div>
              </div>
            )}

            {/* Cancelled At */}
            {booking.cancelledAt && (
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-500">{texts.cancelledAt}</p>
                  <p className="font-medium">
                    {formatDate(booking.cancelledAt, locale)}{" "}
                    {formatTime(booking.cancelledAt, locale)}
                  </p>
                </div>
              </div>
            )}

            {/* Created At */}
            <div className="pt-2 border-t">
              <p className="text-xs text-neutral-500">
                {texts.createdAt}: {formatDate(booking.createdAt, locale)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.actions}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Quick links */}
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/${locale}/members/${booking.memberId}`}>
                <User className="h-4 w-4 me-2" />
                {texts.viewMember}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/${locale}/sessions/${booking.sessionId}`}>
                <Calendar className="h-4 w-4 me-2" />
                {texts.viewSession}
              </Link>
            </Button>

            {/* Status Actions */}
            {booking.status === "CONFIRMED" && (
              <>
                <div className="pt-2 border-t" />
                <Button
                  className="w-full justify-start"
                  onClick={handleCheckIn}
                  disabled={checkInBooking.isPending}
                >
                  <UserCheck className="h-4 w-4 me-2" />
                  {texts.checkIn}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleCancel}
                  disabled={cancelBooking.isPending}
                >
                  <XCircle className="h-4 w-4 me-2" />
                  {texts.cancel}
                </Button>
              </>
            )}

            {(booking.status === "CONFIRMED" || booking.status === "CHECKED_IN") && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleMarkNoShow}
                disabled={markNoShow.isPending}
              >
                <AlertCircle className="h-4 w-4 me-2" />
                {texts.markNoShow}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
