"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getPTSessions,
  getPTSession,
  bookPTSession,
  deletePTSession,
  confirmPTSession,
  startPTSession,
  completePTSession,
  markPTSessionNoShow,
  reschedulePTSession,
  cancelPTSession,
  getMyPendingPTSessions,
  getMyUpcomingPTSessions,
  getMemberUpcomingPTSessions,
  getPTTrainerAvailability,
} from "@/lib/api/pt-sessions";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  PTSession,
  PTSessionSummary,
  BookPTSessionRequest,
  ReschedulePTSessionRequest,
  CancelPTSessionRequest,
  CompletePTSessionRequest,
  PTSessionQueryParams,
  AvailableSlot,
} from "@/types/pt-session";

// Query keys
export const ptSessionKeys = {
  all: ["pt-sessions"] as const,
  lists: () => [...ptSessionKeys.all, "list"] as const,
  list: (params: PTSessionQueryParams) => [...ptSessionKeys.lists(), params] as const,
  details: () => [...ptSessionKeys.all, "detail"] as const,
  detail: (id: UUID) => [...ptSessionKeys.details(), id] as const,
  myPending: () => [...ptSessionKeys.all, "my", "pending"] as const,
  myUpcoming: () => [...ptSessionKeys.all, "my", "upcoming"] as const,
  memberUpcoming: () => [...ptSessionKeys.all, "member", "upcoming"] as const,
  availability: (trainerId: UUID, date: string) =>
    [...ptSessionKeys.all, "availability", trainerId, date] as const,
};

// ==================== Query Hooks ====================

/**
 * Hook to fetch paginated PT sessions (admin)
 */
export function usePTSessions(
  params: PTSessionQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<PTSessionSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ptSessionKeys.list(params),
    queryFn: () => getPTSessions(params),
    ...options,
  });
}

/**
 * Hook to fetch a single PT session by ID
 */
export function usePTSession(
  id: UUID,
  options?: Omit<UseQueryOptions<PTSession>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ptSessionKeys.detail(id),
    queryFn: () => getPTSession(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch pending PT sessions for current trainer
 */
export function useMyPendingPTSessions(
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<PTSessionSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ptSessionKeys.myPending(),
    queryFn: () => getMyPendingPTSessions(params),
    ...options,
  });
}

/**
 * Hook to fetch upcoming PT sessions for current trainer
 */
export function useMyUpcomingPTSessions(
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<PTSessionSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ptSessionKeys.myUpcoming(),
    queryFn: () => getMyUpcomingPTSessions(params),
    ...options,
  });
}

/**
 * Hook to fetch upcoming PT sessions for current member
 */
export function useMemberUpcomingPTSessions(
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<PTSessionSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ptSessionKeys.memberUpcoming(),
    queryFn: () => getMemberUpcomingPTSessions(params),
    ...options,
  });
}

/**
 * Hook to fetch trainer availability for a specific date
 */
export function usePTTrainerAvailability(
  trainerId: UUID,
  date: string,
  slotDurationMinutes: number = 60,
  options?: Omit<UseQueryOptions<AvailableSlot[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ptSessionKeys.availability(trainerId, date),
    queryFn: () => getPTTrainerAvailability(trainerId, date, slotDurationMinutes),
    enabled: !!trainerId && !!date,
    ...options,
  });
}

// ==================== Mutation Hooks ====================

/**
 * Hook to book a new PT session (member)
 */
export function useBookPTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BookPTSessionRequest) => bookPTSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.memberUpcoming() });
    },
  });
}

/**
 * Hook to confirm a PT session (trainer)
 */
export function useConfirmPTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => confirmPTSession(id),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(ptSessionKeys.detail(updatedSession.id), updatedSession);
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.myPending() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.myUpcoming() });
    },
  });
}

/**
 * Hook to start a PT session (trainer)
 */
export function useStartPTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => startPTSession(id),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(ptSessionKeys.detail(updatedSession.id), updatedSession);
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.myUpcoming() });
    },
  });
}

/**
 * Hook to complete a PT session (trainer)
 */
export function useCompletePTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data?: CompletePTSessionRequest }) =>
      completePTSession(id, data),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(ptSessionKeys.detail(updatedSession.id), updatedSession);
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.myUpcoming() });
    },
  });
}

/**
 * Hook to mark PT session as no-show (trainer)
 */
export function useMarkPTSessionNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => markPTSessionNoShow(id),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(ptSessionKeys.detail(updatedSession.id), updatedSession);
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.myUpcoming() });
    },
  });
}

/**
 * Hook to reschedule a PT session (trainer)
 */
export function useReschedulePTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: ReschedulePTSessionRequest }) =>
      reschedulePTSession(id, data),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(ptSessionKeys.detail(updatedSession.id), updatedSession);
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.myUpcoming() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.memberUpcoming() });
    },
  });
}

/**
 * Hook to cancel a PT session (trainer or member)
 */
export function useCancelPTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data?: CancelPTSessionRequest }) =>
      cancelPTSession(id, data),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(ptSessionKeys.detail(updatedSession.id), updatedSession);
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.myPending() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.myUpcoming() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.memberUpcoming() });
    },
  });
}

/**
 * Hook to delete a PT session (admin)
 */
export function useDeletePTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deletePTSession(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ptSessionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.lists() });
    },
  });
}
