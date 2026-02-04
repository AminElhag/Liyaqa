"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getJobTitles,
  getJobTitle,
  createJobTitle,
  updateJobTitle,
  deleteJobTitle,
  getActiveJobTitles,
  getJobTitlesByDepartment,
  activateJobTitle,
  deactivateJobTitle,
  getJobTitleStats,
} from "../lib/api/job-titles";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  JobTitle,
  JobTitleSummary,
  CreateJobTitleRequest,
  UpdateJobTitleRequest,
  JobTitleQueryParams,
  JobTitleStats,
} from "../types/employee";

// ==================== QUERY KEYS ====================

export const jobTitleKeys = {
  all: ["jobTitles"] as const,
  lists: () => [...jobTitleKeys.all, "list"] as const,
  list: (params: JobTitleQueryParams) => [...jobTitleKeys.lists(), params] as const,
  details: () => [...jobTitleKeys.all, "detail"] as const,
  detail: (id: UUID) => [...jobTitleKeys.details(), id] as const,
  active: () => [...jobTitleKeys.all, "active"] as const,
  byDepartment: (departmentId: UUID, activeOnly?: boolean) =>
    [...jobTitleKeys.all, "byDepartment", departmentId, activeOnly] as const,
  stats: () => [...jobTitleKeys.all, "stats"] as const,
};

// ==================== LIST QUERIES ====================

/**
 * Hook to fetch paginated job titles list
 */
export function useJobTitles(
  params: JobTitleQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<JobTitleSummary>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: jobTitleKeys.list(params),
    queryFn: () => getJobTitles(params),
    ...options,
  });
}

/**
 * Hook to fetch a single job title by ID
 */
export function useJobTitle(
  id: UUID,
  options?: Omit<UseQueryOptions<JobTitle>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: jobTitleKeys.detail(id),
    queryFn: () => getJobTitle(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch active job titles
 */
export function useActiveJobTitles(
  options?: Omit<UseQueryOptions<JobTitleSummary[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: jobTitleKeys.active(),
    queryFn: getActiveJobTitles,
    ...options,
  });
}

/**
 * Hook to fetch job titles by department
 */
export function useJobTitlesByDepartment(
  departmentId: UUID,
  activeOnly?: boolean,
  options?: Omit<UseQueryOptions<JobTitleSummary[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: jobTitleKeys.byDepartment(departmentId, activeOnly),
    queryFn: () => getJobTitlesByDepartment(departmentId, activeOnly),
    enabled: !!departmentId,
    ...options,
  });
}

/**
 * Hook to fetch job title statistics
 */
export function useJobTitleStats(
  options?: Omit<UseQueryOptions<JobTitleStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: jobTitleKeys.stats(),
    queryFn: getJobTitleStats,
    ...options,
  });
}

// ==================== CRUD MUTATIONS ====================

/**
 * Hook to create a new job title
 */
export function useCreateJobTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobTitleRequest) => createJobTitle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.active() });
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.stats() });
    },
  });
}

/**
 * Hook to update a job title
 */
export function useUpdateJobTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateJobTitleRequest }) =>
      updateJobTitle(id, data),
    onSuccess: (updatedJobTitle) => {
      queryClient.setQueryData(
        jobTitleKeys.detail(updatedJobTitle.id),
        updatedJobTitle
      );
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.active() });
    },
  });
}

/**
 * Hook to delete a job title
 */
export function useDeleteJobTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteJobTitle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.active() });
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.stats() });
    },
  });
}

// ==================== STATUS MUTATIONS ====================

/**
 * Hook to activate a job title
 */
export function useActivateJobTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateJobTitle(id),
    onSuccess: (updatedJobTitle) => {
      queryClient.setQueryData(
        jobTitleKeys.detail(updatedJobTitle.id),
        updatedJobTitle
      );
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.active() });
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.stats() });
    },
  });
}

/**
 * Hook to deactivate a job title
 */
export function useDeactivateJobTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateJobTitle(id),
    onSuccess: (updatedJobTitle) => {
      queryClient.setQueryData(
        jobTitleKeys.detail(updatedJobTitle.id),
        updatedJobTitle
      );
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.active() });
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.stats() });
    },
  });
}
