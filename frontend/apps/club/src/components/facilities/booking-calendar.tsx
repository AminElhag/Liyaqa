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
  Loader2,
  UserCheck,
  XCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { cn } from "@liyaqa/shared/utils";
import { useFacilitySlots, useGenerateSlots, useCreateBooking, useBooking, useCheckInBooking, useCompleteBooking, useCancelBooking, useMarkNoShow } from "@liyaqa/shared/queries/use-facilities";
import { useMembers, useMember } from "@liyaqa/shared/queries/use-members";
import type { UUID } from "@liyaqa/shared/types/api";
import type { FacilitySlot, FacilityBooking } from "@liyaqa/shared/types/facility";

type ViewMode = "week" | "day";

interface BookingCalendarProps {
  facilityId: UUID;
  facilityName?: string;
}

const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 20;

export function BookingCalendar({ facilityId, facilityName }: BookingCalendarProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dateLocale = locale === "ar" ? ar : enUS;

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<ViewMode>("week");
  const [selectedSlot, setSelectedSlot] = React.useState<FacilitySlot | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = React.useState(false);
  const [managedSlot, setManagedSlot] = React.useState<FacilitySlot | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = React.useState(false);
  const [generateSlotsOpen, setGenerateSlotsOpen] = React.useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: slots, isLoading } = useFacilitySlots(facilityId, {
    startDate: format(viewMode === "week" ? weekStart : currentDate, "yyyy-MM-dd"),
    endDate: format(viewMode === "week" ? weekEnd : currentDate, "yyyy-MM-dd"),
  });

  const hours = React.useMemo(() => {
    let minHour = DEFAULT_START_HOUR;
    let maxHour = DEFAULT_END_HOUR;

    if (slots && slots.length > 0) {
      for (const slot of slots) {
        const startH = parseInt(slot.startTime.split(":")[0], 10);
        const endH = parseInt(slot.endTime.split(":")[0], 10);
        if (startH < minHour) minHour = startH;
        if (endH > maxHour) maxHour = endH;
      }
    }

    return Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour);
  }, [slots]);

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
    generateSlots: isRtl ? "إنشاء فترات" : "Generate Slots",
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
    } else if (slot.status === "BOOKED" && slot.booking) {
      setManagedSlot(slot);
      setManageDialogOpen(true);
    }
  };

  const getSlotForDayAndHour = (day: Date, hour: number) => {
    if (!slots) return null;
    return slots.find((slot) => {
      const slotDateParsed = parseISO(slot.slotDate);
      const slotHour = parseInt(slot.startTime.split(":")[0], 10);
      return isSameDay(slotDateParsed, day) && slotHour === hour;
    });
  };

  const getSlotStyle = (slot: FacilitySlot | null | undefined) => {
    if (!slot) return "bg-muted/30";
    switch (slot.status) {
      case "AVAILABLE":
        return "bg-green-100 hover:bg-green-200 cursor-pointer border-green-300";
      case "BOOKED":
        return "bg-blue-100 hover:bg-blue-200 cursor-pointer border-blue-300";
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
          <Button variant="outline" size="sm" onClick={() => setGenerateSlotsOpen(true)}>
            <Plus className="h-4 w-4 me-1" />
            {texts.generateSlots}
          </Button>
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
            {hours.map((hour) => (
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

      {/* Booking Manage Dialog */}
      <BookingManageDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        slot={managedSlot}
        facilityId={facilityId}
        facilityName={facilityName}
      />

      {/* Generate Slots Dialog */}
      <GenerateSlotsDialog
        open={generateSlotsOpen}
        onOpenChange={setGenerateSlotsOpen}
        facilityId={facilityId}
      />
    </div>
  );
}

// ========== Generate Slots Dialog ==========

interface GenerateSlotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: UUID;
}

function GenerateSlotsDialog({ open, onOpenChange, facilityId }: GenerateSlotsDialogProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const sunday = endOfWeek(today, { weekStartsOn: 1 });

  const [startDate, setStartDate] = React.useState(format(monday, "yyyy-MM-dd"));
  const [endDate, setEndDate] = React.useState(format(sunday, "yyyy-MM-dd"));

  const generateSlotsMutation = useGenerateSlots();

  const texts = {
    title: isRtl ? "إنشاء فترات زمنية" : "Generate Time Slots",
    description: isRtl
      ? "إنشاء فترات زمنية للمرفق بناءً على ساعات التشغيل المحددة"
      : "Generate time slots for the facility based on its configured operating hours",
    startDate: isRtl ? "تاريخ البدء" : "Start Date",
    endDate: isRtl ? "تاريخ الانتهاء" : "End Date",
    cancel: isRtl ? "إلغاء" : "Cancel",
    generate: isRtl ? "إنشاء" : "Generate",
    generating: isRtl ? "جاري الإنشاء..." : "Generating...",
    success: isRtl ? "تم إنشاء الفترات بنجاح" : "Slots generated successfully",
    noSlotsGenerated: isRtl
      ? "لم يتم إنشاء أي فترات. تحقق من ساعات تشغيل المرفق."
      : "No slots generated. Check facility operating hours.",
    error: isRtl ? "فشل إنشاء الفترات" : "Failed to generate slots",
  };

  const handleGenerate = async () => {
    try {
      const result = await generateSlotsMutation.mutateAsync({
        facilityId,
        data: { startDate, endDate },
      });
      if (result.length === 0) {
        toast.warning(texts.noSlotsGenerated);
      } else {
        toast.success(`${texts.success} (${result.length})`);
      }
      onOpenChange(false);
    } catch {
      toast.error(texts.error);
    }
  };

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
          <div className="space-y-2">
            <Label className={cn(isRtl && "text-right block")}>{texts.startDate}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className={cn(isRtl && "text-right block")}>{texts.endDate}</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className={cn(isRtl && "flex-row-reverse")}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {texts.cancel}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!startDate || !endDate || generateSlotsMutation.isPending}
          >
            {generateSlotsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-1" />}
            {generateSlotsMutation.isPending ? texts.generating : texts.generate}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========== Booking Dialog ==========

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

  const slotDate = parseISO(`${slot.slotDate}T${slot.startTime}`);
  const slotEndDate = parseISO(`${slot.slotDate}T${slot.endTime}`);

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

// ========== Booking Manage Dialog ==========

interface BookingManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: FacilitySlot | null;
  facilityId: UUID;
  facilityName?: string;
}

export function BookingManageDialog({ open, onOpenChange, slot, facilityId, facilityName }: BookingManageDialogProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dateLocale = locale === "ar" ? ar : enUS;

  const [showCancelForm, setShowCancelForm] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");

  const bookingId = slot?.booking?.id ?? "";
  const { data: booking, isLoading: bookingLoading } = useBooking(bookingId, { enabled: !!bookingId && open });
  const { data: member } = useMember(booking?.memberId ?? "", { enabled: !!booking?.memberId });

  const checkInMutation = useCheckInBooking();
  const completeMutation = useCompleteBooking();
  const cancelMutation = useCancelBooking();
  const noShowMutation = useMarkNoShow();

  const anyPending = checkInMutation.isPending || completeMutation.isPending || cancelMutation.isPending || noShowMutation.isPending;

  const texts = {
    title: isRtl ? "إدارة الحجز" : "Manage Booking",
    description: isRtl ? `حجز في ${facilityName || "المرفق"}` : `Booking at ${facilityName || "facility"}`,
    date: isRtl ? "التاريخ" : "Date",
    time: isRtl ? "الوقت" : "Time",
    member: isRtl ? "العضو" : "Member",
    status: isRtl ? "الحالة" : "Status",
    notes: isRtl ? "ملاحظات" : "Notes",
    bookedAt: isRtl ? "وقت الحجز" : "Booked at",
    checkedInAt: isRtl ? "وقت تسجيل الدخول" : "Checked in at",
    cancelledAt: isRtl ? "وقت الإلغاء" : "Cancelled at",
    cancellationReason: isRtl ? "سبب الإلغاء" : "Cancellation reason",
    checkIn: isRtl ? "تسجيل الدخول" : "Check In",
    complete: isRtl ? "إكمال" : "Complete",
    cancel: isRtl ? "إلغاء الحجز" : "Cancel Booking",
    noShow: isRtl ? "لم يحضر" : "No-Show",
    close: isRtl ? "إغلاق" : "Close",
    closed: isRtl ? "هذا الحجز مغلق." : "This booking is closed.",
    cancelReasonLabel: isRtl ? "سبب الإلغاء (اختياري)" : "Cancellation reason (optional)",
    cancelReasonPlaceholder: isRtl ? "أدخل سبب الإلغاء..." : "Enter cancellation reason...",
    confirmCancel: isRtl ? "تأكيد الإلغاء" : "Confirm Cancel",
    goBack: isRtl ? "رجوع" : "Go Back",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    checkInSuccess: isRtl ? "تم تسجيل الدخول بنجاح" : "Checked in successfully",
    completeSuccess: isRtl ? "تم الإكمال بنجاح" : "Booking completed",
    cancelSuccess: isRtl ? "تم إلغاء الحجز" : "Booking cancelled",
    noShowSuccess: isRtl ? "تم التسجيل كغياب" : "Marked as no-show",
    error: isRtl ? "حدث خطأ" : "Something went wrong",
    noNotes: isRtl ? "لا توجد ملاحظات" : "No notes",
  };

  const closeDialog = () => {
    onOpenChange(false);
    setShowCancelForm(false);
    setCancelReason("");
  };

  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync(bookingId);
      toast.success(texts.checkInSuccess);
      closeDialog();
    } catch {
      toast.error(texts.error);
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(bookingId);
      toast.success(texts.completeSuccess);
      closeDialog();
    } catch {
      toast.error(texts.error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ id: bookingId, data: cancelReason ? { reason: cancelReason } : undefined });
      toast.success(texts.cancelSuccess);
      closeDialog();
    } catch {
      toast.error(texts.error);
    }
  };

  const handleNoShow = async () => {
    try {
      await noShowMutation.mutateAsync(bookingId);
      toast.success(texts.noShowSuccess);
      closeDialog();
    } catch {
      toast.error(texts.error);
    }
  };

  if (!slot) return null;

  const slotDate = parseISO(`${slot.slotDate}T${slot.startTime}`);
  const slotEndDate = parseISO(`${slot.slotDate}T${slot.endTime}`);

  const memberName = member
    ? `${locale === "ar" ? (member.firstName.ar || member.firstName.en) : member.firstName.en} ${locale === "ar" ? (member.lastName.ar || member.lastName.en) : member.lastName.en}`
    : slot.booking?.memberId?.slice(0, 8) ?? "";

  const isTerminal = booking?.status === "COMPLETED" || booking?.status === "CANCELLED" || booking?.status === "NO_SHOW";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className={cn(isRtl && "text-right")}>{texts.title}</DialogTitle>
          <DialogDescription className={cn(isRtl && "text-right")}>
            {texts.description}
          </DialogDescription>
        </DialogHeader>

        {bookingLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ms-2 text-sm text-muted-foreground">{texts.loading}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Date */}
            <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
              <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {format(slotDate, "EEEE, MMMM d, yyyy", { locale: dateLocale })}
              </span>
            </div>

            {/* Time */}
            <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {format(slotDate, "h:mm a", { locale: dateLocale })} - {format(slotEndDate, "h:mm a", { locale: dateLocale })}
              </span>
            </div>

            {/* Member */}
            <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">{memberName}</span>
            </div>

            {/* Status */}
            {booking && (
              <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                <StatusBadge status={booking.status} locale={locale} />
              </div>
            )}

            {/* Notes */}
            {booking?.notes && (
              <div className={cn("flex items-start gap-3", isRtl && "flex-row-reverse")}>
                <span className="text-sm text-muted-foreground shrink-0">{texts.notes}:</span>
                <span className="text-sm">{booking.notes}</span>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t pt-3 space-y-1">
              {booking?.bookedAt && (
                <p className={cn("text-xs text-muted-foreground", isRtl && "text-right")}>
                  {texts.bookedAt}: {format(parseISO(booking.bookedAt), "MMM d, yyyy h:mm a", { locale: dateLocale })}
                </p>
              )}
              {booking?.checkedInAt && (
                <p className={cn("text-xs text-muted-foreground", isRtl && "text-right")}>
                  {texts.checkedInAt}: {format(parseISO(booking.checkedInAt), "MMM d, yyyy h:mm a", { locale: dateLocale })}
                </p>
              )}
              {booking?.cancelledAt && (
                <p className={cn("text-xs text-muted-foreground", isRtl && "text-right")}>
                  {texts.cancelledAt}: {format(parseISO(booking.cancelledAt), "MMM d, yyyy h:mm a", { locale: dateLocale })}
                </p>
              )}
              {booking?.cancellationReason && (
                <p className={cn("text-xs text-muted-foreground", isRtl && "text-right")}>
                  {texts.cancellationReason}: {booking.cancellationReason}
                </p>
              )}
            </div>

            {/* Cancel form */}
            {showCancelForm && (
              <div className="border-t pt-3 space-y-3">
                <label className={cn("text-sm font-medium", isRtl && "text-right block")}>
                  {texts.cancelReasonLabel}
                </label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={texts.cancelReasonPlaceholder}
                  rows={3}
                  dir={isRtl ? "rtl" : "ltr"}
                />
                <div className={cn("flex gap-2", isRtl && "flex-row-reverse")}>
                  <Button variant="outline" size="sm" onClick={() => setShowCancelForm(false)} disabled={anyPending}>
                    {texts.goBack}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleCancel} disabled={anyPending}>
                    {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-1" />}
                    {texts.confirmCancel}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className={cn("gap-2", isRtl && "flex-row-reverse")}>
          {!bookingLoading && !showCancelForm && (
            <>
              {booking?.status === "CONFIRMED" && (
                <>
                  <Button size="sm" onClick={handleCheckIn} disabled={anyPending}>
                    {checkInMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <UserCheck className="h-4 w-4 me-1" />}
                    {texts.checkIn}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowCancelForm(true)} disabled={anyPending}>
                    <XCircle className="h-4 w-4 me-1" />
                    {texts.cancel}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleNoShow} disabled={anyPending}>
                    {noShowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <AlertCircle className="h-4 w-4 me-1" />}
                    {texts.noShow}
                  </Button>
                </>
              )}
              {booking?.status === "CHECKED_IN" && (
                <>
                  <Button size="sm" onClick={handleComplete} disabled={anyPending}>
                    {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Check className="h-4 w-4 me-1" />}
                    {texts.complete}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowCancelForm(true)} disabled={anyPending}>
                    <XCircle className="h-4 w-4 me-1" />
                    {texts.cancel}
                  </Button>
                </>
              )}
              {isTerminal && (
                <p className="text-sm text-muted-foreground">{texts.closed}</p>
              )}
            </>
          )}
          <Button variant="outline" size="sm" onClick={closeDialog}>
            {texts.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
