"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  updateLocationGenderPolicy,
  checkGenderAccess,
  getCurrentGenderStatus,
  getSchedulesForLocation,
  addGenderSchedule,
  updateGenderSchedule,
  deleteGenderSchedule,
  deleteAllSchedulesForLocation,
  getSupportedPolicies,
} from "@/lib/api/gender-policies";
import type {
  GenderPolicyResponse,
  GenderAccessResponse,
  CurrentGenderStatusResponse,
  GenderScheduleResponse,
  GenderPolicyInfo,
  UpdateGenderPolicyRequest,
  CreateGenderScheduleRequest,
  UpdateGenderScheduleRequest,
  AccessGender,
} from "@/types/gender-policy";

// Query keys
export const genderPolicyKeys = {
  all: ["gender-policies"] as const,
  accessCheck: (locationId: string, gender: AccessGender, dateTime?: string) =>
    [...genderPolicyKeys.all, "access-check", locationId, gender, dateTime] as const,
  currentStatus: (locationId: string, dateTime?: string) =>
    [...genderPolicyKeys.all, "current-status", locationId, dateTime] as const,
  schedules: (locationId: string) =>
    [...genderPolicyKeys.all, "schedules", locationId] as const,
  policies: () => [...genderPolicyKeys.all, "policies"] as const,
};

// ==================== QUERIES ====================

/**
 * Hook to check if a gender can access a location.
 */
export function useGenderAccessCheck(
  locationId: string,
  gender: AccessGender,
  dateTime?: string,
  options?: Omit<UseQueryOptions<GenderAccessResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: genderPolicyKeys.accessCheck(locationId, gender, dateTime),
    queryFn: () => checkGenderAccess(locationId, gender, dateTime),
    enabled: !!locationId && !!gender,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Hook to get current gender status for a location.
 */
export function useCurrentGenderStatus(
  locationId: string,
  dateTime?: string,
  options?: Omit<UseQueryOptions<CurrentGenderStatusResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: genderPolicyKeys.currentStatus(locationId, dateTime),
    queryFn: () => getCurrentGenderStatus(locationId, dateTime),
    enabled: !!locationId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute for time-based policies
    ...options,
  });
}

/**
 * Hook to get gender schedules for a location.
 */
export function useGenderSchedules(
  locationId: string,
  options?: Omit<UseQueryOptions<GenderScheduleResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: genderPolicyKeys.schedules(locationId),
    queryFn: () => getSchedulesForLocation(locationId),
    enabled: !!locationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to get supported gender policies.
 */
export function useSupportedPolicies(
  options?: Omit<UseQueryOptions<GenderPolicyInfo[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: genderPolicyKeys.policies(),
    queryFn: () => getSupportedPolicies(),
    staleTime: Infinity, // Policies don't change
    ...options,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook to update location gender policy.
 */
export function useUpdateGenderPolicy(
  options?: UseMutationOptions<
    GenderPolicyResponse,
    Error,
    { locationId: string; request: UpdateGenderPolicyRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ locationId, request }) =>
      updateLocationGenderPolicy(locationId, request),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: genderPolicyKeys.currentStatus(variables.locationId),
      });
      queryClient.invalidateQueries({
        queryKey: genderPolicyKeys.schedules(variables.locationId),
      });
    },
    ...options,
  });
}

/**
 * Hook to add a gender schedule.
 */
export function useAddGenderSchedule(
  options?: UseMutationOptions<
    GenderScheduleResponse,
    Error,
    { locationId: string; request: CreateGenderScheduleRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ locationId, request }) => addGenderSchedule(locationId, request),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: genderPolicyKeys.schedules(variables.locationId),
      });
      queryClient.invalidateQueries({
        queryKey: genderPolicyKeys.currentStatus(variables.locationId),
      });
    },
    ...options,
  });
}

/**
 * Hook to update a gender schedule.
 */
export function useUpdateGenderSchedule(
  locationId: string,
  options?: UseMutationOptions<
    GenderScheduleResponse,
    Error,
    { scheduleId: string; request: UpdateGenderScheduleRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scheduleId, request }) => updateGenderSchedule(scheduleId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: genderPolicyKeys.schedules(locationId),
      });
      queryClient.invalidateQueries({
        queryKey: genderPolicyKeys.currentStatus(locationId),
      });
    },
    ...options,
  });
}

/**
 * Hook to delete a gender schedule.
 */
export function useDeleteGenderSchedule(
  locationId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) => deleteGenderSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: genderPolicyKeys.schedules(locationId),
      });
      queryClient.invalidateQueries({
        queryKey: genderPolicyKeys.currentStatus(locationId),
      });
    },
    ...options,
  });
}

/**
 * Hook to delete all schedules for a location.
 */
export function useDeleteAllSchedules(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) => deleteAllSchedulesForLocation(locationId),
    onSuccess: (_, locationId) => {
      queryClient.invalidateQueries({
        queryKey: genderPolicyKeys.schedules(locationId),
      });
      queryClient.invalidateQueries({
        queryKey: genderPolicyKeys.currentStatus(locationId),
      });
    },
    ...options,
  });
}
