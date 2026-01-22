"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getSessions,
  getSession,
  getSessionsByDate,
  getSessionsByDateRange,
  getSessionBookings,
  getUpcomingSessions,
  getUpcomingSessionsByClass,
  cancelSession,
  startSession,
  completeSession,
  createSession,
  updateSession,
  getSessionQrCode,
  type CreateSessionRequest,
  type UpdateSessionRequest,
  type SessionQrCodeResponse,
} from "@/lib/api/sessions";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  ClassSession,
  SessionQueryParams,
  Booking,
} from "@/types/scheduling";

// Query keys
export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  list: (params: SessionQueryParams) => [...sessionKeys.lists(), params] as const,
  details: () => [...sessionKeys.all, "detail"] as const,
  detail: (id: UUID) => [...sessionKeys.details(), id] as const,
  date: (date: string) => [...sessionKeys.all, "date", date] as const,
  dateRange: (from: string, to: string) =>
    [...sessionKeys.all, "range", from, to] as const,
  upcoming: () => [...sessionKeys.all, "upcoming"] as const,
  upcomingByClass: (classId: UUID) =>
    [...sessionKeys.all, "upcoming", "class", classId] as const,
  bookings: (sessionId: UUID) =>
    [...sessionKeys.all, "bookings", sessionId] as const,
  qrCode: (sessionId: UUID) =>
    [...sessionKeys.all, "qrCode", sessionId] as const,
};

/**
 * Hook to fetch paginated sessions
 */
export function useSessions(
  params: SessionQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<ClassSession>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: sessionKeys.list(params),
    queryFn: () => getSessions(params),
    ...options,
  });
}

/**
 * Hook to fetch a single session by ID
 */
export function useSession(
  id: UUID,
  options?: Omit<UseQueryOptions<ClassSession>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => getSession(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch sessions for a specific date
 */
export function useSessionsByDate(
  date: string,
  options?: Omit<UseQueryOptions<ClassSession[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: sessionKeys.date(date),
    queryFn: () => getSessionsByDate(date),
    enabled: !!date,
    ...options,
  });
}

/**
 * Hook to fetch sessions for a date range
 */
export function useSessionsByDateRange(
  dateFrom: string,
  dateTo: string,
  options?: Omit<UseQueryOptions<ClassSession[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: sessionKeys.dateRange(dateFrom, dateTo),
    queryFn: () => getSessionsByDateRange(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    ...options,
  });
}

/**
 * Hook to fetch upcoming sessions (next 7 days)
 */
export function useUpcomingSessions(
  options?: Omit<UseQueryOptions<ClassSession[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: sessionKeys.upcoming(),
    queryFn: () => getUpcomingSessions(),
    ...options,
  });
}

/**
 * Hook to fetch upcoming sessions for a specific class (next 14 days)
 */
export function useUpcomingSessionsByClass(
  classId: UUID,
  options?: Omit<UseQueryOptions<ClassSession[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: sessionKeys.upcomingByClass(classId),
    queryFn: () => getUpcomingSessionsByClass(classId),
    enabled: !!classId,
    ...options,
  });
}

/**
 * Hook to fetch bookings for a session
 */
export function useSessionBookings(
  sessionId: UUID,
  options?: Omit<UseQueryOptions<Booking[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: sessionKeys.bookings(sessionId),
    queryFn: () => getSessionBookings(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

/**
 * Hook to cancel a session
 */
export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => cancelSession(id),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(
        sessionKeys.detail(updatedSession.id),
        updatedSession
      );
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

/**
 * Hook to start a session
 */
export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => startSession(id),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(
        sessionKeys.detail(updatedSession.id),
        updatedSession
      );
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}

/**
 * Hook to complete a session
 */
export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => completeSession(id),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(
        sessionKeys.detail(updatedSession.id),
        updatedSession
      );
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}

/**
 * Hook to create a session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSessionRequest) => createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.upcoming() });
    },
  });
}

/**
 * Hook to update a session
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateSessionRequest }) =>
      updateSession(id, data),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(
        sessionKeys.detail(updatedSession.id),
        updatedSession
      );
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.upcoming() });
    },
  });
}

/**
 * Hook to fetch QR code for session check-in (for trainers)
 */
export function useSessionQrCode(
  sessionId: UUID,
  options?: Omit<UseQueryOptions<SessionQrCodeResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: sessionKeys.qrCode(sessionId),
    queryFn: () => getSessionQrCode(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

