"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getAttendance,
  getAttendanceRecord,
  checkInMember,
  checkOutMember,
  getTodayAttendanceRecords,
  getCurrentlyCheckedIn,
  bulkCheckIn,
  bulkCheckOut,
  getMemberAttendance,
} from "../lib/api/attendance";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  AttendanceRecord,
  AttendanceQueryParams,
  CheckInRequest,
  CheckOutRequest,
  BulkCheckInRequest,
  BulkCheckOutRequest,
} from "../types/attendance";
import { memberKeys } from "./use-members";
import { dashboardKeys } from "./use-dashboard";

// Query keys
export const attendanceKeys = {
  all: ["attendance"] as const,
  lists: () => [...attendanceKeys.all, "list"] as const,
  list: (params: AttendanceQueryParams) =>
    [...attendanceKeys.lists(), params] as const,
  details: () => [...attendanceKeys.all, "detail"] as const,
  detail: (id: UUID) => [...attendanceKeys.details(), id] as const,
  today: () => [...attendanceKeys.all, "today"] as const,
  checkedIn: () => [...attendanceKeys.all, "checkedIn"] as const,
  member: (memberId: UUID) => [...attendanceKeys.all, "member", memberId] as const,
};

/**
 * Hook to fetch paginated attendance records
 */
export function useAttendance(
  params: AttendanceQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<AttendanceRecord>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn: () => getAttendance(params),
    ...options,
  });
}

/**
 * Hook to fetch a single attendance record
 */
export function useAttendanceRecord(
  id: UUID,
  options?: Omit<UseQueryOptions<AttendanceRecord>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn: () => getAttendanceRecord(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch today's attendance records (full details)
 */
export function useTodayAttendanceRecords(
  options?: Omit<UseQueryOptions<AttendanceRecord[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: attendanceKeys.today(),
    queryFn: () => getTodayAttendanceRecords(),
    refetchInterval: 30000, // Refetch every 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch currently checked-in members
 */
export function useCurrentlyCheckedIn(
  options?: Omit<UseQueryOptions<AttendanceRecord[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: attendanceKeys.checkedIn(),
    queryFn: () => getCurrentlyCheckedIn(),
    refetchInterval: 30000, // Refetch every 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch member's attendance history
 */
export function useMemberAttendance(
  memberId: UUID,
  params: Omit<AttendanceQueryParams, "memberId"> = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<AttendanceRecord>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: attendanceKeys.member(memberId),
    queryFn: () => getMemberAttendance(memberId, params),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to check in a member
 */
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: UUID;
      data?: CheckInRequest;
    }) => checkInMember(memberId, data),
    onSuccess: (record) => {
      // Invalidate attendance lists
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.checkedIn() });
      // Invalidate member attendance history
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.member(record.memberId),
      });
      // Invalidate dashboard
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      // Invalidate member details (subscription classes might change)
      queryClient.invalidateQueries({
        queryKey: memberKeys.detail(record.memberId),
      });
    },
  });
}

/**
 * Hook to check out a member
 */
export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: UUID;
      data?: CheckOutRequest;
    }) => checkOutMember(memberId, data),
    onSuccess: (record) => {
      // Invalidate attendance lists
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.checkedIn() });
      // Invalidate member attendance history
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.member(record.memberId),
      });
      // Invalidate dashboard
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Hook for bulk check-in
 */
export function useBulkCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkCheckInRequest) => bulkCheckIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

/**
 * Hook for bulk check-out
 */
export function useBulkCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkCheckOutRequest) => bulkCheckOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
