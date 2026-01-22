import { api } from "./client";
import type {
  PrayerTimeResponse,
  NextPrayerResponse,
  CheckInStatusResponse,
  PrayerSettingsResponse,
  SupportedCitiesResponse,
  CalculationMethodInfo,
  UpdatePrayerSettingsRequest,
} from "@/types/prayer-time";

const BASE_URL = "api/prayer-times";

/**
 * Get today's prayer times for a club.
 */
export async function getTodayPrayerTimes(
  clubId: string
): Promise<PrayerTimeResponse> {
  return api.get(`${BASE_URL}/today?clubId=${clubId}`).json();
}

/**
 * Get prayer times for a specific date.
 */
export async function getPrayerTimesByDate(
  clubId: string,
  date: string
): Promise<PrayerTimeResponse> {
  return api.get(`${BASE_URL}/date?clubId=${clubId}&date=${date}`).json();
}

/**
 * Get prayer times for a week starting from the given date.
 */
export async function getWeeklyPrayerTimes(
  clubId: string,
  startDate?: string
): Promise<PrayerTimeResponse[]> {
  const url = startDate
    ? `${BASE_URL}/week?clubId=${clubId}&startDate=${startDate}`
    : `${BASE_URL}/week?clubId=${clubId}`;
  return api.get(url).json();
}

/**
 * Get the next prayer for a club.
 */
export async function getNextPrayer(clubId: string): Promise<NextPrayerResponse> {
  return api.get(`${BASE_URL}/next?clubId=${clubId}`).json();
}

/**
 * Check if check-in is blocked due to prayer time.
 */
export async function getCheckInStatus(
  clubId: string
): Promise<CheckInStatusResponse> {
  return api.get(`${BASE_URL}/check-in-status?clubId=${clubId}`).json();
}

/**
 * Get prayer settings for a club.
 */
export async function getPrayerSettings(
  clubId: string
): Promise<PrayerSettingsResponse> {
  return api.get(`${BASE_URL}/clubs/${clubId}/settings`).json();
}

/**
 * Update prayer settings for a club.
 */
export async function updatePrayerSettings(
  clubId: string,
  settings: UpdatePrayerSettingsRequest
): Promise<PrayerSettingsResponse> {
  return api.put(`${BASE_URL}/clubs/${clubId}/settings`, { json: settings }).json();
}

/**
 * Get list of supported Saudi cities.
 */
export async function getSupportedCities(): Promise<SupportedCitiesResponse> {
  return api.get(`${BASE_URL}/cities`).json();
}

/**
 * Get list of supported calculation methods.
 */
export async function getCalculationMethods(): Promise<CalculationMethodInfo[]> {
  return api.get(`${BASE_URL}/calculation-methods`).json();
}
