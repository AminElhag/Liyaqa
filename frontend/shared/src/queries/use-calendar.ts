/**
 * TanStack Query hooks for Islamic Calendar
 */

import { useQuery } from "@tanstack/react-query";
import {
  getTodayHijri,
  convertToHijri,
  convertToGregorian,
  getIslamicEvents,
  getUpcomingEvents,
  getCurrentMonthInfo,
  getRamadanInfo,
  getHijriMonths,
} from "../lib/api/calendar";

// Query keys
export const calendarKeys = {
  all: ["calendar"] as const,
  todayHijri: () => [...calendarKeys.all, "today-hijri"] as const,
  convertToHijri: (date: string) => [...calendarKeys.all, "to-hijri", date] as const,
  convertToGregorian: (year: number, month: number, day: number) =>
    [...calendarKeys.all, "to-gregorian", year, month, day] as const,
  islamicEvents: (year?: number) => [...calendarKeys.all, "islamic-events", year] as const,
  upcomingEvents: (daysAhead: number) =>
    [...calendarKeys.all, "upcoming-events", daysAhead] as const,
  currentMonth: () => [...calendarKeys.all, "current-month"] as const,
  ramadan: () => [...calendarKeys.all, "ramadan"] as const,
  hijriMonths: () => [...calendarKeys.all, "hijri-months"] as const,
};

/**
 * Hook to get today's Hijri date.
 */
export function useTodayHijri() {
  return useQuery({
    queryKey: calendarKeys.todayHijri(),
    queryFn: getTodayHijri,
    staleTime: 1000 * 60 * 60, // 1 hour - date changes once a day
  });
}

/**
 * Hook to convert Gregorian date to Hijri.
 */
export function useConvertToHijri(date: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: calendarKeys.convertToHijri(date),
    queryFn: () => convertToHijri(date),
    enabled: options?.enabled !== false && !!date,
    staleTime: Infinity, // Conversion never changes
  });
}

/**
 * Hook to convert Hijri date to Gregorian.
 */
export function useConvertToGregorian(
  year: number,
  month: number,
  day: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: calendarKeys.convertToGregorian(year, month, day),
    queryFn: () => convertToGregorian(year, month, day),
    enabled: options?.enabled !== false && year > 0 && month > 0 && day > 0,
    staleTime: Infinity, // Conversion never changes
  });
}

/**
 * Hook to get Islamic events for a year.
 */
export function useIslamicEvents(year?: number) {
  return useQuery({
    queryKey: calendarKeys.islamicEvents(year),
    queryFn: () => getIslamicEvents(year),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Hook to get upcoming Islamic events.
 */
export function useUpcomingEvents(daysAhead: number = 30) {
  return useQuery({
    queryKey: calendarKeys.upcomingEvents(daysAhead),
    queryFn: () => getUpcomingEvents(daysAhead),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to get current Hijri month info.
 */
export function useCurrentHijriMonth() {
  return useQuery({
    queryKey: calendarKeys.currentMonth(),
    queryFn: getCurrentMonthInfo,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to get Ramadan information.
 */
export function useRamadanInfo() {
  return useQuery({
    queryKey: calendarKeys.ramadan(),
    queryFn: getRamadanInfo,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to get Hijri months list.
 */
export function useHijriMonths() {
  return useQuery({
    queryKey: calendarKeys.hijriMonths(),
    queryFn: getHijriMonths,
    staleTime: Infinity, // Static data
  });
}
