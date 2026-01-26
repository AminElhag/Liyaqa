import { api } from "./client";
import type { UUID, PaginatedResponse } from "@/types/api";
import type {
  EquipmentProvider,
  EquipmentProviderConfig,
  EquipmentUnit,
  MemberEquipmentProfile,
  EquipmentWorkout,
  WorkoutStats,
  EquipmentSyncJob,
  CreateProviderConfigRequest,
  UpdateProviderConfigRequest,
  CreateEquipmentUnitRequest,
  UpdateEquipmentUnitRequest,
  CreateMemberProfileRequest,
  UpdateMemberProfileRequest,
  CreateWorkoutRequest,
  StartSyncRequest,
  EquipmentType,
} from "@/types/equipment";

const ENDPOINT = "api/equipment";

// ========== Providers ==========

export async function getEquipmentProviders(): Promise<EquipmentProvider[]> {
  return api.get(`${ENDPOINT}/providers`).json();
}

export async function getEquipmentProvider(id: UUID): Promise<EquipmentProvider> {
  return api.get(`${ENDPOINT}/providers/${id}`).json();
}

// ========== Provider Configs ==========

export async function getProviderConfigs(
  page = 0,
  size = 20
): Promise<PaginatedResponse<EquipmentProviderConfig>> {
  return api.get(`${ENDPOINT}/configs?page=${page}&size=${size}`).json();
}

export async function getProviderConfig(id: UUID): Promise<EquipmentProviderConfig> {
  return api.get(`${ENDPOINT}/configs/${id}`).json();
}

export async function createProviderConfig(
  data: CreateProviderConfigRequest
): Promise<EquipmentProviderConfig> {
  return api.post(`${ENDPOINT}/configs`, { json: data }).json();
}

export async function updateProviderConfig(
  id: UUID,
  data: UpdateProviderConfigRequest
): Promise<EquipmentProviderConfig> {
  return api.put(`${ENDPOINT}/configs/${id}`, { json: data }).json();
}

export async function deleteProviderConfig(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/configs/${id}`);
}

// ========== Equipment Units ==========

export async function getEquipmentUnits(
  page = 0,
  size = 50,
  locationId?: UUID,
  type?: EquipmentType
): Promise<PaginatedResponse<EquipmentUnit>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (locationId) params.append("locationId", locationId);
  if (type) params.append("type", type);
  return api.get(`${ENDPOINT}/units?${params}`).json();
}

export async function getEquipmentUnit(id: UUID): Promise<EquipmentUnit> {
  return api.get(`${ENDPOINT}/units/${id}`).json();
}

export async function createEquipmentUnit(
  data: CreateEquipmentUnitRequest
): Promise<EquipmentUnit> {
  return api.post(`${ENDPOINT}/units`, { json: data }).json();
}

export async function updateEquipmentUnit(
  id: UUID,
  data: UpdateEquipmentUnitRequest
): Promise<EquipmentUnit> {
  return api.put(`${ENDPOINT}/units/${id}`, { json: data }).json();
}

export async function markEquipmentConnected(id: UUID): Promise<EquipmentUnit> {
  return api.post(`${ENDPOINT}/units/${id}/connected`).json();
}

export async function markEquipmentDisconnected(id: UUID): Promise<EquipmentUnit> {
  return api.post(`${ENDPOINT}/units/${id}/disconnected`).json();
}

export async function deleteEquipmentUnit(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/units/${id}`);
}

// ========== Workouts ==========

export async function getWorkouts(
  page = 0,
  size = 50,
  memberId?: UUID,
  equipmentUnitId?: UUID,
  startDate?: string,
  endDate?: string
): Promise<PaginatedResponse<EquipmentWorkout>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (memberId) params.append("memberId", memberId);
  if (equipmentUnitId) params.append("equipmentUnitId", equipmentUnitId);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  return api.get(`${ENDPOINT}/workouts?${params}`).json();
}

export async function getWorkout(id: UUID): Promise<EquipmentWorkout> {
  return api.get(`${ENDPOINT}/workouts/${id}`).json();
}

export async function createWorkout(data: CreateWorkoutRequest): Promise<EquipmentWorkout> {
  return api.post(`${ENDPOINT}/workouts`, { json: data }).json();
}

export async function getMemberWorkoutStats(memberId: UUID): Promise<WorkoutStats> {
  return api.get(`${ENDPOINT}/members/${memberId}/stats`).json();
}

// ========== Member Profiles ==========

export async function getMemberEquipmentProfiles(
  memberId: UUID
): Promise<MemberEquipmentProfile[]> {
  return api.get(`${ENDPOINT}/members/${memberId}/profiles`).json();
}

export async function createMemberProfile(
  data: CreateMemberProfileRequest
): Promise<MemberEquipmentProfile> {
  return api.post(`${ENDPOINT}/profiles`, { json: data }).json();
}

export async function updateMemberProfile(
  id: UUID,
  data: UpdateMemberProfileRequest
): Promise<MemberEquipmentProfile> {
  return api.put(`${ENDPOINT}/profiles/${id}`, { json: data }).json();
}

export async function deleteMemberProfile(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/profiles/${id}`);
}

// ========== Sync Jobs ==========

export async function startSync(
  configId: UUID,
  data: StartSyncRequest = {}
): Promise<EquipmentSyncJob> {
  return api.post(`${ENDPOINT}/configs/${configId}/sync`, { json: data }).json();
}

export async function getSyncJobs(
  configId: UUID,
  page = 0,
  size = 20
): Promise<PaginatedResponse<EquipmentSyncJob>> {
  return api.get(`${ENDPOINT}/configs/${configId}/sync-jobs?page=${page}&size=${size}`).json();
}
