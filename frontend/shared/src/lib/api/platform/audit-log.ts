import { api } from "../client";
import type { PageResponse } from "../../../types/api";
import type {
  PlatformAuditLogEntry,
  PlatformAuditLogFilters,
  AuditActionOption,
  AuditResourceTypeOption,
} from "../../../types/platform/audit-log";

const BASE_URL = "api/v1/platform/audit-logs";

export async function getAuditLogs(
  filters?: PlatformAuditLogFilters
): Promise<PageResponse<PlatformAuditLogEntry>> {
  const searchParams: Record<string, string> = {};
  if (filters?.action) searchParams.action = filters.action;
  if (filters?.actorId) searchParams.actorId = filters.actorId;
  if (filters?.resourceType) searchParams.resourceType = filters.resourceType;
  if (filters?.tenantId) searchParams.tenantId = filters.tenantId;
  if (filters?.dateFrom) searchParams.dateFrom = filters.dateFrom;
  if (filters?.dateTo) searchParams.dateTo = filters.dateTo;
  if (filters?.search) searchParams.search = filters.search;
  if (filters?.page !== undefined) searchParams.page = String(filters.page);
  if (filters?.size !== undefined) searchParams.size = String(filters.size);

  return api.get(BASE_URL, { searchParams }).json<PageResponse<PlatformAuditLogEntry>>();
}

export async function getAuditActions(): Promise<AuditActionOption[]> {
  return api.get(`${BASE_URL}/actions`).json<AuditActionOption[]>();
}

export async function getAuditResourceTypes(): Promise<AuditResourceTypeOption[]> {
  return api.get(`${BASE_URL}/resource-types`).json<AuditResourceTypeOption[]>();
}

export async function exportAuditLogs(filters?: PlatformAuditLogFilters): Promise<Blob> {
  const searchParams: Record<string, string> = {};
  if (filters?.action) searchParams.action = filters.action;
  if (filters?.actorId) searchParams.actorId = filters.actorId;
  if (filters?.resourceType) searchParams.resourceType = filters.resourceType;
  if (filters?.tenantId) searchParams.tenantId = filters.tenantId;
  if (filters?.dateFrom) searchParams.dateFrom = filters.dateFrom;
  if (filters?.dateTo) searchParams.dateTo = filters.dateTo;
  if (filters?.search) searchParams.search = filters.search;

  const response = await api.get(`${BASE_URL}/export`, { searchParams });
  return response.blob();
}
