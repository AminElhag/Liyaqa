"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { UUID, PaginatedResponse } from "../types/api";
import {
  getEquipmentProviders,
  getEquipmentProvider,
  getProviderConfigs,
  getProviderConfig,
  createProviderConfig,
  updateProviderConfig,
  deleteProviderConfig,
  getEquipmentUnits,
  getEquipmentUnit,
  createEquipmentUnit,
  updateEquipmentUnit,
  markEquipmentConnected,
  markEquipmentDisconnected,
  deleteEquipmentUnit,
  getWorkouts,
  getWorkout,
  createWorkout,
  getMemberWorkoutStats,
  getMemberEquipmentProfiles,
  createMemberProfile,
  updateMemberProfile,
  deleteMemberProfile,
  startSync,
  getSyncJobs,
} from "../lib/api/equipment";
import type {
  EquipmentProvider,
  EquipmentProviderConfig,
  EquipmentUnit,
  EquipmentWorkout,
  WorkoutStats,
  MemberEquipmentProfile,
  EquipmentSyncJob,
  CreateProviderConfigRequest,
  UpdateProviderConfigRequest,
  CreateEquipmentUnitRequest,
  UpdateEquipmentUnitRequest,
  CreateWorkoutRequest,
  CreateMemberProfileRequest,
  UpdateMemberProfileRequest,
  StartSyncRequest,
  EquipmentType,
} from "../types/equipment";

// Query keys
export const equipmentKeys = {
  all: ["equipment"] as const,
  providers: () => [...equipmentKeys.all, "providers"] as const,
  providerDetail: (id: UUID) => [...equipmentKeys.providers(), id] as const,
  configs: () => [...equipmentKeys.all, "configs"] as const,
  configsList: (page: number, size: number) =>
    [...equipmentKeys.configs(), "list", page, size] as const,
  configDetail: (id: UUID) => [...equipmentKeys.configs(), id] as const,
  units: () => [...equipmentKeys.all, "units"] as const,
  unitsList: (page: number, size: number, locationId?: UUID, type?: EquipmentType) =>
    [...equipmentKeys.units(), "list", page, size, locationId, type] as const,
  unitDetail: (id: UUID) => [...equipmentKeys.units(), id] as const,
  workouts: () => [...equipmentKeys.all, "workouts"] as const,
  workoutsList: (params: { page: number; size: number; memberId?: UUID; equipmentUnitId?: UUID }) =>
    [...equipmentKeys.workouts(), "list", params] as const,
  workoutDetail: (id: UUID) => [...equipmentKeys.workouts(), id] as const,
  memberStats: (memberId: UUID) => [...equipmentKeys.all, "member-stats", memberId] as const,
  memberProfiles: (memberId: UUID) => [...equipmentKeys.all, "member-profiles", memberId] as const,
  syncJobs: (configId: UUID, page: number, size: number) =>
    [...equipmentKeys.configs(), configId, "sync-jobs", page, size] as const,
};

// ========== Providers ==========

export function useEquipmentProviders(
  options?: Omit<UseQueryOptions<EquipmentProvider[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: equipmentKeys.providers(),
    queryFn: getEquipmentProviders,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}

export function useEquipmentProvider(
  id: UUID,
  options?: Omit<UseQueryOptions<EquipmentProvider>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: equipmentKeys.providerDetail(id),
    queryFn: () => getEquipmentProvider(id),
    enabled: !!id,
    ...options,
  });
}

// ========== Provider Configs ==========

export function useProviderConfigs(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<EquipmentProviderConfig>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: equipmentKeys.configsList(page, size),
    queryFn: () => getProviderConfigs(page, size),
    ...options,
  });
}

export function useProviderConfig(
  id: UUID,
  options?: Omit<UseQueryOptions<EquipmentProviderConfig>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: equipmentKeys.configDetail(id),
    queryFn: () => getProviderConfig(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateProviderConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProviderConfigRequest) => createProviderConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.configs() });
    },
  });
}

