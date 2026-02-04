/**
 * Hijri Calendar Utilities
 * Client-side utilities for Hijri date handling
 */

import { HIJRI_MONTHS_AR, HIJRI_MONTHS_EN } from "../../types/islamic-calendar";

// Arabic numerals
const ARABIC_NUMERALS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/**
 * Converts a number to Arabic numerals string.
 */
export function toArabicNumerals(num: number): string {
  return num
    .toString()
    .split("")
    .map((digit) => ARABIC_NUMERALS[parseInt(digit)] || digit)
    .join("");
}

/**
 * Gets the Hijri month name.
 */
export function getHijriMonthName(month: number, locale: "en" | "ar" = "en"): string {
  if (month < 1 || month > 12) return "";
  return locale === "ar" ? HIJRI_MONTHS_AR[month - 1] : HIJRI_MONTHS_EN[month - 1];
}

/**
 * Formats a Hijri date in the specified locale.
 */
export function formatHijriDate(
  year: number,
  month: number,
  day: number,
  locale: "en" | "ar" = "en"
): string {
  const monthName = getHijriMonthName(month, locale);
  if (locale === "ar") {
    return `${toArabicNumerals(day)} ${monthName} ${toArabicNumerals(year)}`;
  }
  return `${day} ${monthName} ${year}`;
}

/**
 * Parses an ISO Hijri date string (e.g., "1445-09-15").
 */
export function parseHijriDateIso(dateString: string): {
  year: number;
  month: number;
  day: number;
} | null {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1]),
    month: parseInt(match[2]),
    day: parseInt(match[3]),
  };
}

/**
 * Gets a relative time description for upcoming events.
 */
export function getRelativeTimeDescription(
  gregorianDate: string,
  locale: "en" | "ar" = "en"
): string {
  const eventDate = new Date(gregorianDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return locale === "ar" ? "اليوم" : "Today";
  } else if (diffDays === 1) {
    return locale === "ar" ? "غداً" : "Tomorrow";
  } else if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (locale === "ar") {
      return `منذ ${toArabicNumerals(absDays)} ${absDays === 1 ? "يوم" : "أيام"}`;
    }
    return `${absDays} ${absDays === 1 ? "day" : "days"} ago`;
  } else if (diffDays <= 7) {
    if (locale === "ar") {
      return `بعد ${toArabicNumerals(diffDays)} ${diffDays === 1 ? "يوم" : "أيام"}`;
    }
    return `In ${diffDays} ${diffDays === 1 ? "day" : "days"}`;
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    if (locale === "ar") {
      return `بعد ${toArabicNumerals(weeks)} ${weeks === 1 ? "أسبوع" : "أسابيع"}`;
    }
    return `In ${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  } else {
    const months = Math.floor(diffDays / 30);
    if (locale === "ar") {
      return `بعد ${toArabicNumerals(months)} ${months === 1 ? "شهر" : "أشهر"}`;
    }
    return `In ${months} ${months === 1 ? "month" : "months"}`;
  }
}

/**
 * Day of week names in Arabic.
 */
export const DAYS_OF_WEEK_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

/**
 * Gets the day of week name from a date string.
 */
export function getDayOfWeekName(dateString: string, locale: "en" | "ar" = "en"): string {
  const date = new Date(dateString);
  if (locale === "ar") {
    return DAYS_OF_WEEK_AR[date.getDay()];
  }
  return date.toLocaleDateString("en-US", { weekday: "long" });
}
