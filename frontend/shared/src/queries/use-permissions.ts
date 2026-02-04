import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPermissions,
  getPermissionsByModule,
  getUserPermissions,
  grantPermissions,
  revokePermissions,
  setUserPermissions,
} from "../lib/api/permissions";
import type {
  GrantPermissionsRequest,
  RevokePermissionsRequest,
  SetPermissionsRequest,
} from "../types/permission";

/**
 * Query keys for permissions.
 */
export const permissionKeys = {
  all: ["permissions"] as const,
  list: () => [...permissionKeys.all, "list"] as const,
  byModule: () => [...permissionKeys.all, "by-module"] as const,
  user: (userId: string) => [...permissionKeys.all, "user", userId] as const,
};

/**
 * Hook to fetch all permissions.
 */
export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.list(),
    queryFn: getPermissions,
  });
}

/**
 * Hook to fetch permissions grouped by module.
 */
export function usePermissionsByModule() {
  return useQuery({
    queryKey: permissionKeys.byModule(),
    queryFn: getPermissionsByModule,
  });
}

/**
 * Hook to fetch a user's permissions.
 */
export function useUserPermissions(userId: string) {
  return useQuery({
    queryKey: permissionKeys.user(userId),
    queryFn: () => getUserPermissions(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to grant permissions to a user.
 */
export function useGrantPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      request,
    }: {
      userId: string;
      request: GrantPermissionsRequest;
    }) => grantPermissions(userId, request),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.user(userId) });
    },
  });
}

/**
 * Hook to revoke permissions from a user.
 */
export function useRevokePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      request,
    }: {
      userId: string;
      request: RevokePermissionsRequest;
    }) => revokePermissions(userId, request),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.user(userId) });
    },
  });
}

/**
 * Hook to set all permissions for a user.
 */
export function useSetUserPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      request,
    }: {
      userId: string;
      request: SetPermissionsRequest;
    }) => setUserPermissions(userId, request),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.user(userId) });
    },
  });
}
