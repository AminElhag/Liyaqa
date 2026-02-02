"use client";

import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  availabilitySchema,
  type AvailabilityFormValues,
} from "@/lib/validations/trainer-schedule";
import type { Availability } from "@/types/trainer-portal";
import { cn } from "@/lib/utils";

interface ScheduleAvailabilityEditorProps {
  availability: Availability | null;
  onSave: (data: AvailabilityFormValues) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function ScheduleAvailabilityEditor({
  availability,
  onSave,
  onCancel,
  isLoading = false,
}: ScheduleAvailabilityEditorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    monday: locale === "ar" ? "الإثنين" : "Monday",
    tuesday: locale === "ar" ? "الثلاثاء" : "Tuesday",
    wednesday: locale === "ar" ? "الأربعاء" : "Wednesday",
    thursday: locale === "ar" ? "الخميس" : "Thursday",
    friday: locale === "ar" ? "الجمعة" : "Friday",
    saturday: locale === "ar" ? "السبت" : "Saturday",
    sunday: locale === "ar" ? "الأحد" : "Sunday",
    addSlot: locale === "ar" ? "إضافة فترة" : "Add Time Slot",
    remove: locale === "ar" ? "حذف" : "Remove",
    save: locale === "ar" ? "حفظ" : "Save",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    startTime: locale === "ar" ? "وقت البدء" : "Start Time",
    endTime: locale === "ar" ? "وقت الانتهاء" : "End Time",
    noSlots: locale === "ar" ? "لا توجد فترات متاحة" : "No time slots",
  };

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: availability || {},
  });

  const getDayLabel = (day: DayOfWeek): string => {
    return texts[day];
  };

  const addTimeSlot = (day: DayOfWeek) => {
    const currentSlots = form.getValues(day) || [];
    form.setValue(day, [
      ...currentSlots,
      { start: "09:00", end: "17:00" },
    ]);
  };

  const removeTimeSlot = (day: DayOfWeek, index: number) => {
    const currentSlots = form.getValues(day) || [];
    const newSlots = currentSlots.filter((_, i) => i !== index);
    form.setValue(day, newSlots.length > 0 ? newSlots : undefined);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        {DAYS.map((day) => {
          const slots = form.watch(day) || [];

          return (
            <Card key={day}>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Day Header */}
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <h3 className="font-semibold text-base">{getDayLabel(day)}</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTimeSlot(day)}
                    >
                      <Plus className="h-4 w-4 me-1" />
                      {texts.addSlot}
                    </Button>
                  </div>

                  {/* Time Slots */}
                  {slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {texts.noSlots}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {slots.map((slot, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-end gap-3",
                            isRtl && "flex-row-reverse"
                          )}
                        >
                          {/* Start Time */}
                          <FormField
                            control={form.control}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            name={`${day}.${index}.start` as any}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>{texts.startTime}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    className="w-full"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* End Time */}
                          <FormField
                            control={form.control}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            name={`${day}.${index}.end` as any}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>{texts.endTime}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    className="w-full"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Remove Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTimeSlot(day, index)}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">{texts.remove}</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Form Actions */}
        <div className={cn("flex gap-4", isRtl && "flex-row-reverse")}>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {texts.save}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {texts.cancel}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
