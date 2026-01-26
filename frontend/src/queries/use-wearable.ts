"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { UUID, PaginatedResponse } from "@/types/api";
import {
  getWearablePlatforms,
  getWearablePlatform,
  getWearableConnections,
  getMemberWearableConnections,
  getWearableConnection,
  createWearableConnection,
  updateWearableConnection,
  updateWearableConnectionTokens,
  disconnectWearable,
  deleteWearableConnection,
  getMemberDailyActivities,
  getDailyActivity,
  getLatestDailyActivity,
  createDailyActivity,
  getMemberWearableWorkouts,
  getWearableWorkout,
  createWearableWorkout,
  getMemberWorkoutStats,
  getMemberActivityStats,
  startWearableSync,
  getWearableSyncJobs,
  getWearableSyncJob,
} from "@/lib/api/wearable";
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
} from "@/types/wearable";

// Query keys
export const wearableKeys = {
  all: ["wearables"] as const,
  platforms: () => [...wearableKeys.all, "platforms"] as const,
  platformDetail: (id: UUID) => [...wearableKeys.platforms(), id] as const,
  connections: () => [...wearableKeys.all, "connections"] as const,
  connectionsList: (page: number, size: number) =>
    [...wearableKeys.connections(), "list", page, size] as const,
  connectionDetail: (id: UUID) => [...wearableKeys.connections(), id] as const,
  memberConnections: (memberId: UUID) =>
    [...wearableKeys.connections(), "member", memberId] as const,
  activities: () => [...wearableKeys.all, "activities"] as const,
  memberActivities: (memberId: UUID, page: number, size: number, startDate?: string, endDate?: string) =>
    [...wearableKeys.activities(), "member", memberId, page, size, startDate, endDate] as const,
  activityDetail: (id: UUID) => [...wearableKeys.activities(), id] as const,
  latestActivity: (memberId: UUID) =>
    [...wearableKeys.activities(), "latest", memberId] as const,
  workouts: () => [...wearableKeys.all, "workouts"] as const,
  memberWorkouts: (memberId: UUID, page: number, size: number, startDate?: string, endDate?: string) =>
    [...wearableKeys.workouts(), "member", memberId, page, size, startDate, endDate] as const,
  workoutDetail: (id: UUID) => [...wearableKeys.workouts(), id] as const,
  memberWorkoutStats: (memberId: UUID) =>
    [...wearableKeys.all, "workout-stats", memberId] as const,
  memberActivityStats: (memberId: UUID, days: number) =>
    [...wearableKeys.all, "activity-stats", memberId, days] as const,
  syncJobs: (connectionId: UUID, page: number, size: number) =>
    [...wearableKeys.connections(), connectionId, "sync-jobs", page, size] as const,
  syncJobDetail: (id: UUID) => [...wearableKeys.all, "sync-jobs", id] as const,
};

// ========== Platforms ==========

export function useWearablePlatforms(
  options?: Omit<UseQueryOptions<WearablePlatform[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.platforms(),
    queryFn: getWearablePlatforms,
    staleTime: 1000 * 60 * 30, // 30 minutes (platforms rarely change)
    ...options,
  });
}

export function useWearablePlatform(
  id: UUID,
  options?: Omit<UseQueryOptions<WearablePlatform>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.platformDetail(id),
    queryFn: () => getWearablePlatform(id),
    enabled: !!id,
    ...options,
  });
}

// ========== Connections ==========

export function useWearableConnections(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<MemberWearableConnection>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.connectionsList(page, size),
    queryFn: () => getWearableConnections(page, size),
    ...options,
  });
}

export function useMemberWearableConnections(
  memberId: UUID,
  options?: Omit<UseQueryOptions<MemberWearableConnection[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.memberConnections(memberId),
    queryFn: () => getMemberWearableConnections(memberId),
    enabled: !!memberId,
    ...options,
  });
}

export function useWearableConnection(
  id: UUID,
  options?: Omit<UseQueryOptions<MemberWearableConnection>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.connectionDetail(id),
    queryFn: () => getWearableConnection(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateWearableConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConnectionRequest) => createWearableConnection(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: wearableKeys.connections() });
      queryClient.invalidateQueries({
        queryKey: wearableKeys.memberConnections(created.memberId),
      });
    },
  });
}

export function useUpdateWearableConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateConnectionRequest }) =>
      updateWearableConnection(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(wearableKeys.connectionDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: wearableKeys.connections() });
      queryClient.invalidateQueries({
        queryKey: wearableKeys.memberConnections(updated.memberId),
      });
    },
  });
}

