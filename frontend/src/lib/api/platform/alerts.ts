import { api } from "../client";
import type {
  PlatformAlert,
  AlertStatistics,
  AlertFilters,
  AlertSeverity,
  AlertStatus,
  AlertType,
} from "@/types/platform/alerts";

const BASE_URL = "api/platform/alerts";

/**
 * Paginated response
 */
export interface PaginatedAlerts {
  content: PlatformAlert[];
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

/**
 * Get platform alerts with filters
 */
export async function getPlatformAlerts(
  filters?: AlertFilters
): Promise<PaginatedAlerts> {
  const searchParams: Record<string, string> = {};

  if (filters?.severity?.length) {
    searchParams.severity = filters.severity.join(",");
  }
  if (filters?.type?.length) {
    searchParams.type = filters.type.join(",");
  }
  if (filters?.status?.length) {
    searchParams.status = filters.status.join(",");
  }
  if (filters?.organizationId) {
    searchParams.organizationId = filters.organizationId;
  }
  if (filters?.startDate) {
    searchParams.startDate = filters.startDate;
  }
  if (filters?.endDate) {
    searchParams.endDate = filters.endDate;
  }
  if (filters?.page !== undefined) {
    searchParams.page = String(filters.page);
  }
  if (filters?.pageSize !== undefined) {
    searchParams.pageSize = String(filters.pageSize);
  }

  return api.get(BASE_URL, { searchParams }).json<PaginatedAlerts>();
}

/**
 * Get active alerts (shortcut)
 */
export async function getActiveAlerts(
  limit: number = 50
): Promise<PlatformAlert[]> {
  return api
    .get(`${BASE_URL}/active`, { searchParams: { limit: String(limit) } })
    .json<PlatformAlert[]>();
}

/**
 * Get alert statistics
 */
export async function getAlertStatistics(): Promise<AlertStatistics> {
  return api.get(`${BASE_URL}/statistics`).json<AlertStatistics>();
}

/**
 * Get single alert by ID
 */
export async function getAlertById(alertId: string): Promise<PlatformAlert> {
  return api.get(`${BASE_URL}/${alertId}`).json<PlatformAlert>();
}

/**
 * Acknowledge alert
 */
export async function acknowledgeAlert(
  alertId: string
): Promise<PlatformAlert> {
  return api.post(`${BASE_URL}/${alertId}/acknowledge`).json<PlatformAlert>();
}

/**
 * Resolve alert
 */
export async function resolveAlert(
  alertId: string,
  notes?: string
): Promise<PlatformAlert> {
  return api
    .post(`${BASE_URL}/${alertId}/resolve`, {
      json: notes ? { notes } : undefined,
    })
    .json<PlatformAlert>();
}

/**
 * Dismiss alert
 */
export async function dismissAlert(alertId: string): Promise<PlatformAlert> {
  return api.post(`${BASE_URL}/${alertId}/dismiss`).json<PlatformAlert>();
}

/**
 * Bulk acknowledge alerts
 */
export async function bulkAcknowledgeAlerts(
  alertIds: string[]
): Promise<{ acknowledged: number }> {
  return api
    .post(`${BASE_URL}/bulk-acknowledge`, { json: { alertIds } })
    .json<{ acknowledged: number }>();
}

/**
 * Bulk resolve alerts
 */
export async function bulkResolveAlerts(
  alertIds: string[]
): Promise<{ resolved: number }> {
  return api
    .post(`${BASE_URL}/bulk-resolve`, { json: { alertIds } })
    .json<{ resolved: number }>();
}

/**
 * Get alerts for specific organization
 */
export async function getOrganizationAlerts(
  organizationId: string,
  status?: AlertStatus
): Promise<PlatformAlert[]> {
  const searchParams: Record<string, string> = {};
  if (status) searchParams.status = status;

  return api
    .get(`${BASE_URL}/organization/${organizationId}`, { searchParams })
    .json<PlatformAlert[]>();
}

/**
 * Get alerts by type
 */
export async function getAlertsByType(
  type: AlertType,
  limit: number = 50
): Promise<PlatformAlert[]> {
  return api
    .get(`${BASE_URL}/by-type/${type}`, {
      searchParams: { limit: String(limit) },
    })
    .json<PlatformAlert[]>();
}

/**
 * Get alerts by severity
 */
export async function getAlertsBySeverity(
  severity: AlertSeverity,
  limit: number = 50
): Promise<PlatformAlert[]> {
  return api
    .get(`${BASE_URL}/by-severity/${severity}`, {
      searchParams: { limit: String(limit) },
    })
    .json<PlatformAlert[]>();
}

/**
 * Export alerts to CSV
 */
export async function exportAlertsToCsv(filters?: AlertFilters): Promise<Blob> {
  const searchParams: Record<string, string> = {};

  if (filters?.severity?.length) {
    searchParams.severity = filters.severity.join(",");
  }
  if (filters?.type?.length) {
    searchParams.type = filters.type.join(",");
  }
  if (filters?.status?.length) {
    searchParams.status = filters.status.join(",");
  }
  if (filters?.startDate) {
    searchParams.startDate = filters.startDate;
  }
  if (filters?.endDate) {
    searchParams.endDate = filters.endDate;
  }

  const response = await api.get(`${BASE_URL}/export/csv`, { searchParams });
  return response.blob();
}
