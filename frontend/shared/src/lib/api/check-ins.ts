import { apiClient } from "./client";

const ENDPOINT = "api/members";
const CHECK_INS_ENDPOINT = "api/check-ins";

// Types
export interface CheckInRequest {
  method: CheckInMethod;
  deviceId?: string;
  location?: string;
  notes?: string;
}

export type CheckInMethod =
  | "QR_CODE"
  | "MEMBER_ID"
  | "PHONE"
  | "RFID_CARD"
  | "MANUAL"
  | "BIOMETRIC";

export interface CheckInResponse {
  id: string;
  memberId: string;
  memberName: string;
  memberStatus: string;
  subscriptionStatus?: string;
  subscriptionEndDate?: string;
  checkInTime: string;
  checkOutTime?: string;
  method: CheckInMethod;
  deviceId?: string;
  location?: string;
  processedByUserId?: string;
  notes?: string;
  duration?: string;
  warnings: string[];
  createdAt: string;
}

export interface CheckInHistory {
  id: string;
  memberId: string;
  checkInTime: string;
  checkOutTime?: string;
  method: CheckInMethod;
  deviceId?: string;
  location?: string;
  processedByUserId?: string;
  notes?: string;
  duration?: string;
  isCheckedOut: boolean;
}

export interface CheckInValidation {
  canCheckIn: boolean;
  reason?: string;
  warnings: string[];
}

export interface VisitStats {
  totalVisits: number;
  visitsThisMonth: number;
  visitsThisWeek: number;
  lastVisit?: string;
  averageVisitsPerWeek: number;
  longestStreak: number;
  currentStreak: number;
}

export interface TodayCheckInsResponse {
  totalCheckIns: number;
  checkIns: TodayCheckInItem[];
}

export interface TodayCheckInItem {
  id: string;
  memberId: string;
  memberName: string;
  memberPhoto?: string;
  checkInTime: string;
  checkOutTime?: string;
  method: CheckInMethod;
  isCheckedOut: boolean;
  duration?: string;
}

export interface CheckInHeatmap {
  hourDistribution: Record<number, number>;
  dayDistribution: Record<number, number>;
  startDate: string;
  endDate: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// API Functions

/**
 * Check in a member
 */
export async function checkInMember(
  memberId: string,
  request: CheckInRequest
): Promise<CheckInResponse> {
  return apiClient.post(`${ENDPOINT}/${memberId}/check-in`, { json: request }).json();
}

/**
 * Check out a member
 */
export async function checkOutMember(memberId: string): Promise<CheckInHistory> {
  return apiClient.post(`${ENDPOINT}/${memberId}/check-out`).json();
}

/**
 * Check out by check-in ID
 */
export async function checkOutById(checkInId: string): Promise<CheckInHistory> {
  return apiClient.post(`${CHECK_INS_ENDPOINT}/${checkInId}/check-out`).json();
}

/**
 * Validate if a member can check in
 */
export async function validateCheckIn(memberId: string): Promise<CheckInValidation> {
  return apiClient.get(`${ENDPOINT}/${memberId}/check-in/validate`).json();
}

/**
 * Get check-in history for a member
 */
export async function getCheckInHistory(
  memberId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }
): Promise<PageResponse<CheckInHistory>> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.page !== undefined) searchParams.set("page", params.page.toString());
  if (params?.size !== undefined) searchParams.set("size", params.size.toString());

  const query = searchParams.toString();
  return apiClient.get(`${ENDPOINT}/${memberId}/check-ins${query ? `?${query}` : ""}`).json();
}

/**
 * Get visit statistics for a member
 */
export async function getVisitStats(memberId: string): Promise<VisitStats> {
  return apiClient.get(`${ENDPOINT}/${memberId}/visit-stats`).json();
}

/**
 * Get active check-in for a member
 */
export async function getActiveCheckIn(memberId: string): Promise<CheckInHistory | null> {
  return apiClient.get(`${ENDPOINT}/${memberId}/active-check-in`).json();
}

/**
 * Get today's check-ins
 */
export async function getTodayCheckIns(params?: {
  page?: number;
  size?: number;
}): Promise<TodayCheckInsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", params.page.toString());
  if (params?.size !== undefined) searchParams.set("size", params.size.toString());

  const query = searchParams.toString();
  return apiClient.get(`${CHECK_INS_ENDPOINT}/today${query ? `?${query}` : ""}`).json();
}

/**
 * Get check-ins by date
 */
export async function getCheckInsByDate(
  date: string,
  params?: {
    page?: number;
    size?: number;
  }
): Promise<PageResponse<CheckInHistory>> {
  const searchParams = new URLSearchParams();
  searchParams.set("date", date);
  if (params?.page !== undefined) searchParams.set("page", params.page.toString());
  if (params?.size !== undefined) searchParams.set("size", params.size.toString());

  return apiClient.get(`${CHECK_INS_ENDPOINT}/by-date?${searchParams.toString()}`).json();
}

/**
 * Get check-in heatmap data
 */
export async function getCheckInHeatmap(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<CheckInHeatmap> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);

  const query = searchParams.toString();
  return apiClient.get(`${CHECK_INS_ENDPOINT}/heatmap${query ? `?${query}` : ""}`).json();
}
