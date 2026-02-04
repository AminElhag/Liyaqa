import { api } from "./client";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  JobTitle,
  JobTitleSummary,
  CreateJobTitleRequest,
  UpdateJobTitleRequest,
  JobTitleQueryParams,
  JobTitleStats,
} from "../types/employee";

const BASE_URL = "api/job-titles";

/**
 * Build query string from params
 */
function buildQueryString(params: JobTitleQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.departmentId) searchParams.set("departmentId", params.departmentId);
  if (params.activeOnly !== undefined) searchParams.set("activeOnly", String(params.activeOnly));
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sort) searchParams.set("sortBy", params.sort);
  if (params.direction) searchParams.set("sortDirection", params.direction.toUpperCase());
  return searchParams.toString();
}

// ==================== CRUD ====================

/**
 * Get paginated list of job titles
 */
export async function getJobTitles(
  params: JobTitleQueryParams = {}
): Promise<PaginatedResponse<JobTitleSummary>> {
  const query = buildQueryString(params);
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;
  return api.get(url).json();
}

/**
 * Get job title by ID
 */
export async function getJobTitle(id: UUID): Promise<JobTitle> {
  return api.get(`${BASE_URL}/${id}`).json();
}

/**
 * Create a new job title
 */
export async function createJobTitle(data: CreateJobTitleRequest): Promise<JobTitle> {
  return api.post(BASE_URL, { json: data }).json();
}

/**
 * Update an existing job title
 */
export async function updateJobTitle(
  id: UUID,
  data: UpdateJobTitleRequest
): Promise<JobTitle> {
  return api.patch(`${BASE_URL}/${id}`, { json: data }).json();
}

/**
 * Delete a job title
 */
export async function deleteJobTitle(id: UUID): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

// ==================== FILTERING ====================

/**
 * Get active job titles
 */
export async function getActiveJobTitles(): Promise<JobTitleSummary[]> {
  return api.get(`${BASE_URL}/active`).json();
}

/**
 * Get job titles by department
 */
export async function getJobTitlesByDepartment(
  departmentId: UUID,
  activeOnly?: boolean
): Promise<JobTitleSummary[]> {
  const params = activeOnly !== undefined ? `?activeOnly=${activeOnly}` : "";
  return api.get(`${BASE_URL}/by-department/${departmentId}${params}`).json();
}

// ==================== STATUS MANAGEMENT ====================

/**
 * Activate a job title
 */
export async function activateJobTitle(id: UUID): Promise<JobTitle> {
  return api.post(`${BASE_URL}/${id}/activate`).json();
}

/**
 * Deactivate a job title
 */
export async function deactivateJobTitle(id: UUID): Promise<JobTitle> {
  return api.post(`${BASE_URL}/${id}/deactivate`).json();
}

// ==================== STATISTICS ====================

/**
 * Get job title count
 */
export async function getJobTitleCount(): Promise<number> {
  return api.get(`${BASE_URL}/count`).json();
}

/**
 * Get job title statistics
 */
export async function getJobTitleStats(): Promise<JobTitleStats> {
  return api.get(`${BASE_URL}/stats`).json();
}
