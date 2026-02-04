import { api } from "./client";
import type {
  Permission,
  PermissionsByModuleResponse,
  UserPermissionsResponse,
  GrantPermissionsRequest,
  RevokePermissionsRequest,
  SetPermissionsRequest,
} from "../../types/permission";

const BASE_URL = "api/permissions";

/**
 * Get all permissions.
 */
export async function getPermissions(): Promise<Permission[]> {
  return api.get(BASE_URL).json<Permission[]>();
}

/**
 * Get permissions grouped by module.
 */
export async function getPermissionsByModule(): Promise<PermissionsByModuleResponse> {
  return api.get(`${BASE_URL}/by-module`).json<PermissionsByModuleResponse>();
}

/**
 * Get permissions for a specific user.
 */
export async function getUserPermissions(
  userId: string
): Promise<UserPermissionsResponse> {
  return api
    .get(`${BASE_URL}/users/${userId}`)
    .json<UserPermissionsResponse>();
}

/**
 * Grant permissions to a user.
 */
export async function grantPermissions(
  userId: string,
  request: GrantPermissionsRequest
): Promise<UserPermissionsResponse> {
  return api
    .post(`${BASE_URL}/users/${userId}`, { json: request })
    .json<UserPermissionsResponse>();
}

/**
 * Revoke permissions from a user.
 */
export async function revokePermissions(
  userId: string,
  request: RevokePermissionsRequest
): Promise<UserPermissionsResponse> {
  return api
    .delete(`${BASE_URL}/users/${userId}`, { json: request })
    .json<UserPermissionsResponse>();
}

/**
 * Set all permissions for a user (replaces existing).
 */
export async function setUserPermissions(
  userId: string,
  request: SetPermissionsRequest
): Promise<UserPermissionsResponse> {
  return api
    .put(`${BASE_URL}/users/${userId}`, { json: request })
    .json<UserPermissionsResponse>();
}
