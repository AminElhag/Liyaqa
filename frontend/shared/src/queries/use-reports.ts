"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { UUID, PaginatedResponse } from "../types/api";
import {
  getRevenueReport,
  getAttendanceReport,
  getMemberReport,
  generateChurnReport,
  generateLtvReport,
  getScheduledReports,
  getScheduledReport,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  enableScheduledReport,
  disableScheduledReport,
  getReportHistory,
  getReportHistoryEntry,
} from "../lib/api/reports";
import type {
  RevenueReport,
  AttendanceReport,
  MemberReport,
  ReportQueryParams,
  ScheduledReport,
  ReportHistory,
  ChurnReport,
  LtvReport,
  CreateScheduledReportRequest,
  UpdateScheduledReportRequest,
  GenerateChurnReportRequest,
  GenerateLtvReportRequest,
  ScheduledReportQueryParams,
  ReportHistoryQueryParams,
} from "../types/report";

// Query keys
export const reportKeys = {
  all: ["reports"] as const,
  revenue: (params: ReportQueryParams) => [...reportKeys.all, "revenue", params] as const,
  attendance: (params: ReportQueryParams) => [...reportKeys.all, "attendance", params] as const,
  members: (params: ReportQueryParams) => [...reportKeys.all, "members", params] as const,
  churn: (params: GenerateChurnReportRequest) =>
    [...reportKeys.all, "churn", params] as const,
  ltv: (params: GenerateLtvReportRequest) =>
    [...reportKeys.all, "ltv", params] as const,
  scheduled: () => [...reportKeys.all, "scheduled"] as const,
  scheduledList: (params?: ScheduledReportQueryParams) =>
    [...reportKeys.scheduled(), "list", params] as const,
  scheduledDetail: (id: UUID) => [...reportKeys.scheduled(), id] as const,
  history: () => [...reportKeys.all, "history"] as const,
  historyList: (params?: ReportHistoryQueryParams) =>
    [...reportKeys.history(), "list", params] as const,
  historyDetail: (id: UUID) => [...reportKeys.history(), id] as const,
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

// ========== Churn Report ==========

export function useGenerateChurnReport() {
  return useMutation({
    mutationFn: (data: GenerateChurnReportRequest) => generateChurnReport(data),
  });
}

// ========== LTV Report ==========

export function useGenerateLtvReport() {
  return useMutation({
    mutationFn: (data: GenerateLtvReportRequest) => generateLtvReport(data),
  });
}

// ========== Scheduled Reports ==========

export function useScheduledReports(
  params: ScheduledReportQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<ScheduledReport>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: reportKeys.scheduledList(params),
    queryFn: () => getScheduledReports(params),
    ...options,
  });
}

export function useScheduledReport(
  id: UUID,
  options?: Omit<UseQueryOptions<ScheduledReport>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: reportKeys.scheduledDetail(id),
    queryFn: () => getScheduledReport(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduledReportRequest) =>
      createScheduledReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.scheduled() });
    },
  });
}

export function useUpdateScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateScheduledReportRequest }) =>
      updateScheduledReport(id, data),
    onSuccess: (updatedReport) => {
      queryClient.setQueryData(
        reportKeys.scheduledDetail(updatedReport.id),
        updatedReport
      );
      queryClient.invalidateQueries({ queryKey: reportKeys.scheduledList() });
    },
  });
}

export function useDeleteScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteScheduledReport(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: reportKeys.scheduledDetail(id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.scheduledList() });
    },
  });
}

export function useEnableScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => enableScheduledReport(id),
    onSuccess: (updatedReport) => {
      queryClient.setQueryData(
        reportKeys.scheduledDetail(updatedReport.id),
        updatedReport
      );
      queryClient.invalidateQueries({ queryKey: reportKeys.scheduledList() });
    },
  });
}

export function useDisableScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => disableScheduledReport(id),
    onSuccess: (updatedReport) => {
      queryClient.setQueryData(
        reportKeys.scheduledDetail(updatedReport.id),
        updatedReport
      );
      queryClient.invalidateQueries({ queryKey: reportKeys.scheduledList() });
    },
  });
}

// ========== Report History ==========

export function useReportHistory(
  params: ReportHistoryQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<ReportHistory>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: reportKeys.historyList(params),
    queryFn: () => getReportHistory(params),
    ...options,
  });
}

export function useReportHistoryEntry(
  id: UUID,
  options?: Omit<UseQueryOptions<ReportHistory>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: reportKeys.historyDetail(id),
    queryFn: () => getReportHistoryEntry(id),
    enabled: !!id,
    ...options,
  });
}
