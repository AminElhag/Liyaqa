"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  getPlatformAlerts,
  getActiveAlerts,
  getAlertStatistics,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
  bulkAcknowledgeAlerts,
  bulkResolveAlerts,
  getOrganizationAlerts,
  getAlertsByType,
  getAlertsBySeverity,
  type PaginatedAlerts,
} from "@/lib/api/platform/alerts";
import type {
  PlatformAlert,
  AlertStatistics,
  AlertFilters,
  AlertSeverity,
  AlertStatus,
  AlertType,
} from "@/types/platform/alerts";

// Query keys
export const alertKeys = {
  all: ["platform", "alerts"] as const,
  list: (filters?: AlertFilters) => [...alertKeys.all, "list", filters] as const,
  active: (limit: number) => [...alertKeys.all, "active", limit] as const,
  statistics: () => [...alertKeys.all, "statistics"] as const,
  detail: (alertId: string) => [...alertKeys.all, "detail", alertId] as const,
  organization: (organizationId: string, status?: AlertStatus) =>
    [...alertKeys.all, "organization", organizationId, status] as const,
  byType: (type: AlertType, limit: number) =>
    [...alertKeys.all, "byType", type, limit] as const,
  bySeverity: (severity: AlertSeverity, limit: number) =>
    [...alertKeys.all, "bySeverity", severity, limit] as const,
};

/**
 * Hook to fetch platform alerts with filters
 */
export function usePlatformAlerts(
  filters?: AlertFilters,
  options?: Omit<UseQueryOptions<PaginatedAlerts>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: alertKeys.list(filters),
    queryFn: () => getPlatformAlerts(filters),
    ...options,
  });
}

/**
 * Hook to fetch active alerts
 */
export function useActiveAlerts(
  limit: number = 50,
  options?: Omit<UseQueryOptions<PlatformAlert[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: alertKeys.active(limit),
    queryFn: () => getActiveAlerts(limit),
    ...options,
  });
}

/**
 * Hook to fetch alert statistics
 */
export function useAlertStatistics(
  options?: Omit<UseQueryOptions<AlertStatistics>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: alertKeys.statistics(),
    queryFn: () => getAlertStatistics(),
    ...options,
  });
}

/**
 * Hook to fetch single alert by ID
 */
export function useAlertById(
  alertId: string,
  options?: Omit<UseQueryOptions<PlatformAlert>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: alertKeys.detail(alertId),
    queryFn: () => getAlertById(alertId),
    enabled: !!alertId,
    ...options,
  });
}

/**
 * Hook to fetch alerts for organization
 */
export function useOrganizationAlerts(
  organizationId: string,
  status?: AlertStatus,
  options?: Omit<UseQueryOptions<PlatformAlert[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: alertKeys.organization(organizationId, status),
    queryFn: () => getOrganizationAlerts(organizationId, status),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to fetch alerts by type
 */
export function useAlertsByType(
  type: AlertType,
  limit: number = 50,
  options?: Omit<UseQueryOptions<PlatformAlert[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: alertKeys.byType(type, limit),
    queryFn: () => getAlertsByType(type, limit),
    ...options,
  });
}

/**
 * Hook to fetch alerts by severity
 */
export function useAlertsBySeverity(
  severity: AlertSeverity,
  limit: number = 50,
  options?: Omit<UseQueryOptions<PlatformAlert[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: alertKeys.bySeverity(severity, limit),
    queryFn: () => getAlertsBySeverity(severity, limit),
    ...options,
  });
}

/**
 * Hook to acknowledge an alert
 */
export function useAcknowledgeAlert(
  options?: UseMutationOptions<PlatformAlert, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId) => acknowledgeAlert(alertId),
    onSuccess: (data, alertId) => {
      queryClient.setQueryData(alertKeys.detail(alertId), data);
      queryClient.invalidateQueries({ queryKey: alertKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to resolve an alert
 */
export function useResolveAlert(
  options?: UseMutationOptions<
    PlatformAlert,
    Error,
    { alertId: string; notes?: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, notes }) => resolveAlert(alertId, notes),
    onSuccess: (data, { alertId }) => {
      queryClient.setQueryData(alertKeys.detail(alertId), data);
      queryClient.invalidateQueries({ queryKey: alertKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to dismiss an alert
 */
export function useDismissAlert(
  options?: UseMutationOptions<PlatformAlert, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId) => dismissAlert(alertId),
    onSuccess: (data, alertId) => {
      queryClient.setQueryData(alertKeys.detail(alertId), data);
      queryClient.invalidateQueries({ queryKey: alertKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to bulk acknowledge alerts
 */
export function useBulkAcknowledgeAlerts(
  options?: UseMutationOptions<{ acknowledged: number }, Error, string[]>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertIds) => bulkAcknowledgeAlerts(alertIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to bulk resolve alerts
 */
export function useBulkResolveAlerts(
  options?: UseMutationOptions<{ resolved: number }, Error, string[]>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertIds) => bulkResolveAlerts(alertIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
    ...options,
  });
}
