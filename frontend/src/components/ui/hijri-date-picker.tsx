"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useConvertToHijri } from "@/queries/use-calendar";

const TEXTS = {
  en: {
    placeholder: "Pick a date",
    hijri: "Hijri",
    gregorian: "Gregorian",
  },
  ar: {
    placeholder: "اختر تاريخ",
    hijri: "هجري",
    gregorian: "ميلادي",
  },
};

/**
 * Formats a date object to a readable string.
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats a date to ISO format (YYYY-MM-DD).
 */
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface HijriDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showHijri?: boolean;
}

export function HijriDatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  showHijri = true,
}: HijriDatePickerProps) {
  const locale = useLocale() as "en" | "ar";
  const texts = TEXTS[locale];

  // Convert selected Gregorian date to Hijri
  const dateString = value ? toIsoDate(value) : "";
  const { data: hijriDate } = useConvertToHijri(dateString, {
    enabled: showHijri && !!value,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue) {
      onChange?.(new Date(newValue));
    } else {
      onChange?.(undefined);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <input
        type="date"
        value={value ? toIsoDate(value) : ""}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
      {showHijri && hijriDate && (
        <div className="text-xs text-muted-foreground px-1">
          {texts.hijri}:{" "}
          {locale === "ar"
            ? hijriDate.hijriDateFormattedAr
            : hijriDate.hijriDateFormattedEn}
        </div>
      )}
    </div>
  );
}

interface DualDateDisplayProps {
  date: Date | string;
  className?: string;
  showHijri?: boolean;
}

/**
 * Displays both Gregorian and Hijri dates.
 */
export function DualDateDisplay({
  date,
  className,
  showHijri = true,
}: DualDateDisplayProps) {
  const locale = useLocale() as "en" | "ar";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateString = toIsoDate(dateObj);
  const { data: hijriDate } = useConvertToHijri(dateString, {
    enabled: showHijri,
  });

  return (
    <div className={cn("flex flex-col", className)}>
      <span>{formatDate(dateObj)}</span>
      {showHijri && hijriDate && (
        <span className="text-xs text-muted-foreground">
          {locale === "ar"
            ? hijriDate.hijriDateFormattedAr
            : hijriDate.hijriDateFormattedEn}
        </span>
      )}
    </div>
  );
}
