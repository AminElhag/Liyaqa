"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";
import {
  Calendar,
  Edit,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";

import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  useFacility,
  useFacilitySlots,
  useGenerateSlots,
} from "@liyaqa/shared/queries/use-facilities";
import { useLocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { BookingManageDialog } from "@/components/facilities";
import type { FacilitySlot, SlotStatus, OperatingHours } from "@liyaqa/shared/types/facility";

const DAY_NAMES: Record<number, { en: string; ar: string }> = {
  1: { en: "Mon", ar: "الاثنين" },
  2: { en: "Tue", ar: "الثلاثاء" },
  3: { en: "Wed", ar: "الأربعاء" },
  4: { en: "Thu", ar: "الخميس" },
  5: { en: "Fri", ar: "الجمعة" },
  6: { en: "Sat", ar: "السبت" },
  7: { en: "Sun", ar: "الأحد" },
};

const slotStatusConfig: Record<SlotStatus, { color: string; labelEn: string; labelAr: string }> = {
  AVAILABLE: { color: "bg-green-100 text-green-800 hover:bg-green-200", labelEn: "Available", labelAr: "متاح" },
  BOOKED: { color: "bg-blue-100 text-blue-800 hover:bg-blue-200", labelEn: "Booked", labelAr: "محجوز" },
  BLOCKED: { color: "bg-gray-100 text-gray-800", labelEn: "Blocked", labelAr: "محظور" },
  MAINTENANCE: { color: "bg-orange-100 text-orange-800", labelEn: "Maintenance", labelAr: "صيانة" },
};

export default function FacilityDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const facilityId = params.id as string;

  const [weekOffset, setWeekOffset] = useState(0);
  const [managedSlot, setManagedSlot] = useState<FacilitySlot | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 0 });

  const { data: facility, isLoading: facilityLoading } = useFacility(facilityId);
  const { data: slots, isLoading: slotsLoading } = useFacilitySlots(facilityId, {
    startDate: format(weekStart, "yyyy-MM-dd"),
    endDate: format(addDays(weekStart, 6), "yyyy-MM-dd"),
  });

  const generateSlotsMutation = useGenerateSlots();

  const name = useLocalizedText(facility?.name);
  const description = useLocalizedText(facility?.description);

  const hasOperatingHours =
    facility?.operatingHours &&
    facility.operatingHours.some((h) => !h.isClosed);

  const handleGenerateSlots = () => {
    if (!hasOperatingHours) {
      toast.warning(
        locale === "ar"
          ? "يرجى تعيين ساعات العمل أولاً من صفحة التعديل"
          : "Please configure operating hours first via the Edit page"
      );
      return;
    }

    const startDate = format(weekStart, "yyyy-MM-dd");
    const endDate = format(addDays(weekStart, 13), "yyyy-MM-dd");

    generateSlotsMutation.mutate(
      { facilityId, data: { startDate, endDate } },
      {
        onSuccess: (generated) => {
          if (generated.length === 0) {
            toast.info(
              locale === "ar"
                ? "لم يتم إنشاء فترات جديدة — قد تكون الفترات موجودة بالفعل أو جميع الأيام مغلقة"
                : "No new slots generated — slots may already exist for these dates or all days are marked closed"
            );
          } else {
            toast.success(
              locale === "ar"
                ? `تم إنشاء ${generated.length} فترة زمنية`
                : `Generated ${generated.length} slots`
            );
          }
        },
        onError: () => {
          toast.error(
            locale === "ar"
              ? "فشل في إنشاء الفترات الزمنية"
              : "Failed to generate slots"
          );
        },
      }
    );
  };

  if (facilityLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {locale === "ar" ? "المرفق غير موجود" : "Facility not found"}
        </p>
      </div>
    );
  }

  // Group slots by date
  const slotsByDate = (slots || []).reduce<Record<string, FacilitySlot[]>>(
    (acc, slot) => {
      if (!acc[slot.slotDate]) {
        acc[slot.slotDate] = [];
      }
      acc[slot.slotDate].push(slot);
      return acc;
    },
    {}
  );

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/facilities/${facilityId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              {locale === "ar" ? "تعديل" : "Edit"}
            </Button>
          </Link>
          <Link href={`/${locale}/facilities/${facilityId}/bookings`}>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              {locale === "ar" ? "الحجوزات" : "Bookings"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{facility.capacity}</p>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "السعة" : "Capacity"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{facility.minBookingMinutes}</p>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "دقيقة/حجز" : "min/booking"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{facility.bookingWindowDays}</p>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "أيام مقدماً" : "days ahead"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {facility.requiresSubscription ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {locale === "ar" ? "يتطلب اشتراك" : "Requires Subscription"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {facility.requiresSubscription
                    ? locale === "ar"
                      ? "نعم"
                      : "Yes"
                    : locale === "ar"
                    ? "لا"
                    : "No"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {locale === "ar" ? "ساعات العمل" : "Operating Hours"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!facility.operatingHours?.length ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {locale === "ar"
                  ? "لم يتم تعيين ساعات العمل بعد. يرجى تعديل المرفق لإضافتها."
                  : "No operating hours configured. Edit the facility to add them."}
              </p>
              <Link href={`/${locale}/facilities/${facilityId}/edit`}>
                <Button variant="link" size="sm" className="mt-2">
                  {locale === "ar" ? "تعديل المرفق" : "Edit Facility"}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              {facility.operatingHours
                .sort((a, b) => {
                  const order = [7, 1, 2, 3, 4, 5, 6];
                  return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
                })
                .map((h) => {
                  const dayName = DAY_NAMES[h.dayOfWeek];
                  return (
                    <div
                      key={h.dayOfWeek}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                        h.isClosed ? "opacity-50" : ""
                      }`}
                    >
                      <span className="font-medium">
                        {locale === "ar" ? dayName?.ar : dayName?.en}
                      </span>
                      {h.isClosed ? (
                        <Badge variant="secondary">
                          {locale === "ar" ? "مغلق" : "Closed"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          {h.openTime.slice(0, 5)} — {h.closeTime.slice(0, 5)}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {locale === "ar" ? "الفترات الزمنية" : "Time Slots"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekOffset((w) => w - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[200px] text-center">
                {format(weekStart, "MMM d", {
                  locale: locale === "ar" ? ar : enUS,
                })}{" "}
                -{" "}
                {format(addDays(weekStart, 6), "MMM d, yyyy", {
                  locale: locale === "ar" ? ar : enUS,
                })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekOffset((w) => w + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateSlots}
                disabled={generateSlotsMutation.isPending}
              >
                {generateSlotsMutation.isPending
                  ? locale === "ar"
                    ? "جارٍ الإنشاء..."
                    : "Generating..."
                  : locale === "ar"
                  ? "إنشاء الفترات"
                  : "Generate Slots"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {slotsLoading ? (
            <div className="grid grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const daySlots = slotsByDate[dateStr] || [];

                return (
                  <div key={dateStr} className="space-y-2">
                    <div className="text-center p-2 bg-muted rounded-t-lg">
                      <p className="font-medium">
                        {format(day, "EEE", {
                          locale: locale === "ar" ? ar : enUS,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(day, "d")}
                      </p>
                    </div>
                    <div className="space-y-1 min-h-[200px] max-h-[400px] overflow-y-auto">
                      {daySlots.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          {locale === "ar" ? "لا توجد فترات" : "No slots"}
                        </p>
                      ) : (
                        daySlots
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((slot) => {
                            const config = slotStatusConfig[slot.status];
                            const isClickable = slot.status === "AVAILABLE" || (slot.status === "BOOKED" && !!slot.booking);
                            return (
                              <div
                                key={slot.id}
                                className={`text-xs p-2 rounded transition-colors ${config.color} ${
                                  isClickable ? "cursor-pointer" : ""
                                }`}
                                onClick={() => {
                                  if (slot.status === "BOOKED" && slot.booking) {
                                    setManagedSlot(slot);
                                    setManageDialogOpen(true);
                                  }
                                }}
                              >
                                <p className="font-medium">
                                  {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                </p>
                                {slot.status === "BOOKED" && slot.booking && (
                                  <p className="text-[10px] opacity-75 truncate mt-0.5">
                                    {slot.booking.memberId.slice(0, 8)}...
                                  </p>
                                )}
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4 border-t">
            {Object.entries(slotStatusConfig).map(([status, config]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${config.color.split(" ")[0]}`} />
                <span className="text-xs">
                  {locale === "ar" ? config.labelAr : config.labelEn}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Booking Manage Dialog */}
      <BookingManageDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        slot={managedSlot}
        facilityId={facilityId}
        facilityName={name}
      />
    </div>
  );
}
