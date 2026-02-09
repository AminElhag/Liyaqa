import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  exportAlertsToCsv,
} from '@/api/endpoints/alerts'
import type {
  AlertFilters,
  AlertStatus,
  AlertType,
  AlertSeverity,
} from '@/types'

// Query key factory
export const alertKeys = {
  all: ['alerts'] as const,
  lists: () => [...alertKeys.all, 'list'] as const,
  list: (filters?: AlertFilters) => [...alertKeys.lists(), filters] as const,
  active: (limit: number) => [...alertKeys.all, 'active', limit] as const,
  stats: () => [...alertKeys.all, 'stats'] as const,
  details: () => [...alertKeys.all, 'detail'] as const,
  detail: (id: string) => [...alertKeys.details(), id] as const,
  byOrganization: (organizationId: string, status?: AlertStatus) =>
    [...alertKeys.all, 'org', organizationId, status] as const,
  byType: (type: AlertType, limit: number) =>
    [...alertKeys.all, 'by-type', type, limit] as const,
  bySeverity: (severity: AlertSeverity, limit: number) =>
    [...alertKeys.all, 'by-severity', severity, limit] as const,
}

// ============================================
// Query hooks
// ============================================

export function usePlatformAlerts(filters?: AlertFilters) {
  return useQuery({
    queryKey: alertKeys.list(filters),
    queryFn: () => getPlatformAlerts(filters),
    staleTime: 120_000,
  })
}

export function useActiveAlerts(limit: number = 50) {
  return useQuery({
    queryKey: alertKeys.active(limit),
    queryFn: () => getActiveAlerts(limit),
    staleTime: 120_000,
  })
}

export function useAlertStatistics() {
  return useQuery({
    queryKey: alertKeys.stats(),
    queryFn: getAlertStatistics,
    staleTime: 300_000,
  })
}

export function useAlert(alertId: string) {
  return useQuery({
    queryKey: alertKeys.detail(alertId),
    queryFn: () => getAlertById(alertId),
    staleTime: 60_000,
    enabled: !!alertId,
  })
}

export function useOrganizationAlerts(organizationId: string, status?: AlertStatus) {
  return useQuery({
    queryKey: alertKeys.byOrganization(organizationId, status),
    queryFn: () => getOrganizationAlerts(organizationId, status),
    staleTime: 120_000,
    enabled: !!organizationId,
  })
}

export function useAlertsByType(type: AlertType, limit: number = 50) {
  return useQuery({
    queryKey: alertKeys.byType(type, limit),
    queryFn: () => getAlertsByType(type, limit),
    staleTime: 120_000,
  })
}

export function useAlertsBySeverity(severity: AlertSeverity, limit: number = 50) {
  return useQuery({
    queryKey: alertKeys.bySeverity(severity, limit),
    queryFn: () => getAlertsBySeverity(severity, limit),
    staleTime: 120_000,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) => acknowledgeAlert(alertId),
    onSuccess: (_data, alertId) => {
      queryClient.invalidateQueries({ queryKey: alertKeys.detail(alertId) })
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() })
      queryClient.invalidateQueries({ queryKey: alertKeys.stats() })
    },
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ alertId, notes }: { alertId: string; notes?: string }) =>
      resolveAlert(alertId, notes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: alertKeys.detail(variables.alertId) })
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() })
      queryClient.invalidateQueries({ queryKey: alertKeys.stats() })
    },
  })
}

export function useDismissAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) => dismissAlert(alertId),
    onSuccess: (_data, alertId) => {
      queryClient.invalidateQueries({ queryKey: alertKeys.detail(alertId) })
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() })
      queryClient.invalidateQueries({ queryKey: alertKeys.stats() })
    },
  })
}

export function useBulkAcknowledgeAlerts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alertIds: string[]) => bulkAcknowledgeAlerts(alertIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() })
      queryClient.invalidateQueries({ queryKey: alertKeys.stats() })
    },
  })
}

export function useBulkResolveAlerts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alertIds: string[]) => bulkResolveAlerts(alertIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() })
      queryClient.invalidateQueries({ queryKey: alertKeys.stats() })
    },
  })
}

export function useExportAlertsToCsv() {
  return useMutation({
    mutationFn: (filters?: AlertFilters) => exportAlertsToCsv(filters),
  })
}