export function useUpdateWearableConnectionTokens() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateConnectionTokensRequest }) =>
      updateWearableConnectionTokens(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(wearableKeys.connectionDetail(updated.id), updated);
      queryClient.invalidateQueries({
        queryKey: wearableKeys.memberConnections(updated.memberId),
      });
    },
  });
}

export function useDisconnectWearable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => disconnectWearable(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(wearableKeys.connectionDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: wearableKeys.connections() });
      queryClient.invalidateQueries({
        queryKey: wearableKeys.memberConnections(updated.memberId),
      });
    },
  });
}

export function useDeleteWearableConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteWearableConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wearableKeys.connections() });
    },
  });
}

// ========== Daily Activities ==========

export function useMemberDailyActivities(
  memberId: UUID,
  page = 0,
  size = 30,
  startDate?: string,
  endDate?: string,
  options?: Omit<UseQueryOptions<PaginatedResponse<WearableDailyActivity> | WearableDailyActivity[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.memberActivities(memberId, page, size, startDate, endDate),
    queryFn: () => getMemberDailyActivities(memberId, page, size, startDate, endDate),
    enabled: !!memberId,
    ...options,
  });
}

export function useDailyActivity(
  id: UUID,
  options?: Omit<UseQueryOptions<WearableDailyActivity>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.activityDetail(id),
    queryFn: () => getDailyActivity(id),
    enabled: !!id,
    ...options,
  });
}

export function useLatestDailyActivity(
  memberId: UUID,
  options?: Omit<UseQueryOptions<WearableDailyActivity>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.latestActivity(memberId),
    queryFn: () => getLatestDailyActivity(memberId),
    enabled: !!memberId,
    ...options,
  });
}

export function useCreateDailyActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDailyActivityRequest) => createDailyActivity(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: wearableKeys.activities() });
      queryClient.invalidateQueries({
        queryKey: wearableKeys.latestActivity(created.memberId),
      });
    },
  });
}

// ========== Workouts ==========

export function useMemberWearableWorkouts(
  memberId: UUID,
  page = 0,
  size = 50,
  startDate?: string,
  endDate?: string,
  options?: Omit<UseQueryOptions<PaginatedResponse<WearableWorkout> | WearableWorkout[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.memberWorkouts(memberId, page, size, startDate, endDate),
    queryFn: () => getMemberWearableWorkouts(memberId, page, size, startDate, endDate),
    enabled: !!memberId,
    ...options,
  });
}

export function useWearableWorkout(
  id: UUID,
  options?: Omit<UseQueryOptions<WearableWorkout>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.workoutDetail(id),
    queryFn: () => getWearableWorkout(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateWearableWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWearableWorkoutRequest) => createWearableWorkout(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: wearableKeys.workouts() });
      queryClient.invalidateQueries({
        queryKey: wearableKeys.memberWorkoutStats(created.memberId),
      });
    },
  });
}

// ========== Stats ==========

export function useMemberWorkoutStats(
  memberId: UUID,
  options?: Omit<UseQueryOptions<WearableWorkoutStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.memberWorkoutStats(memberId),
    queryFn: () => getMemberWorkoutStats(memberId),
    enabled: !!memberId,
    ...options,
  });
}

export function useMemberActivityStats(
  memberId: UUID,
  days = 30,
  options?: Omit<UseQueryOptions<WearableActivityStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.memberActivityStats(memberId, days),
    queryFn: () => getMemberActivityStats(memberId, days),
    enabled: !!memberId,
    ...options,
  });
}

// ========== Sync Jobs ==========

export function useWearableSyncJobs(
  connectionId: UUID,
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<WearableSyncJob>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.syncJobs(connectionId, page, size),
    queryFn: () => getWearableSyncJobs(connectionId, page, size),
    enabled: !!connectionId,
    ...options,
  });
}

export function useWearableSyncJob(
  id: UUID,
  options?: Omit<UseQueryOptions<WearableSyncJob>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: wearableKeys.syncJobDetail(id),
    queryFn: () => getWearableSyncJob(id),
    enabled: !!id,
    ...options,
  });
}

export function useStartWearableSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, data }: { connectionId: UUID; data?: StartSyncRequest }) =>
      startWearableSync(connectionId, data),
    onSuccess: (job) => {
      queryClient.invalidateQueries({
        queryKey: wearableKeys.syncJobs(job.connectionId, 0, 20),
      });
      // Also invalidate connection to update lastSyncAt
      queryClient.invalidateQueries({
        queryKey: wearableKeys.connectionDetail(job.connectionId),
      });
    },
  });
}
