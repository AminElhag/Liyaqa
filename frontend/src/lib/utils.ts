import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to locale string
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
 * Format time to locale string
 */
export function formatTime(date: string | Date | null | undefined, locale: string = "en"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format datetime to locale string
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  locale: string = "en"
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format currency amount
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
 * Get initials from display name.
 * Supports both single display name ("John Doe") or separate first/last names.
 */
export function getInitials(
  displayName?: string,
  lastName?: string
): string {
  if (!displayName) return "";

  // If lastName is provided, use firstName + lastName pattern
  if (lastName) {
    const first = displayName.charAt(0) || "";
    const last = lastName.charAt(0) || "";
    return (first + last).toUpperCase();
  }

  // Otherwise, split displayName and get initials from first two words
  const parts = displayName.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) || "";
  const second = parts[1]?.charAt(0) || "";
  return (first + second).toUpperCase();
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
