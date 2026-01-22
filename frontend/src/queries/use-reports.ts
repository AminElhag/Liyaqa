"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  getRevenueReport,
  getAttendanceReport,
  getMemberReport,
} from "@/lib/api/reports";
import type {
  RevenueReport,
  AttendanceReport,
  MemberReport,
  ReportQueryParams,
} from "@/types/report";

// Query keys
export const reportKeys = {
  all: ["reports"] as const,
  revenue: (params: ReportQueryParams) => [...reportKeys.all, "revenue", params] as const,
  attendance: (params: ReportQueryParams) => [...reportKeys.all, "attendance", params] as const,
  members: (params: ReportQueryParams) => [...reportKeys.all, "members", params] as const,
};

/**
 * Hook to fetch revenue report
 */
export function useRevenueReport(
  params: ReportQueryParams,
  options?: Omit<UseQueryOptions<RevenueReport>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: reportKeys.revenue(params),
    queryFn: () => getRevenueReport(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch attendance report
 */
export function useAttendanceReport(
  params: ReportQueryParams,
  options?: Omit<UseQueryOptions<AttendanceReport>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: reportKeys.attendance(params),
    queryFn: () => getAttendanceReport(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch member report
 */
export function useMemberReport(
  params: ReportQueryParams,
  options?: Omit<UseQueryOptions<MemberReport>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: reportKeys.members(params),
    queryFn: () => getMemberReport(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
