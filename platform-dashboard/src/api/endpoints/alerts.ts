import api from '@/api/client'
import type {
  PlatformAlert,
  AlertStatistics,
  AlertFilters,
  AlertSeverity,
  AlertStatus,
  AlertType,
} from '@/types'

const BASE_URL = 'api/platform/alerts'

/**
 * Paginated response for alerts.
 */
export interface PaginatedAlerts {
  content: PlatformAlert[]
  totalElements: number
  totalPages: number
  page: number
  pageSize: number
}

/**
 * Get platform alerts with filters.
 */
export async function getPlatformAlerts(
  filters?: AlertFilters,
): Promise<PaginatedAlerts> {
  const params: Record<string, string | number> = {}

  if (filters?.severity?.length) {
    params.severity = filters.severity.join(',')
  }
  if (filters?.type?.length) {
    params.type = filters.type.join(',')
  }
  if (filters?.status?.length) {
    params.status = filters.status.join(',')
  }
  if (filters?.organizationId) {
    params.organizationId = filters.organizationId
  }
  if (filters?.startDate) {
    params.startDate = filters.startDate
  }
  if (filters?.endDate) {
    params.endDate = filters.endDate
  }
  if (filters?.page !== undefined) {
    params.page = filters.page
  }
  if (filters?.pageSize !== undefined) {
    params.pageSize = filters.pageSize
  }

  return api.get<PaginatedAlerts>(BASE_URL, { params }).then((r) => r.data)
}

/**
 * Get active alerts (shortcut).
 */
export async function getActiveAlerts(limit: number = 50): Promise<PlatformAlert[]> {
  return api
    .get<PlatformAlert[]>(`${BASE_URL}/active`, { params: { limit } })
    .then((r) => r.data)
}

/**
 * Get alert statistics.
 */
export async function getAlertStatistics(): Promise<AlertStatistics> {
  return api.get<AlertStatistics>(`${BASE_URL}/statistics`).then((r) => r.data)
}

/**
 * Get single alert by ID.
 */
export async function getAlertById(alertId: string): Promise<PlatformAlert> {
  return api.get<PlatformAlert>(`${BASE_URL}/${alertId}`).then((r) => r.data)
}

/**
 * Acknowledge alert.
 */
export async function acknowledgeAlert(alertId: string): Promise<PlatformAlert> {
  return api
    .post<PlatformAlert>(`${BASE_URL}/${alertId}/acknowledge`)
    .then((r) => r.data)
}

/**
 * Resolve alert.
 */
export async function resolveAlert(
  alertId: string,
  notes?: string,
): Promise<PlatformAlert> {
  return api
    .post<PlatformAlert>(
      `${BASE_URL}/${alertId}/resolve`,
      notes ? { notes } : undefined,
    )
    .then((r) => r.data)
}

/**
 * Dismiss alert.
 */
export async function dismissAlert(alertId: string): Promise<PlatformAlert> {
  return api
    .post<PlatformAlert>(`${BASE_URL}/${alertId}/dismiss`)
    .then((r) => r.data)
}

/**
 * Bulk acknowledge alerts.
 */
export async function bulkAcknowledgeAlerts(
  alertIds: string[],
): Promise<{ acknowledged: number }> {
  return api
    .post<{ acknowledged: number }>(`${BASE_URL}/bulk-acknowledge`, { alertIds })
    .then((r) => r.data)
}

/**
 * Bulk resolve alerts.
 */
export async function bulkResolveAlerts(
  alertIds: string[],
): Promise<{ resolved: number }> {
  return api
    .post<{ resolved: number }>(`${BASE_URL}/bulk-resolve`, { alertIds })
    .then((r) => r.data)
}

/**
 * Get alerts for specific organization.
 */
export async function getOrganizationAlerts(
  organizationId: string,
  status?: AlertStatus,
): Promise<PlatformAlert[]> {
  const params: Record<string, string> = {}
  if (status) params.status = status

  return api
    .get<PlatformAlert[]>(`${BASE_URL}/organization/${organizationId}`, { params })
    .then((r) => r.data)
}

/**
 * Get alerts by type.
 */
export async function getAlertsByType(
  type: AlertType,
  limit: number = 50,
): Promise<PlatformAlert[]> {
  return api
    .get<PlatformAlert[]>(`${BASE_URL}/by-type/${type}`, { params: { limit } })
    .then((r) => r.data)
}

/**
 * Get alerts by severity.
 */
export async function getAlertsBySeverity(
  severity: AlertSeverity,
  limit: number = 50,
): Promise<PlatformAlert[]> {
  return api
    .get<PlatformAlert[]>(`${BASE_URL}/by-severity/${severity}`, {
      params: { limit },
    })
    .then((r) => r.data)
}

/**
 * Export alerts to CSV.
 */
export async function exportAlertsToCsv(filters?: AlertFilters): Promise<Blob> {
  const params: Record<string, string> = {}

  if (filters?.severity?.length) {
    params.severity = filters.severity.join(',')
  }
  if (filters?.type?.length) {
    params.type = filters.type.join(',')
  }
  if (filters?.status?.length) {
    params.status = filters.status.join(',')
  }
  if (filters?.startDate) {
    params.startDate = filters.startDate
  }
  if (filters?.endDate) {
    params.endDate = filters.endDate
  }

  return api
    .get<Blob>(`${BASE_URL}/export/csv`, { params, responseType: 'blob' })
    .then((r) => r.data)
}
