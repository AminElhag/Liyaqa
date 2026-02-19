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
  createPTClass,
  getPTClasses,
  getPTClass,
  updatePTClass,
  schedulePTSession,
  getScheduledPTSessions,
  completeScheduledPTSession,
  cancelScheduledPTSession,
  getTrainerPTSessions,
  getPTDashboardStats,
  createTrainerSession,
} from "../lib/api/pt-sessions";
import { trainerPortalKeys } from "./use-trainer-portal";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  PTSession,
  PTSessionSummary,
  BookPTSessionRequest,
  ReschedulePTSessionRequest,
  CancelPTSessionRequest,
  CompletePTSessionRequest,
  CreateTrainerSessionRequest,
  PTSessionQueryParams,
  AvailableSlot,
} from "../types/pt-session";
import type {
  GymClass,
  ClassSession,
  CreatePTClassRequest,
  PTDashboardStats,
  PTSessionQueryParams as PTClassQueryParams,
} from "../types/scheduling";

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
  // PT class template keys
  classes: () => [...ptSessionKeys.all, "classes"] as const,
  classList: (params: PTClassQueryParams) =>
    [...ptSessionKeys.classes(), "list", params] as const,
  classDetail: (id: UUID) =>
    [...ptSessionKeys.classes(), "detail", id] as const,
  // Scheduled PT sessions
  scheduled: () => [...ptSessionKeys.all, "scheduled"] as const,
  scheduledList: (params: PTClassQueryParams) =>
    [...ptSessionKeys.scheduled(), "list", params] as const,
  trainerSessions: (trainerId: UUID) =>
    [...ptSessionKeys.all, "trainer", trainerId] as const,
  // Dashboard
  dashboard: (trainerId?: UUID) =>
    [...ptSessionKeys.all, "dashboard", trainerId] as const,
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

/**
 * Hook to fetch PT sessions for a specific member
 */
export function useMemberPTSessions(
  memberId: UUID,
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<PTSessionSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ptSessionKeys.list({ memberId, ...params }),
    queryFn: () => getPTSessions({ memberId, ...params }),
    enabled: !!memberId,
    ...options,
  });
}

// ==================== Trainer Session Creation ====================

/**
 * Hook for trainers to create a PT session (auto-confirmed).
 * Invalidates both PT session caches and trainer portal schedule/dashboard caches.
 */
export function useCreateTrainerSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTrainerSessionRequest) =>
      createTrainerSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.myUpcoming() });
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.schedule(),
      });
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.dashboards(),
      });
    },
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
      queryClient.invalidateQueries({ queryKey: trainerPortalKeys.schedule() });
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
      queryClient.invalidateQueries({ queryKey: trainerPortalKeys.schedule() });
      queryClient.invalidateQueries({ queryKey: trainerPortalKeys.dashboards() });
      queryClient.invalidateQueries({ queryKey: trainerPortalKeys.earnings() });
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
      queryClient.invalidateQueries({ queryKey: trainerPortalKeys.schedule() });
      queryClient.invalidateQueries({ queryKey: trainerPortalKeys.dashboards() });
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
      queryClient.invalidateQueries({ queryKey: trainerPortalKeys.schedule() });
      queryClient.invalidateQueries({ queryKey: trainerPortalKeys.dashboards() });
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

// ==================== PT Class Template Hooks ====================

/**
 * Hook to fetch paginated PT class templates
 */
export function usePTClasses(
  params: PTClassQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<GymClass>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ptSessionKeys.classList(params),
    queryFn: () => getPTClasses(params),
    ...options,
  });
}

/**
 * Hook to fetch a single PT class template
 */
export function usePTClass(
  id: UUID,
  options?: Omit<UseQueryOptions<GymClass>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ptSessionKeys.classDetail(id),
    queryFn: () => getPTClass(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a PT class template
 */
export function useCreatePTClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePTClassRequest) => createPTClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.classes() });
    },
  });
}

/**
 * Hook to update a PT class template
 */
export function useUpdatePTClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: Partial<CreatePTClassRequest> }) =>
      updatePTClass(id, data),
    onSuccess: (updatedClass) => {
      queryClient.setQueryData(ptSessionKeys.classDetail(updatedClass.id), updatedClass);
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.classes() });
    },
  });
}

// ==================== Scheduled PT Session Hooks ====================

/**
 * Hook to schedule a PT session from a class template
 */
export function useSchedulePTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      gymClassId: UUID;
      sessionDate: string;
      startTime: string;
      endTime: string;
      clientAddress?: string;
      notesEn?: string;
      notesAr?: string;
      skipAvailabilityCheck?: boolean;
    }) => schedulePTSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.scheduled() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.dashboard() });
    },
  });
}

/**
 * Hook to fetch scheduled PT sessions with filters
 */
export function useScheduledPTSessions(
  params: PTClassQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<ClassSession>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ptSessionKeys.scheduledList(params),
    queryFn: () => getScheduledPTSessions(params),
    ...options,
  });
}

/**
 * Hook to complete a scheduled PT session with notes
 */
export function useCompleteScheduledPTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: UUID;
      data: { completionNotes?: string; trainerNotes?: string };
    }) => completeScheduledPTSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.scheduled() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.dashboard() });
    },
  });
}

/**
 * Hook to cancel a scheduled PT session
 */
export function useCancelScheduledPTSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: UUID; data?: { reason?: string } }) =>
      cancelScheduledPTSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.scheduled() });
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.dashboard() });
    },
  });
}

/**
 * Hook to fetch PT sessions for a specific trainer
 */
export function useTrainerPTSessions(
  trainerId: UUID,
  params: { startDate?: string; endDate?: string; page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<ClassSession>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...ptSessionKeys.trainerSessions(trainerId), params],
    queryFn: () => getTrainerPTSessions(trainerId, params),
    enabled: !!trainerId,
    ...options,
  });
}

// ==================== Dashboard Hook ====================

/**
 * Hook to fetch PT dashboard stats
 */
export function usePTDashboardStats(
  params: { trainerId?: UUID } = {},
  options?: Omit<UseQueryOptions<PTDashboardStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ptSessionKeys.dashboard(params.trainerId),
    queryFn: () => getPTDashboardStats(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}
