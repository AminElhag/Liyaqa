"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentTree,
  getRootDepartments,
  getChildDepartments,
  getActiveDepartments,
  activateDepartment,
  deactivateDepartment,
  setDepartmentManager,
  clearDepartmentManager,
  getDepartmentStats,
} from "@/lib/api/departments";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  Department,
  DepartmentTreeNode,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  SetManagerRequest,
  DepartmentQueryParams,
  DepartmentStats,
} from "@/types/employee";

// ==================== QUERY KEYS ====================

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (params: DepartmentQueryParams) => [...departmentKeys.lists(), params] as const,
  details: () => [...departmentKeys.all, "detail"] as const,
  detail: (id: UUID) => [...departmentKeys.details(), id] as const,
  tree: () => [...departmentKeys.all, "tree"] as const,
  root: () => [...departmentKeys.all, "root"] as const,
  children: (parentId: UUID) => [...departmentKeys.all, "children", parentId] as const,
  active: () => [...departmentKeys.all, "active"] as const,
  stats: () => [...departmentKeys.all, "stats"] as const,
};

// ==================== LIST QUERIES ====================

/**
 * Hook to fetch paginated departments list
 */
export function useDepartments(
  params: DepartmentQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Department>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => getDepartments(params),
    ...options,
  });
}

/**
 * Hook to fetch a single department by ID
 */
export function useDepartment(
  id: UUID,
  options?: Omit<UseQueryOptions<Department>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => getDepartment(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch department tree
 */
export function useDepartmentTree(
  options?: Omit<UseQueryOptions<DepartmentTreeNode[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: departmentKeys.tree(),
    queryFn: getDepartmentTree,
    ...options,
  });
}

/**
 * Hook to fetch root departments
 */
export function useRootDepartments(
  options?: Omit<UseQueryOptions<Department[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: departmentKeys.root(),
    queryFn: getRootDepartments,
    ...options,
  });
}

/**
 * Hook to fetch child departments
 */
export function useChildDepartments(
  parentId: UUID,
  options?: Omit<UseQueryOptions<Department[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: departmentKeys.children(parentId),
    queryFn: () => getChildDepartments(parentId),
    enabled: !!parentId,
    ...options,
  });
}

/**
 * Hook to fetch active departments
 */
export function useActiveDepartments(
  options?: Omit<UseQueryOptions<Department[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: departmentKeys.active(),
    queryFn: getActiveDepartments,
    ...options,
  });
}

/**
 * Hook to fetch department statistics
 */
export function useDepartmentStats(
  options?: Omit<UseQueryOptions<DepartmentStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: departmentKeys.stats(),
    queryFn: getDepartmentStats,
    ...options,
  });
}

// ==================== CRUD MUTATIONS ====================

/**
 * Hook to create a new department
 */
export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepartmentRequest) => createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.root() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.active() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
    },
  });
}

/**
 * Hook to update a department
 */
export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateDepartmentRequest }) =>
      updateDepartment(id, data),
    onSuccess: (updatedDepartment) => {
      queryClient.setQueryData(
        departmentKeys.detail(updatedDepartment.id),
        updatedDepartment
      );
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.active() });
    },
  });
}

/**
 * Hook to delete a department
 */
export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.root() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.active() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
    },
  });
}

// ==================== STATUS MUTATIONS ====================

/**
 * Hook to activate a department
 */
export function useActivateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateDepartment(id),
    onSuccess: (updatedDepartment) => {
      queryClient.setQueryData(
        departmentKeys.detail(updatedDepartment.id),
        updatedDepartment
      );
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.active() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
    },
  });
}

/**
 * Hook to deactivate a department
 */
export function useDeactivateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateDepartment(id),
    onSuccess: (updatedDepartment) => {
      queryClient.setQueryData(
        departmentKeys.detail(updatedDepartment.id),
        updatedDepartment
      );
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.active() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
    },
  });
}

// ==================== MANAGER MUTATIONS ====================

/**
 * Hook to set department manager
 */
export function useSetDepartmentManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: SetManagerRequest }) =>
      setDepartmentManager(id, data),
    onSuccess: (updatedDepartment) => {
      queryClient.setQueryData(
        departmentKeys.detail(updatedDepartment.id),
        updatedDepartment
      );
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });
    },
  });
}

/**
 * Hook to clear department manager
 */
export function useClearDepartmentManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => clearDepartmentManager(id),
    onSuccess: (updatedDepartment) => {
      queryClient.setQueryData(
        departmentKeys.detail(updatedDepartment.id),
        updatedDepartment
      );
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });
    },
  });
}
