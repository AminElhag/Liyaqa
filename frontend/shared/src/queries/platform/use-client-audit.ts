"use client";

import {
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getClientAuditLogs,
  type AuditLog,
  type AuditLogQueryParams,
} from "../lib/api/platform/client-audit";
import type { PageResponse, UUID } from "../types/api";

// Query keys
export const clientAuditKeys = {
  all: ["platform", "client-audit"] as const,
  lists: () => [...clientAuditKeys.all, "list"] as const,
  list: (organizationId: UUID, params: AuditLogQueryParams) =>
    [...clientAuditKeys.lists(), organizationId, params] as const,
};

/**
 * Hook to fetch paginated audit logs for a client organization
 */
export function useClientAuditLogs(
  organizationId: UUID,
  params: AuditLogQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<AuditLog>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientAuditKeys.list(organizationId, params),
    queryFn: () => getClientAuditLogs(organizationId, params),
    enabled: !!organizationId,
    ...options,
  });
}
