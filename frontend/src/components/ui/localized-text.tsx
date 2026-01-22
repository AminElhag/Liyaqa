"use client";

import { useLocale } from "next-intl";
import type { LocalizedText as LocalizedTextType } from "@/types/api";

interface LocalizedTextProps {
  text: LocalizedTextType | string | null | undefined;
  fallback?: string;
  className?: string;
}

/**
 * Display localized text based on current locale
 * Falls back to English if Arabic not available
 */
export function LocalizedText({
  text,
  fallback = "",
  className,
}: LocalizedTextProps) {
  const locale = useLocale();

  if (!text) {
    return <span className={className}>{fallback}</span>;
  }

  // If it's already a string, just display it
  if (typeof text === "string") {
    return <span className={className}>{text}</span>;
  }

  // For LocalizedText object, pick the appropriate language
  const displayText =
    locale === "ar" && text.ar ? text.ar : text.en || fallback;

  return <span className={className}>{displayText}</span>;
}

/**
 * Helper hook to get localized text value
 */
export function useLocalizedText(
  text: LocalizedTextType | string | null | undefined,
  fallback = ""
): string {
  const locale = useLocale();

  if (!text) return fallback;
  if (typeof text === "string") return text;

  return locale === "ar" && text.ar ? text.ar : text.en || fallback;
}
