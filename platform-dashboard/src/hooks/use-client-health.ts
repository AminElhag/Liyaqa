import { useQuery } from '@tanstack/react-query'
import { getClientHealth } from '@/api/endpoints/clients'

// Query key factory
export const clientHealthKeys = {
  all: ['client-health'] as const,
  detail: (clientId: string) => [...clientHealthKeys.all, clientId] as const,
}

// ============================================
// Query hooks
// ============================================

export function useClientHealth(clientId: string) {
  return useQuery({
    queryKey: clientHealthKeys.detail(clientId),
    queryFn: () => getClientHealth(clientId),
    staleTime: 300_000,
    enabled: !!clientId,
  })
}
