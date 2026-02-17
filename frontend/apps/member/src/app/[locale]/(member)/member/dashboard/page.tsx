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
import { WalletBalanceCard } from "@/components/member/wallet-balance";
import {
  useMyProfile,
  useMySubscription,
  useMyUpcomingBookings,
  useMyWallet,
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
  const { data: wallet, isLoading: walletLoading } = useMyWallet();

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
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">
          {t("welcome")}, {displayName}!
        </h1>
        <p className="text-white/90">{t("quickLook")}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`/${locale}/member/qr`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                <QrCode className="h-6 w-6" />
              </div>
              <p className="font-medium text-sm">{t("quickCheckIn")}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/member/bookings/new`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                <Calendar className="h-6 w-6" />
              </div>
              <p className="font-medium text-sm">{t("bookClass")}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/member/subscriptions`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <CreditCard className="h-6 w-6" />
              </div>
              <p className="font-medium text-sm">{t("viewSubscriptions")}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/member/payments`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 mx-auto bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
                <Receipt className="h-6 w-6" />
              </div>
              <p className="font-medium text-sm">
                {locale === "ar" ? "الفواتير" : "Invoices"}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Subscription card - takes 2 columns on large screens */}
        <div className="lg:col-span-2">
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
        </div>

        {/* Wallet card */}
        <div>
          {walletLoading ? (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-40" />
              </CardContent>
            </Card>
          ) : (
            <WalletBalanceCard wallet={wallet} />
          )}
        </div>
      </div>

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
              <Dumbbell className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
              <p className="text-neutral-500 mb-4">{t("noUpcomingBookings")}</p>
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
