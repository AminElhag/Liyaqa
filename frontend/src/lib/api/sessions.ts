import { api } from "./client";
import type { PaginatedResponse, UUID, LocalizedText } from "@/types/api";
import type {
  ClassSession,
  SessionQueryParams,
  Booking,
} from "@/types/scheduling";

/**
 * Create session request
 */
export interface CreateSessionRequest {
  classId: UUID;
  date: string;
  startTime: string;
  endTime: string;
  trainerId?: UUID;
  capacity?: number;
}

/**
 * Update session request
 */
export interface UpdateSessionRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  trainerId?: UUID;
  capacity?: number;
}

/**
 * Get paginated sessions
 */
export async function getSessions(
  params: SessionQueryParams = {}
): Promise<PaginatedResponse<ClassSession>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.classId) searchParams.set("classId", params.classId);
  if (params.date) searchParams.set("date", params.date);
  // Backend expects startDate/endDate, not dateFrom/dateTo
  if (params.dateFrom) searchParams.set("startDate", params.dateFrom);
  if (params.dateTo) searchParams.set("endDate", params.dateTo);
  if (params.status) searchParams.set("status", params.status);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.direction) searchParams.set("direction", params.direction);

  const queryString = searchParams.toString();
  const url = queryString ? `api/classes/sessions?${queryString}` : "api/classes/sessions";

  return api.get(url).json();
}

/**
 * Get sessions for a specific date
 */
export async function getSessionsByDate(
  date: string
): Promise<ClassSession[]> {
  const response = await api
    .get(`api/classes/sessions/date/${date}?size=100`)
    .json<PaginatedResponse<ClassSession>>();
  return response.content;
}

/**
 * Get sessions for a date range
 */
export async function getSessionsByDateRange(
  dateFrom: string,
  dateTo: string
): Promise<ClassSession[]> {
  const response = await api
    .get(`api/classes/sessions?startDate=${dateFrom}&endDate=${dateTo}&size=100`)
    .json<PaginatedResponse<ClassSession>>();
  return response.content;
}

/**
 * Get a single session by ID
 */
export async function getSession(id: UUID): Promise<ClassSession> {
  return api.get(`api/classes/sessions/${id}`).json();
}

/**
 * Get bookings for a session
 */
export async function getSessionBookings(
  sessionId: UUID
): Promise<Booking[]> {
  return api.get(`api/bookings/session/${sessionId}`).json();
}

/**
 * Cancel a session
 */
export async function cancelSession(id: UUID): Promise<ClassSession> {
  return api.post(`api/classes/sessions/${id}/cancel`).json();
}

/**
 * Start a session (mark as in progress)
 */
export async function startSession(id: UUID): Promise<ClassSession> {
  return api.post(`api/classes/sessions/${id}/start`).json();
}

/**
 * Complete a session
 */
export async function completeSession(id: UUID): Promise<ClassSession> {
  return api.post(`api/classes/sessions/${id}/complete`).json();
}

/**
 * Get upcoming sessions (next 7 days)
 */
export async function getUpcomingSessions(): Promise<ClassSession[]> {
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  return getSessionsByDateRange(today, nextWeek);
}

/**
 * Get sessions for a specific class
 */
export async function getSessionsByClass(
  classId: UUID,
  params: Omit<SessionQueryParams, "classId"> = {}
): Promise<PaginatedResponse<ClassSession>> {
  return getSessions({ ...params, classId });
}

/**
 * Get upcoming sessions for a specific class (next 14 days)
 */
export async function getUpcomingSessionsByClass(
  classId: UUID
): Promise<ClassSession[]> {
  const today = new Date().toISOString().split("T")[0];
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const response = await getSessions({
    classId,
    dateFrom: today,
    dateTo: twoWeeks,
    size: 50,
    sort: "date",
    direction: "asc",
  });
  return response.content;
}

/**
 * Create a new session
 */
export async function createSession(
  data: CreateSessionRequest
): Promise<ClassSession> {
  return api.post("api/classes/sessions", { json: data }).json();
}

/**
 * Update a session
 */
export async function updateSession(
  id: UUID,
  data: UpdateSessionRequest
): Promise<ClassSession> {
  return api.put(`api/classes/sessions/${id}`, { json: data }).json();
}

/**
 * Session QR code response
 */
export interface SessionQrCodeResponse {
  sessionId: UUID;
  token: string;
  expiresAt: string;
}

/**
 * Get QR code for session check-in (for trainers)
 */
export async function getSessionQrCode(
  sessionId: UUID
): Promise<SessionQrCodeResponse> {
  return api.get(`api/qr/session/${sessionId}`).json();
}

