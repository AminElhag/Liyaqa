import { api } from "./client";
import type { UUID, PaginatedResponse } from "../../types/api";
import type {
  WearablePlatform,
  MemberWearableConnection,
  WearableDailyActivity,
  WearableWorkout,
  WearableWorkoutStats,
  WearableActivityStats,
  WearableSyncJob,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  UpdateConnectionTokensRequest,
  CreateDailyActivityRequest,
  CreateWearableWorkoutRequest,
  StartSyncRequest,
} from "../../types/wearable";

const ENDPOINT = "api/wearables";

// ========== Platforms ==========

export async function getWearablePlatforms(): Promise<WearablePlatform[]> {
  return api.get(`${ENDPOINT}/platforms`).json();
}

export async function getWearablePlatform(id: UUID): Promise<WearablePlatform> {
  return api.get(`${ENDPOINT}/platforms/${id}`).json();
}

// ========== Connections ==========

export async function getWearableConnections(
  page = 0,
  size = 20
): Promise<PaginatedResponse<MemberWearableConnection>> {
  return api.get(`${ENDPOINT}/connections?page=${page}&size=${size}`).json();
}

export async function getMemberWearableConnections(
  memberId: UUID
): Promise<MemberWearableConnection[]> {
  return api.get(`${ENDPOINT}/members/${memberId}/connections`).json();
}

export async function getWearableConnection(id: UUID): Promise<MemberWearableConnection> {
  return api.get(`${ENDPOINT}/connections/${id}`).json();
}

export async function createWearableConnection(
  data: CreateConnectionRequest
): Promise<MemberWearableConnection> {
  return api.post(`${ENDPOINT}/connections`, { json: data }).json();
}

export async function updateWearableConnection(
  id: UUID,
  data: UpdateConnectionRequest
): Promise<MemberWearableConnection> {
  return api.put(`${ENDPOINT}/connections/${id}`, { json: data }).json();
}

export async function updateWearableConnectionTokens(
  id: UUID,
  data: UpdateConnectionTokensRequest
): Promise<MemberWearableConnection> {
  return api.post(`${ENDPOINT}/connections/${id}/tokens`, { json: data }).json();
}

export async function disconnectWearable(id: UUID): Promise<MemberWearableConnection> {
  return api.post(`${ENDPOINT}/connections/${id}/disconnect`).json();
}

export async function deleteWearableConnection(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/connections/${id}`);
}

// ========== Daily Activities ==========

export async function getMemberDailyActivities(
  memberId: UUID,
  page = 0,
  size = 30,
  startDate?: string,
  endDate?: string
): Promise<PaginatedResponse<WearableDailyActivity> | WearableDailyActivity[]> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  return api.get(`${ENDPOINT}/members/${memberId}/activities?${params}`).json();
}

export async function getDailyActivity(id: UUID): Promise<WearableDailyActivity> {
  return api.get(`${ENDPOINT}/activities/${id}`).json();
}

export async function getLatestDailyActivity(memberId: UUID): Promise<WearableDailyActivity> {
  return api.get(`${ENDPOINT}/members/${memberId}/activities/latest`).json();
}

export async function createDailyActivity(
  data: CreateDailyActivityRequest
): Promise<WearableDailyActivity> {
  return api.post(`${ENDPOINT}/activities`, { json: data }).json();
}

// ========== Workouts ==========

export async function getMemberWearableWorkouts(
  memberId: UUID,
  page = 0,
  size = 50,
  startDate?: string,
  endDate?: string
): Promise<PaginatedResponse<WearableWorkout> | WearableWorkout[]> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  return api.get(`${ENDPOINT}/members/${memberId}/workouts?${params}`).json();
}

export async function getWearableWorkout(id: UUID): Promise<WearableWorkout> {
  return api.get(`${ENDPOINT}/workouts/${id}`).json();
}

export async function createWearableWorkout(
  data: CreateWearableWorkoutRequest
): Promise<WearableWorkout> {
  return api.post(`${ENDPOINT}/workouts`, { json: data }).json();
}

// ========== Stats ==========

export async function getMemberWorkoutStats(memberId: UUID): Promise<WearableWorkoutStats> {
  return api.get(`${ENDPOINT}/members/${memberId}/stats/workouts`).json();
}

export async function getMemberActivityStats(
  memberId: UUID,
  days = 30
): Promise<WearableActivityStats> {
  return api.get(`${ENDPOINT}/members/${memberId}/stats/activities?days=${days}`).json();
}

// ========== Sync Jobs ==========

export async function startWearableSync(
  connectionId: UUID,
  data: StartSyncRequest = {}
): Promise<WearableSyncJob> {
  return api.post(`${ENDPOINT}/connections/${connectionId}/sync`, { json: data }).json();
}

export async function getWearableSyncJobs(
  connectionId: UUID,
  page = 0,
  size = 20
): Promise<PaginatedResponse<WearableSyncJob>> {
  return api.get(`${ENDPOINT}/connections/${connectionId}/sync-jobs?page=${page}&size=${size}`).json();
}

export async function getWearableSyncJob(id: UUID): Promise<WearableSyncJob> {
  return api.get(`${ENDPOINT}/sync-jobs/${id}`).json();
}