export function useUpdateProviderConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateProviderConfigRequest }) =>
      updateProviderConfig(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(equipmentKeys.configDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: equipmentKeys.configs() });
    },
  });
}

export function useDeleteProviderConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteProviderConfig(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: equipmentKeys.configDetail(id) });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.configs() });
    },
  });
}

// ========== Equipment Units ==========

export function useEquipmentUnits(
  page = 0,
  size = 50,
  locationId?: UUID,
  type?: EquipmentType,
  options?: Omit<UseQueryOptions<PaginatedResponse<EquipmentUnit>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: equipmentKeys.unitsList(page, size, locationId, type),
    queryFn: () => getEquipmentUnits(page, size, locationId, type),
    ...options,
  });
}

export function useEquipmentUnit(
  id: UUID,
  options?: Omit<UseQueryOptions<EquipmentUnit>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: equipmentKeys.unitDetail(id),
    queryFn: () => getEquipmentUnit(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateEquipmentUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEquipmentUnitRequest) => createEquipmentUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.units() });
    },
  });
}

export function useUpdateEquipmentUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateEquipmentUnitRequest }) =>
      updateEquipmentUnit(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(equipmentKeys.unitDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: equipmentKeys.units() });
    },
  });
}

export function useMarkEquipmentConnected() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => markEquipmentConnected(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(equipmentKeys.unitDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: equipmentKeys.units() });
    },
  });
}

export function useMarkEquipmentDisconnected() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => markEquipmentDisconnected(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(equipmentKeys.unitDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: equipmentKeys.units() });
    },
  });
}

export function useDeleteEquipmentUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteEquipmentUnit(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: equipmentKeys.unitDetail(id) });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.units() });
    },
  });
}

// ========== Workouts ==========

export function useWorkouts(
  page = 0,
  size = 50,
  memberId?: UUID,
  equipmentUnitId?: UUID,
  options?: Omit<UseQueryOptions<PaginatedResponse<EquipmentWorkout>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: equipmentKeys.workoutsList({ page, size, memberId, equipmentUnitId }),
    queryFn: () => getWorkouts(page, size, memberId, equipmentUnitId),
    ...options,
  });
}

export function useWorkout(
  id: UUID,
  options?: Omit<UseQueryOptions<EquipmentWorkout>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: equipmentKeys.workoutDetail(id),
    queryFn: () => getWorkout(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkoutRequest) => createWorkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.workouts() });
    },
  });
}

export function useMemberWorkoutStats(
  memberId: UUID,
  options?: Omit<UseQueryOptions<WorkoutStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: equipmentKeys.memberStats(memberId),
    queryFn: () => getMemberWorkoutStats(memberId),
    enabled: !!memberId,
    ...options,
  });
}

// ========== Member Profiles ==========

export function useMemberEquipmentProfiles(
  memberId: UUID,
  options?: Omit<UseQueryOptions<MemberEquipmentProfile[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: equipmentKeys.memberProfiles(memberId),
    queryFn: () => getMemberEquipmentProfiles(memberId),
    enabled: !!memberId,
    ...options,
  });
}

export function useCreateMemberProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberProfileRequest) => createMemberProfile(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.memberProfiles(created.memberId),
      });
    },
  });
}

export function useUpdateMemberProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateMemberProfileRequest }) =>
      updateMemberProfile(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.memberProfiles(updated.memberId),
      });
    },
  });
}

export function useDeleteMemberProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteMemberProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
  });
}

// ========== Sync Jobs ==========

export function useSyncJobs(
  configId: UUID,
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<EquipmentSyncJob>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: equipmentKeys.syncJobs(configId, page, size),
    queryFn: () => getSyncJobs(configId, page, size),
    enabled: !!configId,
    ...options,
  });
}

export function useStartSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ configId, data }: { configId: UUID; data?: StartSyncRequest }) =>
      startSync(configId, data),
    onSuccess: (job) => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.syncJobs(job.providerConfigId, 0, 20),
      });
    },
  });
}
