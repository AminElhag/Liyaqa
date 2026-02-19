"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { CalendarIcon, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@liyaqa/shared/components/ui/dialog";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@liyaqa/shared/components/ui/popover";
import { Calendar } from "@liyaqa/shared/components/ui/calendar";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useTrainerClients } from "@liyaqa/shared/queries/use-trainer-portal";
import { useCreateTrainerSession } from "@liyaqa/shared/queries/use-pt-sessions";
import { cn } from "@liyaqa/shared/utils";
import type { TrainerClientResponse } from "@liyaqa/shared/types/trainer-portal";

const text = {
  title: { en: "New Session", ar: "جلسة جديدة" },
  description: { en: "Schedule a PT session with a client", ar: "جدولة جلسة تدريب شخصي مع عميل" },
  searchClient: { en: "Search client...", ar: "ابحث عن عميل..." },
  client: { en: "Client", ar: "العميل" },
  date: { en: "Date", ar: "التاريخ" },
  pickDate: { en: "Pick a date", ar: "اختر تاريخ" },
  startTime: { en: "Start Time", ar: "وقت البداية" },
  duration: { en: "Duration", ar: "المدة" },
  notes: { en: "Notes (optional)", ar: "ملاحظات (اختياري)" },
  notesPlaceholder: { en: "Session notes...", ar: "ملاحظات الجلسة..." },
  cancel: { en: "Cancel", ar: "إلغاء" },
  create: { en: "Create Session", ar: "إنشاء جلسة" },
  creating: { en: "Creating...", ar: "جاري الإنشاء..." },
  noClients: { en: "No clients found", ar: "لم يتم العثور على عملاء" },
  success: { en: "Session created successfully", ar: "تم إنشاء الجلسة بنجاح" },
  error: { en: "Failed to create session", ar: "فشل في إنشاء الجلسة" },
  min: { en: "min", ar: "دقيقة" },
};

const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

const DURATION_OPTIONS = [
  { value: "30", label: "30" },
  { value: "45", label: "45" },
  { value: "60", label: "60" },
  { value: "90", label: "90" },
  { value: "120", label: "120" },
];

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSessionDialog({ open, onOpenChange }: CreateSessionDialogProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<TrainerClientResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: clientsData, isLoading: clientsLoading } = useTrainerClients(
    {
      search: debouncedSearch || undefined,
      status: "ACTIVE",
      size: 10,
    },
    { enabled: open }
  );

  const createSession = useCreateTrainerSession();

  const resetForm = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedClient(null);
    setSelectedDate(undefined);
    setStartTime("");
    setDuration("60");
    setNotes("");
    setShowDropdown(false);
  }, []);

  useEffect(() => {
    if (!open) resetForm();
  }, [open, resetForm]);

  const canSubmit = selectedClient && selectedDate && startTime;

  async function handleSubmit() {
    if (!canSubmit) return;

    try {
      await createSession.mutateAsync({
        memberId: selectedClient.memberId,
        sessionDate: format(selectedDate, "yyyy-MM-dd"),
        startTime,
        durationMinutes: parseInt(duration),
        notes: notes || undefined,
      });

      toast({ title: t("success") });
      onOpenChange(false);
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
  }

  const clients = clientsData?.content ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client search */}
          <div className="space-y-2">
            <Label>{t("client")}</Label>
            {selectedClient ? (
              <div className="flex items-center justify-between rounded-md border p-2">
                <span className="text-sm font-medium">
                  {selectedClient.memberName || selectedClient.memberEmail || "-"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={() => {
                    setSelectedClient(null);
                    setSearch("");
                  }}
                >
                  {isAr ? "تغيير" : "Change"}
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchClient")}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="ps-9"
                />
                {showDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    {clientsLoading ? (
                      <div className="flex items-center justify-center p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : clients.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">{t("noClients")}</p>
                    ) : (
                      <ul className="max-h-48 overflow-auto py-1">
                        {clients.map((client) => (
                          <li key={client.id}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-start text-sm hover:bg-accent"
                              onClick={() => {
                                setSelectedClient(client);
                                setShowDropdown(false);
                                setSearch("");
                              }}
                            >
                              <span className="font-medium">
                                {client.memberName || "-"}
                              </span>
                              {client.memberEmail && (
                                <span className="ms-2 text-muted-foreground">
                                  {client.memberEmail}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label>{t("date")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-start font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="me-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : t("pickDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("startTime")}</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="--:--" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("duration")}</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} {t("min")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t("notes")}</Label>
            <Textarea
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createSession.isPending}
          >
            {createSession.isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("creating")}
              </>
            ) : (
              t("create")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
