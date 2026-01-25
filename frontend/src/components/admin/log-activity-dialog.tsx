"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { LeadActivityType, LogActivityRequest } from "@/types/lead";
import { LEAD_ACTIVITY_TYPE_LABELS } from "@/types/lead";

const LOGGABLE_ACTIVITY_TYPES: LeadActivityType[] = [
  "CALL",
  "EMAIL",
  "SMS",
  "WHATSAPP",
  "MEETING",
  "TOUR",
  "NOTE",
];

const activitySchema = z.object({
  type: z.enum(["CALL", "EMAIL", "SMS", "WHATSAPP", "MEETING", "TOUR", "NOTE"] as const),
  notes: z.string().optional(),
  contactMethod: z.string().optional(),
  outcome: z.string().optional(),
  followUpDate: z.date().optional(),
  durationMinutes: z.coerce.number().min(0).optional(),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

interface LogActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LogActivityRequest) => Promise<void>;
  isPending?: boolean;
}

export function LogActivityDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: LogActivityDialogProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: "CALL",
      notes: "",
      contactMethod: "",
      outcome: "",
      durationMinutes: undefined,
    },
  });

  const handleSubmit = async (values: ActivityFormValues) => {
    await onSubmit({
      type: values.type,
      notes: values.notes || undefined,
      contactMethod: values.contactMethod || undefined,
      outcome: values.outcome || undefined,
      followUpDate: values.followUpDate ? format(values.followUpDate, "yyyy-MM-dd") : undefined,
      durationMinutes: values.durationMinutes || undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isArabic ? "تسجيل نشاط جديد" : "Log New Activity"}
          </DialogTitle>
          <DialogDescription>
            {isArabic
              ? "سجل تفاعلك مع هذا العميل المحتمل"
              : "Record your interaction with this lead"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? "نوع النشاط" : "Activity Type"}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOGGABLE_ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {isArabic
                            ? LEAD_ACTIVITY_TYPE_LABELS[type].ar
                            : LEAD_ACTIVITY_TYPE_LABELS[type].en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? "ملاحظات" : "Notes"}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={isArabic ? "أدخل ملاحظات النشاط..." : "Enter activity notes..."}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? "النتيجة" : "Outcome"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isArabic ? "مثال: مهتم، سيتصل لاحقاً" : "e.g., Interested, Will call back"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? "المدة (دقائق)" : "Duration (min)"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="followUpDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{isArabic ? "تاريخ المتابعة" : "Follow-up Date"}</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-start font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="me-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>{isArabic ? "اختر تاريخ المتابعة" : "Pick a follow-up date"}</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setCalendarOpen(false);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isArabic
                    ? "جاري التسجيل..."
                    : "Logging..."
                  : isArabic
                  ? "تسجيل النشاط"
                  : "Log Activity"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
