"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Calendar, Clock, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/ui/spinner";
import { usePTTrainerAvailability } from "@/queries/use-pt-sessions";
import type { UUID } from "@/types/api";
import type { AvailableSlot, BookPTSessionRequest } from "@/types/pt-session";

interface PTBookingFormProps {
  trainerId: UUID;
  trainerName: string;
  sessionRate?: number;
  onBook: (data: BookPTSessionRequest) => void;
  isPending?: boolean;
}

export function PTBookingForm({
  trainerId,
  trainerName,
  sessionRate,
  onBook,
  isPending,
}: PTBookingFormProps) {
  const locale = useLocale();
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState("");

  const { data: slots, isLoading: loadingSlots } = usePTTrainerAvailability(
    trainerId,
    selectedDate,
    60
  );

  const texts = {
    selectDate: locale === "ar" ? "اختر التاريخ" : "Select Date",
    selectTime: locale === "ar" ? "اختر الوقت" : "Select Time",
    availableSlots: locale === "ar" ? "الأوقات المتاحة" : "Available Slots",
    noSlots: locale === "ar" ? "لا توجد أوقات متاحة" : "No available slots",
    notes: locale === "ar" ? "ملاحظات (اختياري)" : "Notes (Optional)",
    notesPlaceholder: locale === "ar" ? "أي متطلبات خاصة..." : "Any special requirements...",
    bookSession: locale === "ar" ? "حجز الجلسة" : "Book Session",
    booking: locale === "ar" ? "جاري الحجز..." : "Booking...",
    sessionDetails: locale === "ar" ? "تفاصيل الجلسة" : "Session Details",
    trainer: locale === "ar" ? "المدرب" : "Trainer",
    date: locale === "ar" ? "التاريخ" : "Date",
    time: locale === "ar" ? "الوقت" : "Time",
    duration: locale === "ar" ? "المدة" : "Duration",
    price: locale === "ar" ? "السعر" : "Price",
    minutes: locale === "ar" ? "دقيقة" : "minutes",
    loadingSlots: locale === "ar" ? "جاري تحميل الأوقات..." : "Loading slots...",
  };

  const availableSlots = slots?.filter((slot) => !slot.isBooked) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    onBook({
      trainerId,
      sessionDate: selectedDate,
      startTime: selectedSlot.startTime,
      durationMinutes: 60,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {texts.selectDate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={selectedDate}
            min={today}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot(null);
            }}
          />
        </CardContent>
      </Card>

      {/* Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {texts.selectTime}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loading />
              <span className="ms-2 text-muted-foreground">{texts.loadingSlots}</span>
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{texts.noSlots}</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.startTime}
                  type="button"
                  variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
                  className="h-auto py-3"
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot.startTime}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{texts.notes}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={texts.notesPlaceholder}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Session Summary */}
      {selectedSlot && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              {texts.sessionDetails}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{texts.trainer}:</span>
              <span className="font-medium">{trainerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{texts.date}:</span>
              <span className="font-medium">
                {new Date(selectedDate).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{texts.time}:</span>
              <span className="font-medium">
                {selectedSlot.startTime} - {selectedSlot.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{texts.duration}:</span>
              <span className="font-medium">60 {texts.minutes}</span>
            </div>
            {sessionRate && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">{texts.price}:</span>
                <span className="font-bold text-primary">{sessionRate} SAR</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!selectedSlot || isPending}
      >
        {isPending ? texts.booking : texts.bookSession}
      </Button>
    </form>
  );
}
