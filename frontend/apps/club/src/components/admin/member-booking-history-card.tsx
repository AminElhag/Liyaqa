"use client";

import { useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useMemberBookings } from "@liyaqa/shared/queries";
import { formatDate } from "@liyaqa/shared/utils";
import type { UUID } from "@liyaqa/shared/types/api";
import type { BookingPaymentSource } from "@liyaqa/shared/types/scheduling";

interface MemberBookingHistoryCardProps {
  memberId: UUID;
  locale: string;
}

const texts = {
  en: {
    title: "Class History",
    noBookings: "No class bookings yet",
    noBookingsDesc: "Bookings will appear here when the member books a class",
    page: "Page",
    of: "of",
    MEMBERSHIP_INCLUDED: "Membership",
    CLASS_PACK: "Class Pack",
    PAY_PER_ENTRY: "Pay Per Entry",
    COMPLIMENTARY: "Complimentary",
  },
  ar: {
    title: "سجل الحصص",
    noBookings: "لا توجد حجوزات حصص بعد",
    noBookingsDesc: "ستظهر الحجوزات هنا عندما يحجز العضو حصة",
    page: "صفحة",
    of: "من",
    MEMBERSHIP_INCLUDED: "عضوية",
    CLASS_PACK: "باقة حصص",
    PAY_PER_ENTRY: "دفع لكل حصة",
    COMPLIMENTARY: "مجاني",
  },
};

function getPaymentSourceVariant(source: BookingPaymentSource): "success" | "info" | "warning" | "secondary" {
  switch (source) {
    case "MEMBERSHIP_INCLUDED":
      return "success";
    case "CLASS_PACK":
      return "info";
    case "PAY_PER_ENTRY":
      return "warning";
    case "COMPLIMENTARY":
      return "secondary";
    default:
      return "secondary";
  }
}

export function MemberBookingHistoryCard({ memberId, locale }: MemberBookingHistoryCardProps) {
  const t = texts[locale as "en" | "ar"] || texts.en;
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data, isLoading } = useMemberBookings(memberId, {
    page,
    size: pageSize,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loading />
        </CardContent>
      </Card>
    );
  }

  const bookings = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarCheck className="h-5 w-5" />
          {t.title}
          {totalElements > 0 && (
            <Badge variant="secondary" className="ms-1 font-normal">
              {totalElements}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>{t.noBookings}</p>
            <p className="text-sm mt-1">{t.noBookingsDesc}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-medium truncate">
                    <LocalizedText text={booking.className} />
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span>{formatDate(booking.sessionDate, locale)}</span>
                    {booking.sessionTime && (
                      <span>{booking.sessionTime}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ms-4">
                  {booking.paymentSource && (
                    <Badge variant={getPaymentSourceVariant(booking.paymentSource)}>
                      {t[booking.paymentSource as keyof typeof t] || booking.paymentSource}
                    </Badge>
                  )}
                  <StatusBadge status={booking.status} locale={locale} />
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {t.page} {page + 1} {t.of} {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
