"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  activateEmployee,
  deactivateEmployee,
  setEmployeeOnLeave,
  returnEmployeeFromLeave,
  terminateEmployee,
  getEmployeeLocations,
  assignEmployeeToLocation,
  removeEmployeeFromLocation,
  setPrimaryLocation,
  getExpiringCertifications,
  getEmployeeStats,
} from "../lib/api/employees";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  Employee,
  EmployeeSummary,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeQueryParams,
  EmployeeStats,
  EmployeeLocationAssignment,
  AssignLocationRequest,
  ExpiringCertification,
} from "../types/employee";

// ==================== QUERY KEYS ====================

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (params: EmployeeQueryParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: UUID) => [...employeeKeys.details(), id] as const,
  locations: (id: UUID) => [...employeeKeys.all, "locations", id] as const,
  expiringCertifications: (daysAhead: number) =>
    [...employeeKeys.all, "expiring-certifications", daysAhead] as const,
  stats: () => [...employeeKeys.all, "stats"] as const,
};

// ==================== LIST QUERIES ====================

/**
 * Hook to fetch paginated employees list
 */
export function useEmployees(
  params: EmployeeQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<EmployeeSummary>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => getEmployees(params),
    ...options,
  });
}

/**
 * Hook to fetch a single employee by ID
 */
export function useEmployee(
  id: UUID,
  options?: Omit<UseQueryOptions<Employee>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => getEmployee(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch employee statistics
 */
export function useEmployeeStats(
  options?: Omit<UseQueryOptions<EmployeeStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: employeeKeys.stats(),
    queryFn: getEmployeeStats,
    ...options,
  });
}

/**
 * Hook to fetch expiring certifications
 */
export function useExpiringCertifications(
  daysAhead: number = 30,
  options?: Omit<UseQueryOptions<ExpiringCertification[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: employeeKeys.expiringCertifications(daysAhead),
    queryFn: () => getExpiringCertifications(daysAhead),
    ...options,
  });
}

// ==================== CRUD MUTATIONS ====================

/**
 * Hook to create a new employee
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeRequest) => createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
    },
  });
}

/**
 * Hook to update an employee
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateEmployeeRequest }) =>
      updateEmployee(id, data),
    onSuccess: (updatedEmployee) => {
      queryClient.setQueryData(
        employeeKeys.detail(updatedEmployee.id),
        updatedEmployee
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

/**
 * Hook to delete an employee
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
    },
  });
}

// ==================== STATUS MUTATIONS ====================

/**
 * Hook to activate an employee
 */
export function useActivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateEmployee(id),
    onSuccess: (updatedEmployee) => {
      queryClient.setQueryData(
        employeeKeys.detail(updatedEmployee.id),
        updatedEmployee
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
    },
  });
}

/**
 * Hook to deactivate an employee
 */
export function useDeactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateEmployee(id),
    onSuccess: (updatedEmployee) => {
      queryClient.setQueryData(
        employeeKeys.detail(updatedEmployee.id),
        updatedEmployee
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
    },
  });
}

/**
 * Hook to set employee on leave
 */
export function useSetEmployeeOnLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => setEmployeeOnLeave(id),
    onSuccess: (updatedEmployee) => {
      queryClient.setQueryData(
        employeeKeys.detail(updatedEmployee.id),
        updatedEmployee
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
    },
  });
}

/**
 * Hook to return employee from leave
 */
export function useReturnEmployeeFromLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => returnEmployeeFromLeave(id),
    onSuccess: (updatedEmployee) => {
      queryClient.setQueryData(
        employeeKeys.detail(updatedEmployee.id),
        updatedEmployee
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
    },
  });
}

/**
 * Hook to terminate an employee
 */
export function useTerminateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, terminationDate }: { id: UUID; terminationDate?: string }) =>
      terminateEmployee(id, terminationDate),
    onSuccess: (updatedEmployee) => {
      queryClient.setQueryData(
        employeeKeys.detail(updatedEmployee.id),
        updatedEmployee
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
    },
  });
}

// ==================== LOCATION QUERIES & MUTATIONS ====================

/**
 * Hook to fetch employee's assigned locations
 */
export function useEmployeeLocations(
  employeeId: UUID,
  options?: Omit<UseQueryOptions<EmployeeLocationAssignment[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: employeeKeys.locations(employeeId),
    queryFn: () => getEmployeeLocations(employeeId),
    enabled: !!employeeId,
    ...options,
  });
}

/**
 * Hook to assign employee to a location
 */
export function useAssignEmployeeToLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      data,
    }: {
      employeeId: UUID;
      data: AssignLocationRequest;
    }) => assignEmployeeToLocation(employeeId, data),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.locations(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(employeeId),
      });
    },
  });
}

/**
 * Hook to remove employee from a location
 */
export function useRemoveEmployeeFromLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      locationId,
    }: {
      employeeId: UUID;
      locationId: UUID;
    }) => removeEmployeeFromLocation(employeeId, locationId),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.locations(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(employeeId),
      });
    },
  });
}

/**
 * Hook to set primary location
 */
export function useSetPrimaryLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      locationId,
    }: {
      employeeId: UUID;
      locationId: UUID;
    }) => setPrimaryLocation(employeeId, locationId),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.locations(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(employeeId),
      });
    },
  });
}
