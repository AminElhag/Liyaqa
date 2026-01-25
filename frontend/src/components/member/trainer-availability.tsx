"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { format, addDays } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePTTrainerAvailability } from "@/queries/use-pt-sessions";
import type { AvailableSlot } from "@/types/pt-session";

interface TrainerAvailabilityProps {
  trainerId: string;
  trainerName?: string;
  onSelectSlot: (slot: AvailableSlot) => void;
  selectedSlot?: AvailableSlot | null;
  slotDurationMinutes?: number;
}

export function TrainerAvailability({
  trainerId,
  trainerName,
  onSelectSlot,
  selectedSlot,
  slotDurationMinutes = 60,
}: TrainerAvailabilityProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const [selectedDate, setSelectedDate] = useState(new Date());

  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  const { data: slots, isLoading } = usePTTrainerAvailability(
    trainerId,
    formattedDate,
    slotDurationMinutes
  );

  const navigateDay = (direction: "prev" | "next") => {
    setSelectedDate((current) =>
      direction === "next" ? addDays(current, 1) : addDays(current, -1)
    );
  };

  const availableSlots = slots?.filter((s) => !s.isBooked) ?? [];
  const bookedSlots = slots?.filter((s) => s.isBooked) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {trainerName
            ? isArabic
              ? `مواعيد ${trainerName}`
              : `${trainerName}'s Availability`
            : isArabic
            ? "المواعيد المتاحة"
            : "Available Slots"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDay("prev")}
            disabled={selectedDate <= new Date()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="font-medium">
              {format(selectedDate, "EEEE", { locale: dateLocale })}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "PP", { locale: dateLocale })}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateDay("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Slots */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : availableSlots.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map((slot, index) => {
              const isSelected =
                selectedSlot?.date === slot.date &&
                selectedSlot?.startTime === slot.startTime;

              return (
                <Button
                  key={index}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "h-auto py-2 flex-col",
                    isSelected && "ring-2 ring-primary"
                  )}
                  onClick={() => onSelectSlot(slot)}
                >
                  <Clock className="h-4 w-4 mb-1" />
                  <span className="text-xs">
                    {slot.startTime.slice(0, 5)}
                  </span>
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {isArabic
              ? "لا توجد مواعيد متاحة في هذا اليوم"
              : "No available slots on this day"}
          </div>
        )}

        {/* Legend */}
        {slots && slots.length > 0 && (
          <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary" />
              <span>
                {isArabic ? "متاح" : "Available"} ({availableSlots.length})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted" />
              <span>
                {isArabic ? "محجوز" : "Booked"} ({bookedSlots.length})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
