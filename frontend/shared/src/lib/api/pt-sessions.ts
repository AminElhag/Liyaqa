import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  PTSession,
  PTSessionSummary,
  BookPTSessionRequest,
  ReschedulePTSessionRequest,
  CancelPTSessionRequest,
  CompletePTSessionRequest,
  PTSessionQueryParams,
  AvailableSlot,
} from "../../types/pt-session";

const PT_SESSIONS_ENDPOINT = "api/pt-sessions";

/**
 * Build query string from params
 */
function buildQueryString(params: PTSessionQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.trainerId) searchParams.set("trainerId", params.trainerId);
  if (params.memberId) searchParams.set("memberId", params.memberId);
  if (params.status) searchParams.set("status", params.status);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  return searchParams.toString();
}

// ==================== CRUD Operations ====================

/**
 * Get paginated list of PT sessions (admin)
 */
export async function getPTSessions(
  params: PTSessionQueryParams = {}
): Promise<PaginatedResponse<PTSessionSummary>> {
  const query = buildQueryString(params);
  const url = query ? `${PT_SESSIONS_ENDPOINT}?${query}` : PT_SESSIONS_ENDPOINT;
  return api.get(url).json();
}

/**
 * Get PT session by ID
 */
export async function getPTSession(id: UUID): Promise<PTSession> {
  return api.get(`${PT_SESSIONS_ENDPOINT}/${id}`).json();
}

/**
 * Book a new PT session (member)
 */
export async function bookPTSession(data: BookPTSessionRequest): Promise<PTSession> {
  return api.post(PT_SESSIONS_ENDPOINT, { json: data }).json();
}

/**
 * Delete a PT session (admin only)
 */
export async function deletePTSession(id: UUID): Promise<void> {
  await api.delete(`${PT_SESSIONS_ENDPOINT}/${id}`);
}

// ==================== Trainer Operations ====================

/**
 * Confirm a PT session (trainer)
 */
export async function confirmPTSession(id: UUID): Promise<PTSession> {
  return api.post(`${PT_SESSIONS_ENDPOINT}/${id}/confirm`).json();
}

/**
 * Start a PT session (trainer)
 */
export async function startPTSession(id: UUID): Promise<PTSession> {
  return api.post(`${PT_SESSIONS_ENDPOINT}/${id}/start`).json();
}

/**
 * Complete a PT session (trainer)
 */
export async function completePTSession(
  id: UUID,
  data?: CompletePTSessionRequest
): Promise<PTSession> {
  return api.post(`${PT_SESSIONS_ENDPOINT}/${id}/complete`, { json: data || {} }).json();
}

/**
 * Mark member as no-show (trainer)
 */
export async function markPTSessionNoShow(id: UUID): Promise<PTSession> {
  return api.post(`${PT_SESSIONS_ENDPOINT}/${id}/no-show`).json();
}

/**
 * Reschedule a PT session (trainer)
 */
export async function reschedulePTSession(
  id: UUID,
  data: ReschedulePTSessionRequest
): Promise<PTSession> {
  return api.post(`${PT_SESSIONS_ENDPOINT}/${id}/reschedule`, { json: data }).json();
}

// ==================== Cancel Operation ====================

/**
 * Cancel a PT session (trainer or member)
 */
export async function cancelPTSession(
  id: UUID,
  data?: CancelPTSessionRequest
): Promise<PTSession> {
  return api.post(`${PT_SESSIONS_ENDPOINT}/${id}/cancel`, { json: data || {} }).json();
}

// ==================== Trainer's Sessions ====================

/**
 * Get pending sessions for current trainer
 */
export async function getMyPendingPTSessions(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<PTSessionSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  const url = query
    ? `${PT_SESSIONS_ENDPOINT}/my/pending?${query}`
    : `${PT_SESSIONS_ENDPOINT}/my/pending`;
  return api.get(url).json();
}

/**
 * Get upcoming sessions for current trainer
 */
export async function getMyUpcomingPTSessions(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<PTSessionSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  const url = query
    ? `${PT_SESSIONS_ENDPOINT}/my/upcoming?${query}`
    : `${PT_SESSIONS_ENDPOINT}/my/upcoming`;
  return api.get(url).json();
}

// ==================== Member's Sessions ====================

/**
 * Get upcoming PT sessions for current member
 */
export async function getMemberUpcomingPTSessions(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<PTSessionSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  const url = query
    ? `${PT_SESSIONS_ENDPOINT}/member/upcoming?${query}`
    : `${PT_SESSIONS_ENDPOINT}/member/upcoming`;
  return api.get(url).json();
}

// ==================== Availability ====================

/**
 * Get trainer availability for PT booking on a specific date
 */
export async function getPTTrainerAvailability(
  trainerId: UUID,
  date: string,
  slotDurationMinutes: number = 60
): Promise<AvailableSlot[]> {
  const params = new URLSearchParams({
    date,
    slotDurationMinutes: String(slotDurationMinutes),
  });
  return api.get(`${PT_SESSIONS_ENDPOINT}/trainers/${trainerId}/availability?${params}`).json();
}
