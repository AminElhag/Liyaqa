import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  GymClass,
  ClassQueryParams,
  CreateClassRequest,
  UpdateClassRequest,
  GenerateSessionsRequest,
  ClassSession,
  ClassSchedule,
} from "../../types/scheduling";

/**
 * Map backend ClassSessionResponse field names to frontend ClassSession field names.
 * Backend sends: gymClassId, sessionDate, maxCapacity, currentBookings
 * Frontend expects: classId, date, capacity, bookedCount
 */
function mapSession(raw: Record<string, unknown>): ClassSession {
  return {
    ...raw,
    classId: raw.gymClassId ?? raw.classId,
    date: raw.sessionDate ?? raw.date,
    capacity: raw.maxCapacity ?? raw.capacity,
    bookedCount: raw.currentBookings ?? raw.bookedCount,
  } as ClassSession;
}

/**
 * Get paginated classes
 */
export async function getClasses(
  params: ClassQueryParams = {}
): Promise<PaginatedResponse<GymClass>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.status) searchParams.set("status", params.status);
  if (params.trainerId) searchParams.set("trainerId", params.trainerId);
  if (params.locationId) searchParams.set("locationId", params.locationId);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.direction) searchParams.set("direction", params.direction);

  const queryString = searchParams.toString();
  const url = queryString ? `api/classes?${queryString}` : "api/classes";

  return api.get(url).json();
}

/**
 * Get active classes (for dropdowns)
 */
export async function getActiveClasses(): Promise<GymClass[]> {
  const response = await api
    .get("api/classes?status=ACTIVE&size=100")
    .json<PaginatedResponse<GymClass>>();
  return response.content;
}

/**
 * Get a single class by ID
 */
export async function getClass(id: UUID): Promise<GymClass> {
  return api.get(`api/classes/${id}`).json();
}

/**
 * Create a new class
 */
export async function createClass(data: CreateClassRequest): Promise<GymClass> {
  return api.post("api/classes", { json: data }).json();
}

/**
 * Update a class
 */
export async function updateClass(
  id: UUID,
  data: UpdateClassRequest
): Promise<GymClass> {
  return api.put(`api/classes/${id}`, { json: data }).json();
}

/**
 * Delete a class
 */
export async function deleteClass(id: UUID): Promise<void> {
  await api.delete(`api/classes/${id}`);
}

/**
 * Activate a class
 */
export async function activateClass(id: UUID): Promise<GymClass> {
  return api.post(`api/classes/${id}/activate`).json();
}

/**
 * Deactivate a class
 */
export async function deactivateClass(id: UUID): Promise<GymClass> {
  return api.post(`api/classes/${id}/deactivate`).json();
}

/**
 * Generate sessions for a class
 */
export async function generateSessions(
  classId: UUID,
  data: GenerateSessionsRequest
): Promise<ClassSession[]> {
  const raw: Record<string, unknown>[] = await api.post("api/classes/sessions/generate", {
    json: {
      gymClassId: classId,
      fromDate: data.startDate,
      toDate: data.endDate,
    },
  }).json();
  return raw.map(mapSession);
}

/**
 * Add schedule to a class
 */
export async function addSchedule(
  classId: UUID,
  schedule: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }
): Promise<ClassSchedule> {
  return api.post(`api/classes/${classId}/schedules`, { json: schedule }).json();
}

/**
 * Remove schedule from a class
 */
export async function removeSchedule(
  classId: UUID,
  scheduleId: UUID
): Promise<void> {
  await api.delete(`api/classes/${classId}/schedules/${scheduleId}`);
}

/**
 * Create a single class session
 */
export async function createSession(data: {
  classId: UUID;
  date: string;
  startTime: string;
  endTime: string;
  capacity?: number;
}): Promise<ClassSession> {
  const raw: Record<string, unknown> = await api.post("api/classes/sessions", { json: data }).json();
  return mapSession(raw);
}

/**
 * Get a single session by ID
 */
export async function getSession(id: UUID): Promise<ClassSession> {
  const raw: Record<string, unknown> = await api.get(`api/classes/sessions/${id}`).json();
  return mapSession(raw);
}

/**
 * Update a class session
 */
export async function updateSession(
  id: UUID,
  data: {
    date?: string;
    startTime?: string;
    endTime?: string;
    capacity?: number;
  }
): Promise<ClassSession> {
  const raw: Record<string, unknown> = await api.put(`api/classes/sessions/${id}`, { json: data }).json();
  return mapSession(raw);
}

/**
 * Get sessions by date
 */
export async function getSessionsByDate(date: string): Promise<ClassSession[]> {
  const raw: Record<string, unknown>[] = await api.get(`api/classes/sessions/date/${date}`).json();
  return raw.map(mapSession);
}

/**
 * Get sessions by date range and other filters
 */
export async function getSessions(params: {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  locationId?: string;
  trainerId?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<ClassSession>> {
  const searchParams = new URLSearchParams();

  if (params.dateFrom) searchParams.set("startDate", params.dateFrom);
  if (params.dateTo) searchParams.set("endDate", params.dateTo);
  if (params.status) searchParams.set("status", params.status);
  if (params.locationId) searchParams.set("locationId", params.locationId);
  if (params.trainerId) searchParams.set("trainerId", params.trainerId);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString ? `api/classes/sessions?${queryString}` : "api/classes/sessions";

  const res: PaginatedResponse<Record<string, unknown>> = await api.get(url).json();
  return { ...res, content: res.content.map(mapSession) };
}

/**
 * Get upcoming sessions for a class
 */
export async function getUpcomingSessionsByClass(
  classId: UUID,
  params?: { page?: number; size?: number }
): Promise<PaginatedResponse<ClassSession>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/classes/${classId}/sessions/upcoming?${queryString}`
    : `api/classes/${classId}/sessions/upcoming`;

  const res: PaginatedResponse<Record<string, unknown>> = await api.get(url).json();
  return { ...res, content: res.content.map(mapSession) };
}

/**
 * Cancel a session
 */
export async function cancelSession(
  id: UUID,
  reason?: string
): Promise<ClassSession> {
  const raw: Record<string, unknown> = await api
    .post(`api/classes/sessions/${id}/cancel`, {
      json: reason ? { reason } : {},
    })
    .json();
  return mapSession(raw);
}

/**
 * Start a session
 */
export async function startSession(id: UUID): Promise<ClassSession> {
  const raw: Record<string, unknown> = await api.post(`api/classes/sessions/${id}/start`).json();
  return mapSession(raw);
}

/**
 * Complete a session
 */
export async function completeSession(id: UUID): Promise<ClassSession> {
  const raw: Record<string, unknown> = await api.post(`api/classes/sessions/${id}/complete`).json();
  return mapSession(raw);
}
