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
} from "@/lib/api/classes";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  GymClass,
  ClassQueryParams,
  CreateClassRequest,
  UpdateClassRequest,
  GenerateSessionsRequest,
} from "@/types/scheduling";
import { sessionKeys } from "./use-sessions";

// Query keys
export const classKeys = {
  all: ["classes"] as const,
  lists: () => [...classKeys.all, "list"] as const,
  list: (params: ClassQueryParams) => [...classKeys.lists(), params] as const,
  details: () => [...classKeys.all, "detail"] as const,
  detail: (id: UUID) => [...classKeys.details(), id] as const,
  active: () => [...classKeys.all, "active"] as const,
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
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
