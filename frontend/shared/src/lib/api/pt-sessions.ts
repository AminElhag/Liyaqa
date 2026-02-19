import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  PTSession,
  PTSessionSummary,
  BookPTSessionRequest,
  ReschedulePTSessionRequest,
  CancelPTSessionRequest,
  CompletePTSessionRequest,
  CreateTrainerSessionRequest,
  PTSessionQueryParams,
  AvailableSlot,
} from "../../types/pt-session";
import type {
  GymClass,
  ClassSession,
  CreatePTClassRequest,
  PTDashboardStats,
  PTSessionQueryParams as PTClassQueryParams,
} from "../../types/scheduling";

const TRAINER_PORTAL_SCHEDULE_ENDPOINT = "api/trainer-portal/schedule";
const PT_SESSIONS_ENDPOINT = "api/pt-sessions";
const PT_ADMIN_ENDPOINT = "api/pt";

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

// ==================== Trainer Session Creation ====================

/**
 * Trainer creates a PT session (auto-confirmed).
 */
export async function createTrainerSession(
  data: CreateTrainerSessionRequest
): Promise<PTSession> {
  return api
    .post(`${TRAINER_PORTAL_SCHEDULE_ENDPOINT}/sessions`, { json: data })
    .json();
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

// ==================== PT Class Template Operations ====================

/**
 * Create a PT class template
 */
export async function createPTClass(data: CreatePTClassRequest): Promise<GymClass> {
  return api.post(`${PT_ADMIN_ENDPOINT}/classes`, { json: data }).json();
}

/**
 * Get paginated list of PT classes
 */
export async function getPTClasses(
  params: PTClassQueryParams = {}
): Promise<PaginatedResponse<GymClass>> {
  const searchParams = new URLSearchParams();
  if (params.trainerId) searchParams.set("trainerId", params.trainerId);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  const url = query
    ? `${PT_ADMIN_ENDPOINT}/classes?${query}`
    : `${PT_ADMIN_ENDPOINT}/classes`;
  return api.get(url).json();
}

/**
 * Get a single PT class template by ID
 */
export async function getPTClass(id: UUID): Promise<GymClass> {
  return api.get(`${PT_ADMIN_ENDPOINT}/classes/${id}`).json();
}

/**
 * Update a PT class template
 */
export async function updatePTClass(
  id: UUID,
  data: Partial<CreatePTClassRequest>
): Promise<GymClass> {
  return api.put(`${PT_ADMIN_ENDPOINT}/classes/${id}`, { json: data }).json();
}

// ==================== PT Session Scheduling ====================

/**
 * Schedule a new PT session from a class template
 */
export async function schedulePTSession(data: {
  gymClassId: UUID;
  sessionDate: string;
  startTime: string;
  endTime: string;
  clientAddress?: string;
  notesEn?: string;
  notesAr?: string;
  skipAvailabilityCheck?: boolean;
}): Promise<ClassSession> {
  return api.post(`${PT_ADMIN_ENDPOINT}/sessions`, { json: data }).json();
}

/**
 * Get PT sessions with filters
 */
export async function getScheduledPTSessions(
  params: PTClassQueryParams = {}
): Promise<PaginatedResponse<ClassSession>> {
  const searchParams = new URLSearchParams();
  if (params.trainerId) searchParams.set("trainerId", params.trainerId);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  const url = query
    ? `${PT_ADMIN_ENDPOINT}/sessions?${query}`
    : `${PT_ADMIN_ENDPOINT}/sessions`;
  return api.get(url).json();
}

/**
 * Complete a scheduled PT session with notes
 */
export async function completeScheduledPTSession(
  sessionId: UUID,
  data: { completionNotes?: string; trainerNotes?: string }
): Promise<ClassSession> {
  return api.post(`${PT_ADMIN_ENDPOINT}/sessions/${sessionId}/complete`, { json: data }).json();
}

/**
 * Cancel a scheduled PT session
 */
export async function cancelScheduledPTSession(
  sessionId: UUID,
  data?: { reason?: string }
): Promise<ClassSession> {
  return api.post(`${PT_ADMIN_ENDPOINT}/sessions/${sessionId}/cancel`, { json: data || {} }).json();
}

/**
 * Get PT sessions for a specific trainer
 */
export async function getTrainerPTSessions(
  trainerId: UUID,
  params: { startDate?: string; endDate?: string; page?: number; size?: number } = {}
): Promise<PaginatedResponse<ClassSession>> {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  const url = query
    ? `${PT_ADMIN_ENDPOINT}/trainer/${trainerId}/sessions?${query}`
    : `${PT_ADMIN_ENDPOINT}/trainer/${trainerId}/sessions`;
  return api.get(url).json();
}

// ==================== Dashboard ====================

/**
 * Get PT dashboard stats
 */
export async function getPTDashboardStats(
  params: { trainerId?: UUID } = {}
): Promise<PTDashboardStats> {
  const searchParams = new URLSearchParams();
  if (params.trainerId) searchParams.set("trainerId", params.trainerId);
  const query = searchParams.toString();
  const url = query
    ? `${PT_ADMIN_ENDPOINT}/dashboard?${query}`
    : `${PT_ADMIN_ENDPOINT}/dashboard`;
  return api.get(url).json();
}
