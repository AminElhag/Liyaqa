/**
 * Islamic Calendar API Client
 * Endpoints for Hijri calendar and Islamic events
 */

import { api } from "./client";
import type {
  HijriDateResponse,
  GregorianDateResponse,
  IslamicEventsResponse,
  IslamicEventDto,
  HijriMonthInfoResponse,
  RamadanInfoResponse,
  HijriMonthName,
} from "../types/islamic-calendar";

const BASE_URL = "api/calendar";

/**
 * Gets today's date in Hijri calendar.
 */
export async function getTodayHijri(): Promise<HijriDateResponse> {
  return api.get(`${BASE_URL}/hijri/today`).json();
}

/**
 * Converts a Gregorian date to Hijri.
 */
export async function convertToHijri(date: string): Promise<HijriDateResponse> {
  return api.get(`${BASE_URL}/convert/to-hijri`, {
    searchParams: { date },
  }).json();
}

/**
 * Converts a Hijri date to Gregorian.
 */
export async function convertToGregorian(
  year: number,
  month: number,
  day: number
): Promise<GregorianDateResponse> {
  return api.get(`${BASE_URL}/convert/to-gregorian`, {
    searchParams: { year: year.toString(), month: month.toString(), day: day.toString() },
  }).json();
}

/**
 * Gets Islamic events for a given Hijri year.
 */
export async function getIslamicEvents(year?: number): Promise<IslamicEventsResponse> {
  const searchParams = year ? { year: year.toString() } : undefined;
  return api.get(`${BASE_URL}/islamic-events`, { searchParams }).json();
}

/**
 * Gets upcoming Islamic events.
 */
export async function getUpcomingEvents(daysAhead: number = 30): Promise<IslamicEventDto[]> {
  return api.get(`${BASE_URL}/islamic-events/upcoming`, {
    searchParams: { daysAhead: daysAhead.toString() },
  }).json();
}

/**
 * Gets current Hijri month information.
 */
export async function getCurrentMonthInfo(): Promise<HijriMonthInfoResponse> {
  return api.get(`${BASE_URL}/hijri/month`).json();
}

/**
 * Gets Ramadan information.
 */
export async function getRamadanInfo(): Promise<RamadanInfoResponse> {
  return api.get(`${BASE_URL}/ramadan`).json();
}

/**
 * Gets list of Hijri months.
 */
export async function getHijriMonths(): Promise<HijriMonthName[]> {
  return api.get(`${BASE_URL}/hijri/months`).json();
}
