import { useQuery } from '@tanstack/react-query'
import {
  getClientAuditLogs,
} from '@/api/endpoints/client-audit'
import type { AuditLogQueryParams } from '@/api/endpoints/client-audit'

// Query key factory
export const clientAuditKeys = {
  all: ['client-audit'] as const,
  lists: () => [...clientAuditKeys.all, 'list'] as const,
  list: (organizationId: string, filters: AuditLogQueryParams) =>
    [...clientAuditKeys.lists(), organizationId, filters] as const,
}

// ============================================
// Query hooks
// ============================================

export function useClientAuditLogs(
  organizationId: string,
  params: AuditLogQueryParams = {},
) {
  return useQuery({
    queryKey: clientAuditKeys.list(organizationId, params),
    queryFn: () => getClientAuditLogs(organizationId, params),
    staleTime: 120_000,
    enabled: !!organizationId,
  })
}
