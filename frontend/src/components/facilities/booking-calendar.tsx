"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
  parseISO,
  addDays,
} from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFacilitySlots, useCreateBooking, useCancelBooking } from "@/queries/use-facilities";
import { useMembers } from "@/queries/use-members";
import type { UUID } from "@/types/api";
import type { FacilitySlot, FacilityBooking } from "@/types/facility";

type ViewMode = "week" | "day";

interface BookingCalendarProps {
  facilityId: UUID;
  facilityName?: string;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 9 PM

export function BookingCalendar({ facilityId, facilityName }: BookingCalendarProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dateLocale = locale === "ar" ? ar : enUS;

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<ViewMode>("week");
  const [selectedSlot, setSelectedSlot] = React.useState<FacilitySlot | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = React.useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: slots, isLoading } = useFacilitySlots(facilityId, {
    startDate: format(viewMode === "week" ? weekStart : currentDate, "yyyy-MM-dd"),
    endDate: format(viewMode === "week" ? weekEnd : currentDate, "yyyy-MM-dd"),
  });

  const texts = {
    title: isRtl ? "تقويم الحجوزات" : "Booking Calendar",
    today: isRtl ? "اليوم" : "Today",
    week: isRtl ? "أسبوع" : "Week",
    day: isRtl ? "يوم" : "Day",
    available: isRtl ? "متاح" : "Available",
    booked: isRtl ? "محجوز" : "Booked",
    maintenance: isRtl ? "صيانة" : "Maintenance",
    bookSlot: isRtl ? "حجز الفترة" : "Book Slot",
    selectMember: isRtl ? "اختر العضو" : "Select Member",
    cancel: isRtl ? "إلغاء" : "Cancel",
    confirm: isRtl ? "تأكيد الحجز" : "Confirm Booking",
    noSlots: isRtl ? "لا توجد فترات متاحة" : "No slots available",
  };

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSlotClick = (slot: FacilitySlot) => {
    if (slot.status === "AVAILABLE") {
      setSelectedSlot(slot);
      setBookingDialogOpen(true);
    }
  };

  const getSlotForDayAndHour = (day: Date, hour: number) => {
    if (!slots) return null;
    return slots.find((slot) => {
      const slotDate = parseISO(slot.startTime);
      return isSameDay(slotDate, day) && slotDate.getHours() === hour;
    });
  };

