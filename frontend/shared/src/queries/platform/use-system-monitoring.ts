"use client";

import {
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getSystemHealth,
  getScheduledJobs,
  getErrorSummary,
  type SystemHealthResponse,
  type ScheduledJobResponse,
  type ErrorSummaryResponse,
} from "../../lib/api/platform/system-monitoring";

export const systemMonitoringKeys = {
  all: ["platform", "system-monitoring"] as const,
  health: () => [...systemMonitoringKeys.all, "health"] as const,
  jobs: () => [...systemMonitoringKeys.all, "jobs"] as const,
  errors: () => [...systemMonitoringKeys.all, "errors"] as const,
};

export function useSystemHealth(
  options?: Omit<UseQueryOptions<SystemHealthResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: systemMonitoringKeys.health(),
    queryFn: () => getSystemHealth(),
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useScheduledJobs(
  options?: Omit<UseQueryOptions<ScheduledJobResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: systemMonitoringKeys.jobs(),
    queryFn: () => getScheduledJobs(),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useErrorSummary(
  options?: Omit<UseQueryOptions<ErrorSummaryResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: systemMonitoringKeys.errors(),
    queryFn: () => getErrorSummary(),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export type { SystemHealthResponse, ScheduledJobResponse, ErrorSummaryResponse };
