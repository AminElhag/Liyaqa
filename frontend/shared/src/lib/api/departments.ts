import { api } from "./client";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  Department,
  DepartmentTreeNode,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  SetManagerRequest,
  DepartmentQueryParams,
  DepartmentStats,
} from "../types/employee";

const BASE_URL = "api/departments";

/**
 * Build query string from params
 */
function buildQueryString(params: DepartmentQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sort) searchParams.set("sortBy", params.sort);
  if (params.direction) searchParams.set("sortDirection", params.direction.toUpperCase());
  return searchParams.toString();
}

// ==================== CRUD ====================

/**
 * Get paginated list of departments
 */
export async function getDepartments(
  params: DepartmentQueryParams = {}
): Promise<PaginatedResponse<Department>> {
  const query = buildQueryString(params);
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;
  return api.get(url).json();
}

/**
 * Get department by ID
 */
export async function getDepartment(id: UUID): Promise<Department> {
  return api.get(`${BASE_URL}/${id}`).json();
}

/**
 * Create a new department
 */
export async function createDepartment(data: CreateDepartmentRequest): Promise<Department> {
  return api.post(BASE_URL, { json: data }).json();
}

/**
 * Update an existing department
 */
export async function updateDepartment(
  id: UUID,
  data: UpdateDepartmentRequest
): Promise<Department> {
  return api.patch(`${BASE_URL}/${id}`, { json: data }).json();
}

/**
 * Delete a department
 */
export async function deleteDepartment(id: UUID): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

// ==================== HIERARCHY ====================

/**
 * Get department tree (hierarchical structure)
 */
export async function getDepartmentTree(): Promise<DepartmentTreeNode[]> {
  return api.get(`${BASE_URL}/tree`).json();
}

/**
 * Get root departments (no parent)
 */
export async function getRootDepartments(): Promise<Department[]> {
  return api.get(`${BASE_URL}/root`).json();
}

/**
 * Get child departments
 */
export async function getChildDepartments(parentId: UUID): Promise<Department[]> {
  return api.get(`${BASE_URL}/${parentId}/children`).json();
}

/**
 * Get active departments
 */
export async function getActiveDepartments(): Promise<Department[]> {
  return api.get(`${BASE_URL}/active`).json();
}

// ==================== STATUS MANAGEMENT ====================

/**
 * Activate a department
 */
export async function activateDepartment(id: UUID): Promise<Department> {
  return api.post(`${BASE_URL}/${id}/activate`).json();
}

/**
 * Deactivate a department
 */
export async function deactivateDepartment(id: UUID): Promise<Department> {
  return api.post(`${BASE_URL}/${id}/deactivate`).json();
}

// ==================== MANAGER MANAGEMENT ====================

/**
 * Set department manager
 */
export async function setDepartmentManager(
  id: UUID,
  data: SetManagerRequest
): Promise<Department> {
  return api.post(`${BASE_URL}/${id}/set-manager`, { json: data }).json();
}

/**
 * Clear department manager
 */
export async function clearDepartmentManager(id: UUID): Promise<Department> {
  return api.post(`${BASE_URL}/${id}/clear-manager`).json();
}

// ==================== STATISTICS ====================

/**
 * Get department count
 */
export async function getDepartmentCount(): Promise<number> {
  return api.get(`${BASE_URL}/count`).json();
}

/**
 * Get department statistics
 */
export async function getDepartmentStats(): Promise<DepartmentStats> {
  return api.get(`${BASE_URL}/stats`).json();
}
