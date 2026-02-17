"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, Plus, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { BookingCard } from "@/components/member/booking-card";
import {
  useMyUpcomingBookings,
  useMyPastBookings,
  useCancelMyBooking,
} from "@liyaqa/shared/queries/use-member-portal";
import { toast } from "sonner";

export default function BookingsPage() {
  const t = useTranslations("member.bookings");
  const locale = useLocale();
  const [activeTab, setActiveTab] = React.useState("upcoming");

  const {
    data: upcomingData,
    isLoading: upcomingLoading,
  } = useMyUpcomingBookings({ size: 10 });

  const {
    data: pastData,
    isLoading: pastLoading,
  } = useMyPastBookings({ size: 20 });

  const cancelBookingMutation = useCancelMyBooking({
    onSuccess: () => {
      toast.success(
        locale === "ar" ? "تم إلغاء الحجز بنجاح" : "Booking cancelled successfully"
      );
    },
    onError: () => {
      toast.error(
        locale === "ar" ? "فشل في إلغاء الحجز" : "Failed to cancel booking"
      );
    },
  });

  const upcomingBookings = upcomingData?.items ?? [];
  const pastBookings = pastData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-neutral-500">{t("subtitle")}</p>
        </div>
        <Link href={`/${locale}/member/bookings/new`}>
          <Button>
            <Plus className="h-4 w-4 me-2" />
            {t("bookClass")}
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="h-4 w-4" />
            {t("upcoming")}
            {upcomingBookings.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                {upcomingBookings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">{t("past")}</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={(id) => cancelBookingMutation.mutate(id)}
                  isCancelling={cancelBookingMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Dumbbell className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("noUpcoming")}</h3>
                <p className="text-neutral-500 mb-6">
                  {locale === "ar"
                    ? "لم تقم بحجز أي صفوف بعد"
                    : "You haven't booked any classes yet"}
                </p>
                <Link href={`/${locale}/member/bookings/new`}>
                  <Button>
                    <Plus className="h-4 w-4 me-2" />
                    {t("bookClass")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : pastBookings.length > 0 ? (
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  showCancelButton={false}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Calendar className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {locale === "ar" ? "لا توجد حجوزات سابقة" : "No Past Bookings"}
                </h3>
                <p className="text-neutral-500">
                  {locale === "ar"
                    ? "لم تحضر أي صفوف بعد"
                    : "You haven't attended any classes yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
