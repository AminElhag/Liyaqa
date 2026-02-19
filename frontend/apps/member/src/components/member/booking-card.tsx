"use client";

import { useLocale, useTranslations } from "next-intl";
import { Calendar, Clock, MapPin, User, X, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@liyaqa/shared/components/ui/alert-dialog";
import { cn } from "@liyaqa/shared/utils";
import type { BookingLite } from "@liyaqa/shared/types/member-portal";
import type { BookingStatus } from "@liyaqa/shared/types/scheduling";

interface BookingCardProps {
  booking: BookingLite;
  onCancel?: (bookingId: string) => void;
  isCancelling?: boolean;
  showCancelButton?: boolean;
  className?: string;
}

export function BookingCard({
  booking,
  onCancel,
  isCancelling = false,
  showCancelButton = true,
  className,
}: BookingCardProps) {
  const t = useTranslations("member.bookings");
  const locale = useLocale();

  const className_ =
    locale === "ar"
      ? booking.className?.ar || booking.className?.en
      : booking.className?.en;

  const trainerName =
    locale === "ar"
      ? booking.trainerName?.ar || booking.trainerName?.en
      : booking.trainerName?.en;

  const locationName =
    locale === "ar"
      ? booking.locationName?.ar || booking.locationName?.en
      : booking.locationName?.en;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string | undefined | null) => {
    if (!timeStr) return "\u2014";
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: BookingStatus) => {
    const statusMap: Record<BookingStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ReactNode }> = {
      CONFIRMED: {
        variant: "default",
        label: locale === "ar" ? "مؤكد" : "Confirmed",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      WAITLISTED: {
        variant: "secondary",
        label: locale === "ar" ? "قائمة الانتظار" : "Waitlisted",
        icon: <AlertCircle className="h-3 w-3" />,
      },
      CANCELLED: {
        variant: "destructive",
        label: locale === "ar" ? "ملغي" : "Cancelled",
        icon: <X className="h-3 w-3" />,
      },
      CHECKED_IN: {
        variant: "default",
        label: locale === "ar" ? "تم الحضور" : "Checked In",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      NO_SHOW: {
        variant: "outline",
        label: locale === "ar" ? "لم يحضر" : "No Show",
        icon: <AlertCircle className="h-3 w-3" />,
      },
      COMPLETED: {
        variant: "default",
        label: locale === "ar" ? "مكتمل" : "Completed",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
    };
    const { variant, label, icon } = statusMap[status];
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  const canCancel =
    booking.status === "CONFIRMED" || booking.status === "WAITLISTED";

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="font-semibold">{className_}</h3>
        <div className="flex items-center gap-2">
          {booking.waitlistPosition && booking.status === "WAITLISTED" && (
            <Badge variant="outline">
              {t("waitlistPosition")}: #{booking.waitlistPosition}
            </Badge>
          )}
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(booking.sessionDate)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatTime(booking.sessionStartTime)} -{" "}
            {formatTime(booking.sessionEndTime)}
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
        </div>

        {/* Actions */}
        {showCancelButton && canCancel && onCancel && (
          <div className="pt-3 border-t flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger hover:text-danger"
                  disabled={isCancelling}
                >
                  <X className="h-4 w-4 me-1" />
                  {t("cancel")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {locale === "ar" ? "إلغاء الحجز" : "Cancel Booking"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {locale === "ar"
                      ? `هل أنت متأكد من إلغاء حجز "${className_}"؟ لا يمكن التراجع عن هذا الإجراء.`
                      : `Are you sure you want to cancel your booking for "${className_}"? This action cannot be undone.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {locale === "ar" ? "لا، احتفظ بالحجز" : "No, keep booking"}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onCancel(booking.id)}
                    className="bg-danger hover:bg-danger/90"
                  >
                    {locale === "ar" ? "نعم، إلغاء الحجز" : "Yes, cancel booking"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
