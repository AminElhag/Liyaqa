import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createClientInvoice,
  generateFromSubscription,
  getClientInvoice,
  getClientInvoices,
  getInvoicesByOrganization,
  updateClientInvoice,
  issueClientInvoice,
  recordClientPayment,
  cancelClientInvoice,
  getClientInvoicePdf,
  getClientInvoiceStats,
} from '@/api/endpoints/client-invoices'
import type {
  ClientInvoiceQueryParams,
  CreateClientInvoiceRequest,
  GenerateFromSubscriptionRequest,
  UpdateClientInvoiceRequest,
  IssueClientInvoiceRequest,
  RecordClientPaymentRequest,
} from '@/types'

// Query key factory
export const clientInvoiceKeys = {
  all: ['client-invoices'] as const,
  lists: () => [...clientInvoiceKeys.all, 'list'] as const,
  list: (filters: ClientInvoiceQueryParams) =>
    [...clientInvoiceKeys.lists(), filters] as const,
  byOrganization: (organizationId: string, filters: ClientInvoiceQueryParams) =>
    [...clientInvoiceKeys.lists(), 'org', organizationId, filters] as const,
  details: () => [...clientInvoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientInvoiceKeys.details(), id] as const,
  stats: () => [...clientInvoiceKeys.all, 'stats'] as const,
}

// ============================================
// Query hooks
// ============================================

export function useClientInvoices(params: ClientInvoiceQueryParams = {}) {
  return useQuery({
    queryKey: clientInvoiceKeys.list(params),
    queryFn: () => getClientInvoices(params),
    staleTime: 120_000,
  })
}

export function useClientInvoice(id: string) {
  return useQuery({
    queryKey: clientInvoiceKeys.detail(id),
    queryFn: () => getClientInvoice(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useInvoicesByOrganization(
  organizationId: string,
  params: ClientInvoiceQueryParams = {},
) {
  return useQuery({
    queryKey: clientInvoiceKeys.byOrganization(organizationId, params),
    queryFn: () => getInvoicesByOrganization(organizationId, params),
    staleTime: 120_000,
    enabled: !!organizationId,
  })
}

export function useClientInvoiceStats() {
  return useQuery({
    queryKey: clientInvoiceKeys.stats(),
    queryFn: getClientInvoiceStats,
    staleTime: 300_000,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useCreateClientInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClientInvoiceRequest) => createClientInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.stats() })
    },
  })
}

export function useGenerateFromSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: GenerateFromSubscriptionRequest) => generateFromSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.stats() })
    },
  })
}

export function useUpdateClientInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientInvoiceRequest }) =>
      updateClientInvoice(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientInvoiceKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() })
    },
  })
}

export function useIssueClientInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: IssueClientInvoiceRequest }) =>
      issueClientInvoice(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientInvoiceKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.stats() })
    },
  })
}

export function useRecordClientPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecordClientPaymentRequest }) =>
      recordClientPayment(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientInvoiceKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.stats() })
    },
  })
}

export function useCancelClientInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelClientInvoice(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.stats() })
    },
  })
}

export function useDownloadClientInvoicePdf() {
  return useMutation({
    mutationFn: (id: string) => getClientInvoicePdf(id),
  })
}
