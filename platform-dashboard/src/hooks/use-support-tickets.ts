import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createTicket,
  getTicket,
  getTickets,
  getTicketStats,
  updateTicket,
  changeTicketStatus,
  assignTicket,
  getTicketMessages,
  addTicketMessage,
} from '@/api/endpoints/support-tickets'
import type {
  TicketQueryParams,
  CreateTicketRequest,
  UpdateTicketRequest,
  ChangeTicketStatusRequest,
  AssignTicketRequest,
  CreateTicketMessageRequest,
} from '@/types'

// Query key factory
export const supportTicketKeys = {
  all: ['support-tickets'] as const,
  lists: () => [...supportTicketKeys.all, 'list'] as const,
  list: (filters: TicketQueryParams) => [...supportTicketKeys.lists(), filters] as const,
  details: () => [...supportTicketKeys.all, 'detail'] as const,
  detail: (id: string) => [...supportTicketKeys.details(), id] as const,
  stats: () => [...supportTicketKeys.all, 'stats'] as const,
  messages: (ticketId: string) =>
    [...supportTicketKeys.all, 'messages', ticketId] as const,
}

// ============================================
// Query hooks
// ============================================

export function useSupportTickets(params: TicketQueryParams = {}) {
  return useQuery({
    queryKey: supportTicketKeys.list(params),
    queryFn: () => getTickets(params),
    staleTime: 120_000,
  })
}

export function useSupportTicket(id: string) {
  return useQuery({
    queryKey: supportTicketKeys.detail(id),
    queryFn: () => getTicket(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useTicketStats() {
  return useQuery({
    queryKey: supportTicketKeys.stats(),
    queryFn: getTicketStats,
    staleTime: 300_000,
  })
}

export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: supportTicketKeys.messages(ticketId),
    queryFn: () => getTicketMessages(ticketId),
    staleTime: 60_000,
    enabled: !!ticketId,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTicketRequest) => createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.stats() })
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketRequest }) =>
      updateTicket(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: supportTicketKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() })
    },
  })
}

export function useChangeTicketStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangeTicketStatusRequest }) =>
      changeTicketStatus(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: supportTicketKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.stats() })
    },
  })
}

export function useAssignTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignTicketRequest }) =>
      assignTicket(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: supportTicketKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() })
    },
  })
}

export function useAddTicketMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: string
      data: CreateTicketMessageRequest
    }) => addTicketMessage(ticketId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: supportTicketKeys.messages(variables.ticketId),
      })
      queryClient.invalidateQueries({
        queryKey: supportTicketKeys.detail(variables.ticketId),
      })
    },
  })
}
