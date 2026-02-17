import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  Trainer,
  TrainerSummary,
  TrainerClubAssignment,
  CreateTrainerRequest,
  UpdateTrainerProfileRequest,
  UpdateTrainerBasicInfoRequest,
  UpdateAvailabilityRequest,
  UpdateTrainerSkillsRequest,
  AssignTrainerToClubRequest,
  TrainerQueryParams,
  Availability,
  AvailableTimeSlot,
} from "../../types/trainer";

const TRAINERS_ENDPOINT = "api/trainers";

/**
 * Build query string from params
 */
function buildQueryString(params: TrainerQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.trainerType) searchParams.set("trainerType", params.trainerType);
  if (params.employmentType) searchParams.set("employmentType", params.employmentType);
  if (params.search) searchParams.set("search", params.search);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  return searchParams.toString();
}

// ==================== CRUD Operations ====================

/**
 * Get paginated list of trainers
 */
export async function getTrainers(
  params: TrainerQueryParams = {}
): Promise<PaginatedResponse<TrainerSummary>> {
  const query = buildQueryString(params);
  const url = query ? `${TRAINERS_ENDPOINT}?${query}` : TRAINERS_ENDPOINT;
  return api.get(url).json();
}

/**
 * Get trainer by ID
 */
export async function getTrainer(id: UUID): Promise<Trainer> {
  return api.get(`${TRAINERS_ENDPOINT}/${id}`).json();
}

/**
 * Create a new trainer
 */
export async function createTrainer(data: CreateTrainerRequest): Promise<Trainer> {
  return api.post(TRAINERS_ENDPOINT, { json: data }).json();
}

/**
 * Update trainer profile
 */
export async function updateTrainerProfile(
  id: UUID,
  data: UpdateTrainerProfileRequest
): Promise<Trainer> {
  return api.patch(`${TRAINERS_ENDPOINT}/${id}`, { json: data }).json();
}

/**
 * Update trainer basic info (display name, date of birth, gender)
 */
export async function updateTrainerBasicInfo(
  id: UUID,
  data: UpdateTrainerBasicInfoRequest
): Promise<Trainer> {
  return api.patch(`${TRAINERS_ENDPOINT}/${id}/basic-info`, { json: data }).json();
}

/**
 * Delete a trainer
 */
export async function deleteTrainer(id: UUID): Promise<void> {
  await api.delete(`${TRAINERS_ENDPOINT}/${id}`);
}

// ==================== Status Operations ====================

/**
 * Activate a trainer
 */
export async function activateTrainer(id: UUID): Promise<Trainer> {
  return api.post(`${TRAINERS_ENDPOINT}/${id}/activate`).json();
}

/**
 * Deactivate a trainer
 */
export async function deactivateTrainer(id: UUID): Promise<Trainer> {
  return api.post(`${TRAINERS_ENDPOINT}/${id}/deactivate`).json();
}

/**
 * Set trainer on leave
 */
export async function setTrainerOnLeave(id: UUID): Promise<Trainer> {
  return api.post(`${TRAINERS_ENDPOINT}/${id}/set-on-leave`).json();
}

/**
 * Terminate a trainer
 */
export async function terminateTrainer(id: UUID): Promise<Trainer> {
  return api.post(`${TRAINERS_ENDPOINT}/${id}/terminate`).json();
}

// ==================== Availability Operations ====================

/**
 * Get trainer availability
 */
export async function getTrainerAvailability(id: UUID): Promise<Availability | null> {
  return api.get(`${TRAINERS_ENDPOINT}/${id}/availability`).json();
}

/**
 * Update trainer availability
 */
export async function updateTrainerAvailability(
  id: UUID,
  data: UpdateAvailabilityRequest
): Promise<Trainer> {
  return api.put(`${TRAINERS_ENDPOINT}/${id}/availability`, { json: data }).json();
}

/**
 * Get available time slots for a trainer on a specific date
 */
export async function getTrainerAvailableSlots(
  id: UUID,
  date: string,
  slotDurationMinutes: number = 60
): Promise<AvailableTimeSlot[]> {
  const params = new URLSearchParams({
    date,
    slotDurationMinutes: String(slotDurationMinutes),
  });
  return api.get(`api/pt-sessions/trainers/${id}/availability?${params}`).json();
}

// ==================== Skills Operations ====================

/**
 * Update trainer skills (class categories)
 */
export async function updateTrainerSkills(
  id: UUID,
  data: UpdateTrainerSkillsRequest
): Promise<Trainer> {
  return api.put(`${TRAINERS_ENDPOINT}/${id}/skills`, { json: data }).json();
}

// ==================== Club Assignment Operations ====================

/**
 * Get trainer's club assignments
 */
export async function getTrainerClubs(id: UUID): Promise<TrainerClubAssignment[]> {
  return api.get(`${TRAINERS_ENDPOINT}/${id}/clubs`).json();
}

/**
 * Assign trainer to a club
 */
export async function assignTrainerToClub(
  id: UUID,
  data: AssignTrainerToClubRequest
): Promise<TrainerClubAssignment> {
  return api.post(`${TRAINERS_ENDPOINT}/${id}/clubs`, { json: data }).json();
}

/**
 * Remove trainer from a club
 */
export async function removeTrainerFromClub(
  trainerId: UUID,
  clubId: UUID
): Promise<void> {
  await api.delete(`${TRAINERS_ENDPOINT}/${trainerId}/clubs/${clubId}`);
}

// ==================== Current Trainer Operations ====================

/**
 * Get current user's trainer profile
 */
export async function getMyTrainerProfile(): Promise<Trainer> {
  return api.get(`${TRAINERS_ENDPOINT}/me`).json();
}

/**
 * Get classes for current trainer
 */
export async function getMyClasses(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<unknown>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  const url = query ? `${TRAINERS_ENDPOINT}/me/classes?${query}` : `${TRAINERS_ENDPOINT}/me/classes`;
  return api.get(url).json();
}

/**
 * Get sessions for current trainer
 */
export async function getMySessions(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<unknown>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  const url = query ? `${TRAINERS_ENDPOINT}/me/sessions?${query}` : `${TRAINERS_ENDPOINT}/me/sessions`;
  return api.get(url).json();
}

// ==================== Query Operations ====================

/**
 * Get trainers by club
 */
export async function getTrainersByClub(
  clubId: UUID,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<TrainerSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  const url = query
    ? `${TRAINERS_ENDPOINT}/club/${clubId}?${query}`
    : `${TRAINERS_ENDPOINT}/club/${clubId}`;
  return api.get(url).json();
}

/**
 * Get active trainers available for personal training
 */
export async function getAvailableTrainers(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<TrainerSummary>> {
  return getTrainers({
    ...params,
    status: "ACTIVE",
  });
}

/**
 * Get trainers available for PT booking (member view)
 */
export async function getAvailableTrainersForPT(
  params: TrainerQueryParams = {}
): Promise<PaginatedResponse<TrainerSummary>> {
  return getTrainers({
    ...params,
    status: "ACTIVE",
  });
}
