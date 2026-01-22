import { api } from "./client";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  GymClass,
  ClassQueryParams,
  CreateClassRequest,
  UpdateClassRequest,
  GenerateSessionsRequest,
  ClassSession,
} from "@/types/scheduling";

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
  return api.post(`api/classes/${classId}/generate-sessions`, { json: data }).json();
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
): Promise<GymClass> {
  return api.post(`api/classes/${classId}/schedules`, { json: schedule }).json();
}

/**
 * Remove schedule from a class
 */
export async function removeSchedule(
  classId: UUID,
  scheduleId: UUID
): Promise<GymClass> {
  return api.delete(`api/classes/${classId}/schedules/${scheduleId}`).json();
}
