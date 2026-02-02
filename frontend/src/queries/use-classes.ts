"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getClasses,
  getClass,
  getActiveClasses,
  createClass,
  updateClass,
  deleteClass,
  activateClass,
  deactivateClass,
  generateSessions,
  createSession,
  getSession,
  updateSession,
  getSessionsByDate,
  getSessions,
  getUpcomingSessionsByClass,
  cancelSession,
  startSession,
  completeSession,
} from "@/lib/api/classes";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  GymClass,
  ClassQueryParams,
  CreateClassRequest,
  UpdateClassRequest,
  GenerateSessionsRequest,
  ClassSession,
} from "@/types/scheduling";

// Query keys
export const classKeys = {
  all: ["classes"] as const,
  lists: () => [...classKeys.all, "list"] as const,
  list: (params: ClassQueryParams) => [...classKeys.lists(), params] as const,
  details: () => [...classKeys.all, "detail"] as const,
  detail: (id: UUID) => [...classKeys.details(), id] as const,
  active: () => [...classKeys.all, "active"] as const,
};

// Class session query keys
export const classSessionKeys = {
  all: ["class-sessions"] as const,
  lists: () => [...classSessionKeys.all, "list"] as const,
  details: () => [...classSessionKeys.all, "detail"] as const,
  detail: (id: UUID) => [...classSessionKeys.details(), id] as const,
  byDate: (date: string) => [...classSessionKeys.all, "date", date] as const,
};

/**
 * Hook to fetch paginated classes
 */
export function useClasses(
  params: ClassQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<GymClass>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: classKeys.list(params),
    queryFn: () => getClasses(params),
    ...options,
  });
}

/**
 * Hook to fetch a single class by ID
 */
export function useClass(
  id: UUID,
  options?: Omit<UseQueryOptions<GymClass>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: () => getClass(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch active classes (for dropdowns)
 */
export function useActiveClasses(
  options?: Omit<UseQueryOptions<GymClass[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: classKeys.active(),
    queryFn: () => getActiveClasses(),
    ...options,
  });
}

/**
 * Hook to create a new class
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClassRequest) => createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.active() });
    },
  });
}

/**
 * Hook to update a class
 */
export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateClassRequest }) =>
      updateClass(id, data),
    onSuccess: (updatedClass) => {
      queryClient.setQueryData(classKeys.detail(updatedClass.id), updatedClass);
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.active() });
    },
  });
}

/**
 * Hook to delete a class
 */
export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteClass(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: classKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.active() });
    },
  });
}

/**
 * Hook to activate a class
 */
export function useActivateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateClass(id),
    onSuccess: (updatedClass) => {
      queryClient.setQueryData(classKeys.detail(updatedClass.id), updatedClass);
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.active() });
    },
  });
}

/**
 * Hook to deactivate a class
 */
export function useDeactivateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateClass(id),
    onSuccess: (updatedClass) => {
      queryClient.setQueryData(classKeys.detail(updatedClass.id), updatedClass);
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.active() });
    },
  });
}

/**
 * Hook to generate sessions for a class
 */
export function useGenerateSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      data,
    }: {
      classId: UUID;
      data: GenerateSessionsRequest;
    }) => generateSessions(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classSessionKeys.all });
    },
  });
}

/**
 * Hook to fetch class sessions with filters
 */
export function useClassSessions(params: {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  locationId?: string;
  trainerId?: string;
  page?: number;
  size?: number;
} = {}) {
  return useQuery({
    queryKey: [...classSessionKeys.lists(), params],
    queryFn: () => getSessions(params),
  });
}

/**
 * Hook to fetch a single class session
 */
export function useSession(id: UUID) {
  return useQuery({
    queryKey: classSessionKeys.detail(id),
    queryFn: () => getSession(id),
  });
}

/**
 * Hook to create a class session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      classId: UUID;
      date: string;
      startTime: string;
      endTime: string;
      capacity?: number;
    }) => createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classSessionKeys.all });
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

/**
 * Hook to update a class session
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: {
        date?: string;
        startTime?: string;
        endTime?: string;
        capacity?: number;
      };
    }) => updateSession(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: classSessionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: classSessionKeys.all });
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

/**
 * Hook to fetch upcoming sessions for a class
 */
export function useUpcomingSessionsByClass(
  classId: UUID,
  params?: { page?: number; size?: number }
) {
  return useQuery({
    queryKey: [...classSessionKeys.all, "upcoming", classId, params],
    queryFn: () => getUpcomingSessionsByClass(classId, params),
  });
}

/**
 * Hook to cancel a session
 */
export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: UUID; reason?: string }) =>
      cancelSession(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: classSessionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: classSessionKeys.all });
      queryClient.invalidateQueries({ queryKey: classKeys.all });
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
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: classSessionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: classSessionKeys.all });
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
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: classSessionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: classSessionKeys.all });
    },
  });
}