  const getSlotStyle = (slot: FacilitySlot | null | undefined) => {
    if (!slot) return "bg-muted/30";
    switch (slot.status) {
      case "AVAILABLE":
        return "bg-green-100 hover:bg-green-200 cursor-pointer border-green-300";
      case "BOOKED":
        return "bg-blue-100 border-blue-300";
      case "MAINTENANCE":
        return "bg-orange-100 border-orange-300";
      default:
        return "bg-muted/30";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className={cn("flex items-center justify-between flex-wrap gap-4", isRtl && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={handleToday}>
            {texts.today}
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold ms-2">
            {viewMode === "week"
              ? `${format(weekStart, "MMM d", { locale: dateLocale })} - ${format(weekEnd, "MMM d, yyyy", { locale: dateLocale })}`
              : format(currentDate, "EEEE, MMMM d, yyyy", { locale: dateLocale })}
          </h2>
        </div>

        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
            <span className="h-3 w-3 rounded-sm bg-green-200 border border-green-300" />
            <span>{texts.available}</span>
            <span className="h-3 w-3 rounded-sm bg-blue-200 border border-blue-300 ms-2" />
            <span>{texts.booked}</span>
          </div>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{texts.week}</SelectItem>
              <SelectItem value="day">{texts.day}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0 overflow-auto">
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className={cn(
              "grid border-b",
              viewMode === "week" ? "grid-cols-8" : "grid-cols-2"
            )}>
              <div className="p-2 text-center text-sm font-medium text-muted-foreground border-e">
                {isRtl ? "الوقت" : "Time"}
              </div>
              {viewMode === "week" ? (
                daysInWeek.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-2 text-center border-e last:border-e-0",
                      isToday(day) && "bg-primary/10"
                    )}
                  >
                    <div className="text-xs text-muted-foreground">
                      {format(day, "EEE", { locale: dateLocale })}
                    </div>
                    <div className={cn(
                      "text-sm font-medium",
                      isToday(day) && "text-primary"
                    )}>
                      {format(day, "d")}
                    </div>
                  </div>
                ))
              ) : (
                <div className={cn(
                  "p-2 text-center",
                  isToday(currentDate) && "bg-primary/10"
                )}>
                  <div className="text-xs text-muted-foreground">
                    {format(currentDate, "EEEE", { locale: dateLocale })}
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    isToday(currentDate) && "text-primary"
                  )}>
                    {format(currentDate, "MMMM d", { locale: dateLocale })}
                  </div>
                </div>
              )}
            </div>

            {/* Time Slots */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className={cn(
                  "grid border-b last:border-b-0",
                  viewMode === "week" ? "grid-cols-8" : "grid-cols-2"
                )}
              >
                <div className="p-2 text-center text-sm text-muted-foreground border-e flex items-center justify-center">
                  {format(new Date().setHours(hour, 0), "h a")}
                </div>
                {viewMode === "week" ? (
                  daysInWeek.map((day) => {
                    const slot = getSlotForDayAndHour(day, hour);
                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        onClick={() => slot && handleSlotClick(slot)}
                        className={cn(
                          "p-1 border-e last:border-e-0 min-h-[60px] transition-colors",
                          getSlotStyle(slot)
                        )}
                      >
                        {slot?.status === "BOOKED" && slot.booking && (
                          <div className="text-xs p-1 bg-blue-500 text-white rounded truncate">
                            <User className="h-3 w-3 inline me-1" />
                            {slot.booking.memberId?.slice(0, 8)}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div
                    onClick={() => {
                      const slot = getSlotForDayAndHour(currentDate, hour);
                      if (slot) handleSlotClick(slot);
                    }}
                    className={cn(
                      "p-2 min-h-[60px] transition-colors",
                      getSlotStyle(getSlotForDayAndHour(currentDate, hour))
                    )}
                  >
                    {(() => {
                      const slot = getSlotForDayAndHour(currentDate, hour);
                      if (slot?.status === "BOOKED" && slot.booking) {
                        return (
                          <div className="text-sm p-2 bg-blue-500 text-white rounded">
                            <User className="h-4 w-4 inline me-2" />
                            Member #{slot.booking.memberId?.slice(0, 8)}
                          </div>
                        );
                      }
                      if (slot?.status === "AVAILABLE") {
                        return (
                          <div className="text-sm text-green-700 p-2">
                            <Check className="h-4 w-4 inline me-1" />
                            {texts.available}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        slot={selectedSlot}
        facilityId={facilityId}
        facilityName={facilityName}
      />
    </div>
  );
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: FacilitySlot | null;
  facilityId: UUID;
  facilityName?: string;
}

function BookingDialog({ open, onOpenChange, slot, facilityId, facilityName }: BookingDialogProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dateLocale = locale === "ar" ? ar : enUS;

  const [selectedMemberId, setSelectedMemberId] = React.useState<string>("");
  const [memberSearch, setMemberSearch] = React.useState("");

  const { data: membersData } = useMembers({ search: memberSearch, page: 0, size: 10 });
  const createBookingMutation = useCreateBooking();

  const texts = {
    title: isRtl ? "حجز فترة" : "Book Slot",
    description: isRtl
      ? `حجز فترة في ${facilityName || "المرفق"}`
      : `Book a slot at ${facilityName || "facility"}`,
    date: isRtl ? "التاريخ" : "Date",
    time: isRtl ? "الوقت" : "Time",
    member: isRtl ? "العضو" : "Member",
    searchMember: isRtl ? "ابحث عن عضو..." : "Search for a member...",
    cancel: isRtl ? "إلغاء" : "Cancel",
    confirm: isRtl ? "تأكيد الحجز" : "Confirm Booking",
    booking: isRtl ? "جاري الحجز..." : "Booking...",
  };

  const handleConfirm = async () => {
    if (!slot || !selectedMemberId) return;

    try {
      await createBookingMutation.mutateAsync({
        facilityId,
        data: {
          memberId: selectedMemberId,
          slotId: slot.id,
        },
      });
      onOpenChange(false);
      setSelectedMemberId("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!slot) return null;

  const slotDate = parseISO(slot.startTime);
  const slotEndDate = parseISO(slot.endTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className={cn(isRtl && "text-right")}>{texts.title}</DialogTitle>
          <DialogDescription className={cn(isRtl && "text-right")}>
            {texts.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Slot Details */}
          <div className={cn("flex items-center gap-3 p-3 bg-muted rounded-md3-md", isRtl && "flex-row-reverse")}>
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className={cn("font-medium", isRtl && "text-right")}>
                {format(slotDate, "EEEE, MMMM d, yyyy", { locale: dateLocale })}
              </p>
              <p className={cn("text-sm text-muted-foreground", isRtl && "text-right")}>
                {format(slotDate, "h:mm a")} - {format(slotEndDate, "h:mm a")}
              </p>
            </div>
          </div>

          {/* Member Selection */}
          <div className="space-y-2">
            <label className={cn("text-sm font-medium", isRtl && "text-right block")}>
              {texts.member}
            </label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger>
                <SelectValue placeholder={texts.searchMember} />
              </SelectTrigger>
              <SelectContent>
                {membersData?.content.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {locale === "ar" ? (member.firstName.ar || member.firstName.en) : member.firstName.en}{" "}
                    {locale === "ar" ? (member.lastName.ar || member.lastName.en) : member.lastName.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className={cn(isRtl && "flex-row-reverse")}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {texts.cancel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedMemberId || createBookingMutation.isPending}
          >
            {createBookingMutation.isPending ? texts.booking : texts.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
