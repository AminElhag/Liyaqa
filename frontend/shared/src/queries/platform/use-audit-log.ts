"use client";

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getAuditLogs,
  getAuditActions,
  getAuditResourceTypes,
  exportAuditLogs,
} from "../../lib/api/platform/audit-log";
import type { PageResponse } from "../../types/api";
import type {
  PlatformAuditLogEntry,
  PlatformAuditLogFilters,
  AuditActionOption,
  AuditResourceTypeOption,
} from "../../types/platform/audit-log";

export const auditLogKeys = {
  all: ["platform", "audit-log"] as const,
  list: (filters?: PlatformAuditLogFilters) => [...auditLogKeys.all, "list", filters] as const,
  actions: () => [...auditLogKeys.all, "actions"] as const,
  resourceTypes: () => [...auditLogKeys.all, "resource-types"] as const,
};

export function useAuditLogs(
  filters?: PlatformAuditLogFilters,
  options?: Omit<UseQueryOptions<PageResponse<PlatformAuditLogEntry>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: () => getAuditLogs(filters),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useAuditActions(
  options?: Omit<UseQueryOptions<AuditActionOption[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: auditLogKeys.actions(),
    queryFn: () => getAuditActions(),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useAuditResourceTypes(
  options?: Omit<UseQueryOptions<AuditResourceTypeOption[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: auditLogKeys.resourceTypes(),
    queryFn: () => getAuditResourceTypes(),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (filters?: PlatformAuditLogFilters) => exportAuditLogs(filters),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}
