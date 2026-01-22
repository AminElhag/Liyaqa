import { api } from "./client";
import type { PaginatedResponse, UUID, LocalizedText } from "@/types/api";
import type { User, UserRole } from "@/types/auth";
import type { LocalizedTextInput } from "@/types/member";

const USERS_ENDPOINT = "api/users";

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  displayNameEn: string;
  displayNameAr?: string;
  role: UserRole;
  tenantId?: UUID;
  organizationId?: UUID;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  displayNameEn?: string;
  displayNameAr?: string;
  role?: UserRole;
}

/**
 * User query params
 */
export interface UserQueryParams {
  search?: string;
  role?: UserRole;
  active?: boolean;
  page?: number;
  size?: number;
}

/**
 * Build query string from params
 */
function buildQueryString(params: UserQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.role) searchParams.set("role", params.role);
  if (params.active !== undefined) searchParams.set("active", String(params.active));
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  return searchParams.toString();
}

/**
 * Get paginated list of users
 */
export async function getUsers(
  params: UserQueryParams = {}
): Promise<PaginatedResponse<User>> {
  const query = buildQueryString(params);
  const url = query ? `${USERS_ENDPOINT}?${query}` : USERS_ENDPOINT;
  return api.get(url).json();
}

/**
 * Get user by ID
 */
export async function getUser(id: UUID): Promise<User> {
  return api.get(`${USERS_ENDPOINT}/${id}`).json();
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
  return api.post(USERS_ENDPOINT, { json: data }).json();
}

/**
 * Update a user
 */
export async function updateUser(
  id: UUID,
  data: UpdateUserRequest
): Promise<User> {
  return api.put(`${USERS_ENDPOINT}/${id}`, { json: data }).json();
}

/**
 * Delete a user
 */
export async function deleteUser(id: UUID): Promise<void> {
  await api.delete(`${USERS_ENDPOINT}/${id}`);
}

/**
 * Activate a user
 */
export async function activateUser(id: UUID): Promise<User> {
  return api.post(`${USERS_ENDPOINT}/${id}/activate`).json();
}

/**
 * Deactivate a user
 */
export async function deactivateUser(id: UUID): Promise<User> {
  return api.post(`${USERS_ENDPOINT}/${id}/deactivate`).json();
}

/**
 * Reset user's password (admin action)
 */
export async function resetUserPassword(
  id: UUID,
  newPassword: string
): Promise<void> {
  await api.post(`${USERS_ENDPOINT}/${id}/reset-password`, {
    json: { newPassword },
  });
}

/**
 * Change user's role
 */
export async function changeUserRole(id: UUID, role: UserRole): Promise<User> {
  return api.post(`${USERS_ENDPOINT}/${id}/change-role`, { json: { role } }).json();
}
