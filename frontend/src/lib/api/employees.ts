import { api } from "./client";
import type { PaginatedResponse, UUID } from "@/types/api";
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
} from "@/types/employee";

const BASE_URL = "api/employees";

/**
 * Build query string from params
 */
function buildQueryString(params: EmployeeQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.departmentId) searchParams.set("departmentId", params.departmentId);
  if (params.employmentType) searchParams.set("employmentType", params.employmentType);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sort) searchParams.set("sortBy", params.sort);
  if (params.direction) searchParams.set("sortDirection", params.direction.toUpperCase());
  return searchParams.toString();
}

// ==================== CRUD ====================

/**
 * Get paginated list of employees
 */
export async function getEmployees(
  params: EmployeeQueryParams = {}
): Promise<PaginatedResponse<EmployeeSummary>> {
  const query = buildQueryString(params);
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;
  return api.get(url).json();
}

/**
 * Get employee by ID
 */
export async function getEmployee(id: UUID): Promise<Employee> {
  return api.get(`${BASE_URL}/${id}`).json();
}

/**
 * Create a new employee
 */
export async function createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
  return api.post(BASE_URL, { json: data }).json();
}

/**
 * Update an existing employee
 */
export async function updateEmployee(
  id: UUID,
  data: UpdateEmployeeRequest
): Promise<Employee> {
  return api.patch(`${BASE_URL}/${id}`, { json: data }).json();
}

/**
 * Delete an employee
 */
export async function deleteEmployee(id: UUID): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

// ==================== STATUS TRANSITIONS ====================

/**
 * Activate an employee
 */
export async function activateEmployee(id: UUID): Promise<Employee> {
  return api.post(`${BASE_URL}/${id}/activate`).json();
}

/**
 * Deactivate an employee
 */
export async function deactivateEmployee(id: UUID): Promise<Employee> {
  return api.post(`${BASE_URL}/${id}/deactivate`).json();
}

/**
 * Set employee on leave
 */
export async function setEmployeeOnLeave(id: UUID): Promise<Employee> {
  return api.post(`${BASE_URL}/${id}/set-on-leave`).json();
}

/**
 * Return employee from leave
 */
export async function returnEmployeeFromLeave(id: UUID): Promise<Employee> {
  return api.post(`${BASE_URL}/${id}/return-from-leave`).json();
}

/**
 * Terminate an employee
 */
export async function terminateEmployee(
  id: UUID,
  terminationDate?: string
): Promise<Employee> {
  const params = terminationDate ? `?terminationDate=${terminationDate}` : "";
  return api.post(`${BASE_URL}/${id}/terminate${params}`).json();
}

// ==================== LOCATION ASSIGNMENTS ====================

/**
 * Get employee's assigned locations
 */
export async function getEmployeeLocations(
  employeeId: UUID
): Promise<EmployeeLocationAssignment[]> {
  return api.get(`${BASE_URL}/${employeeId}/locations`).json();
}

/**
 * Assign employee to a location
 */
export async function assignEmployeeToLocation(
  employeeId: UUID,
  data: AssignLocationRequest
): Promise<EmployeeLocationAssignment> {
  return api.post(`${BASE_URL}/${employeeId}/locations`, { json: data }).json();
}

/**
 * Remove employee from a location
 */
export async function removeEmployeeFromLocation(
  employeeId: UUID,
  locationId: UUID
): Promise<void> {
  await api.delete(`${BASE_URL}/${employeeId}/locations/${locationId}`);
}

/**
 * Set a location as primary
 */
export async function setPrimaryLocation(
  employeeId: UUID,
  locationId: UUID
): Promise<EmployeeLocationAssignment> {
  return api.post(`${BASE_URL}/${employeeId}/locations/${locationId}/set-primary`).json();
}

// ==================== CERTIFICATIONS ====================

/**
 * Get employees with expiring certifications
 */
export async function getExpiringCertifications(
  daysAhead: number = 30
): Promise<ExpiringCertification[]> {
  return api.get(`${BASE_URL}/expiring-certifications?daysAhead=${daysAhead}`).json();
}

// ==================== STATISTICS ====================

/**
 * Get employee count
 */
export async function getEmployeeCount(): Promise<number> {
  return api.get(`${BASE_URL}/count`).json();
}

/**
 * Get employee statistics
 */
export async function getEmployeeStats(): Promise<EmployeeStats> {
  return api.get(`${BASE_URL}/stats`).json();
}
