"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
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
} from "../lib/api/platform/support-tickets";
import type { PageResponse, UUID } from "../types/api";
import type {
  SupportTicket,
  SupportTicketSummary,
  TicketStats,
  TicketMessage,
  CreateTicketRequest,
  UpdateTicketRequest,
  CreateTicketMessageRequest,
  ChangeTicketStatusRequest,
  AssignTicketRequest,
  TicketQueryParams,
} from "../types/platform/support-ticket";

// Query keys
export const supportTicketKeys = {
  all: ["platform", "supportTickets"] as const,
  lists: () => [...supportTicketKeys.all, "list"] as const,
  list: (params: TicketQueryParams) =>
    [...supportTicketKeys.lists(), params] as const,
  details: () => [...supportTicketKeys.all, "detail"] as const,
  detail: (id: UUID) => [...supportTicketKeys.details(), id] as const,
  messages: (ticketId: UUID) =>
    [...supportTicketKeys.detail(ticketId), "messages"] as const,
  stats: () => [...supportTicketKeys.all, "stats"] as const,
};

/**
 * Hook to fetch paginated support tickets list
 */
export function useSupportTickets(
  params: TicketQueryParams = {},
  options?: Omit<
    UseQueryOptions<PageResponse<SupportTicketSummary>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: supportTicketKeys.list(params),
    queryFn: () => getTickets(params),
    ...options,
  });
}

/**
 * Hook to fetch a single support ticket by ID
 */
export function useSupportTicket(
  id: UUID,
  options?: Omit<UseQueryOptions<SupportTicket>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: supportTicketKeys.detail(id),
    queryFn: () => getTicket(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch ticket statistics
 */
export function useTicketStats(
  options?: Omit<UseQueryOptions<TicketStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: supportTicketKeys.stats(),
    queryFn: () => getTicketStats(),
    ...options,
  });
}

/**
 * Hook to fetch ticket messages
 */
export function useTicketMessages(
  ticketId: UUID,
  options?: Omit<UseQueryOptions<TicketMessage[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: supportTicketKeys.messages(ticketId),
    queryFn: () => getTicketMessages(ticketId),
    enabled: !!ticketId,
    ...options,
  });
}

/**
 * Hook to create a new support ticket
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketRequest) => createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.stats() });
    },
  });
}

/**
 * Hook to update a support ticket
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateTicketRequest }) =>
      updateTicket(id, data),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(
        supportTicketKeys.detail(updatedTicket.id),
        updatedTicket
      );
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() });
    },
  });
}

/**
 * Hook to change ticket status
 */
export function useChangeTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: ChangeTicketStatusRequest;
    }) => changeTicketStatus(id, data),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(
        supportTicketKeys.detail(updatedTicket.id),
        updatedTicket
      );
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.stats() });
    },
  });
}

/**
 * Hook to assign ticket to a platform user
 */
export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: AssignTicketRequest }) =>
      assignTicket(id, data),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(
        supportTicketKeys.detail(updatedTicket.id),
        updatedTicket
      );
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() });
    },
  });
}

/**
 * Hook to add message to a ticket
 */
export function useAddTicketMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: UUID;
      data: CreateTicketMessageRequest;
    }) => addTicketMessage(ticketId, data),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({
        queryKey: supportTicketKeys.messages(ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: supportTicketKeys.detail(ticketId),
      });
    },
  });
}
