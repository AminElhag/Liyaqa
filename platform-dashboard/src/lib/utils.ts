import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a locale-aware short date.
 */
export function formatDate(date: string | Date | null | undefined, locale: string = "en"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a currency amount with Intl.NumberFormat.
 */
export function formatCurrency(
  amount: number,
  currency: string = "SAR",
  locale: string = "en"
): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format a date+time string to a locale-aware format.
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  locale: string = "en"
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get text from LocalizedText based on locale
 */
export function getLocalizedText(
  text: { en: string; ar?: string | null } | undefined | null,
  locale: string = "en"
): string {
  if (!text) return "";
  if (locale === "ar" && text.ar) {
    return text.ar;
  }
  return text.en;
}
