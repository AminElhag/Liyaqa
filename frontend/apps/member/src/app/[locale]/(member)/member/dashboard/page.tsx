"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Calendar,
  CreditCard,
  Receipt,
  QrCode,
  ChevronRight,
  Dumbbell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { SubscriptionCard } from "@/components/member/subscription-card";
import { BookingCard } from "@/components/member/booking-card";
import {
  useMyProfile,
  useMySubscription,
  useMyUpcomingBookings,
  useCancelMyBooking,
} from "@liyaqa/shared/queries/use-member-portal";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { toast } from "sonner";

export default function MemberDashboardPage() {
  const t = useTranslations("member.home");
  const locale = useLocale();
  const { user } = useAuthStore();

  const { data: profile } = useMyProfile();
  const { data: subscriptionData, isLoading: subscriptionLoading } = useMySubscription();
  const { data: bookingsData, isLoading: bookingsLoading } = useMyUpcomingBookings({ size: 3 });

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

  const displayName =
    profile?.fullName ||
    (locale === "ar"
      ? user?.displayName?.ar || user?.displayName?.en
      : user?.displayName?.en);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl p-6 shadow-sm overflow-hidden">
        <h1 className="text-2xl font-bold mb-2">
          {t("welcome")}, {displayName}!
        </h1>
        <p className="text-white/90">{t("quickLook")}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`/${locale}/member/qr`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("quickCheckIn")}</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "تسجيل الحضور" : "Scan to check in"}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/member/bookings/new`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("bookClass")}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "احجز صفك القادم" : "Book your next class"}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/member/subscriptions`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("viewSubscriptions")}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "إدارة اشتراكك" : "Manage subscription"}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/member/payments`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === "ar" ? "الفواتير" : "Invoices"}
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "عرض الفواتير" : "View invoices"}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Subscription card */}
      {subscriptionLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : (
        <SubscriptionCard
          subscription={subscriptionData?.subscription}
          hasSubscription={subscriptionData?.hasSubscription ?? false}
        />
      )}

      {/* Upcoming bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            {t("upcomingBookings")}
          </CardTitle>
          <Link href={`/${locale}/member/bookings`}>
            <Button variant="ghost" size="sm" className="gap-1">
              {locale === "ar" ? "عرض الكل" : "View All"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : bookingsData?.items && bookingsData.items.length > 0 ? (
            <div className="space-y-4">
              {bookingsData.items.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={(id) => cancelBookingMutation.mutate(id)}
                  isCancelling={cancelBookingMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{t("noUpcomingBookings")}</p>
              <Link href={`/${locale}/member/bookings/new`}>
                <Button>{t("bookNow")}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
