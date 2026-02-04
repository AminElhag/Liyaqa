import { api } from "./client";
import type {
  GenderPolicyResponse,
  GenderAccessResponse,
  CurrentGenderStatusResponse,
  GenderScheduleResponse,
  GenderPolicyInfo,
  UpdateGenderPolicyRequest,
  CreateGenderScheduleRequest,
  UpdateGenderScheduleRequest,
  AccessGender,
} from "../types/gender-policy";

const BASE_URL = "api/gender-policies";

// ==================== LOCATION GENDER POLICY ====================

/**
 * Update the gender policy for a location.
 */
export async function updateLocationGenderPolicy(
  locationId: string,
  request: UpdateGenderPolicyRequest
): Promise<GenderPolicyResponse> {
  return api.put(`${BASE_URL}/locations/${locationId}`, { json: request }).json();
}

/**
 * Check if a gender can access a location at the specified time.
 */
export async function checkGenderAccess(
  locationId: string,
  gender: AccessGender,
  dateTime?: string
): Promise<GenderAccessResponse> {
  const params = new URLSearchParams({ gender });
  if (dateTime) {
    params.append("dateTime", dateTime);
  }
  return api.get(`${BASE_URL}/locations/${locationId}/access-check?${params}`).json();
}

/**
 * Get the current gender status for a location.
 */
export async function getCurrentGenderStatus(
  locationId: string,
  dateTime?: string
): Promise<CurrentGenderStatusResponse> {
  const params = dateTime ? `?dateTime=${dateTime}` : "";
  return api.get(`${BASE_URL}/locations/${locationId}/current-status${params}`).json();
}

// ==================== GENDER SCHEDULES ====================

/**
 * Get all gender schedules for a location.
 */
export async function getSchedulesForLocation(
  locationId: string
): Promise<GenderScheduleResponse[]> {
  return api.get(`${BASE_URL}/locations/${locationId}/schedules`).json();
}

/**
 * Add a new gender schedule for a location.
 */
export async function addGenderSchedule(
  locationId: string,
  request: CreateGenderScheduleRequest
): Promise<GenderScheduleResponse> {
  return api.post(`${BASE_URL}/locations/${locationId}/schedules`, { json: request }).json();
}

/**
 * Update an existing gender schedule.
 */
export async function updateGenderSchedule(
  scheduleId: string,
  request: UpdateGenderScheduleRequest
): Promise<GenderScheduleResponse> {
  return api.put(`${BASE_URL}/schedules/${scheduleId}`, { json: request }).json();
}

/**
 * Delete a gender schedule.
 */
export async function deleteGenderSchedule(scheduleId: string): Promise<void> {
  await api.delete(`${BASE_URL}/schedules/${scheduleId}`);
}

/**
 * Delete all schedules for a location.
 */
export async function deleteAllSchedulesForLocation(locationId: string): Promise<void> {
  await api.delete(`${BASE_URL}/locations/${locationId}/schedules`);
}

// ==================== METADATA ====================

/**
 * Get list of supported gender policies.
 */
export async function getSupportedPolicies(): Promise<GenderPolicyInfo[]> {
  return api.get(`${BASE_URL}/policies`).json();
}
