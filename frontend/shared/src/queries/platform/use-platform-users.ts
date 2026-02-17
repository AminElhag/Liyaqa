import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPlatformUsers,
  getPlatformUser,
  getPlatformUserStats,
  getPlatformUserActivities,
  createPlatformUser,
  updatePlatformUser,
  changePlatformUserStatus,
  resetPlatformUserPassword,
  deletePlatformUser,
} from "../../lib/api/platform/platform-users";
import {
  inviteMember,
  changeRole,
  deactivateTeamUser,
  resetTeamUserPassword,
} from "../../lib/api/platform/team";
import type {
  PlatformUserQueryParams,
  CreatePlatformUserRequest,
  UpdatePlatformUserRequest,
  ChangeUserStatusRequest,
  ResetUserPasswordRequest,
} from "../../types/platform/platform-user";
import type {
  InviteTeamMemberRequest,
  ChangeRoleRequest,
} from "../../types/platform/team";

/**
 * Query keys for platform users.
 */
export const platformUserKeys = {
  all: ["platform-users"] as const,
  lists: () => [...platformUserKeys.all, "list"] as const,
  list: (params: PlatformUserQueryParams) =>
    [...platformUserKeys.lists(), params] as const,
  details: () => [...platformUserKeys.all, "detail"] as const,
  detail: (id: string) => [...platformUserKeys.details(), id] as const,
  activities: (id: string) =>
    [...platformUserKeys.all, "activities", id] as const,
  stats: () => [...platformUserKeys.all, "stats"] as const,
};

/**
 * Hook to fetch paginated list of platform users.
 */
export function usePlatformUsers(params: PlatformUserQueryParams = {}) {
  return useQuery({
    queryKey: platformUserKeys.list(params),
    queryFn: () => getPlatformUsers(params),
  });
}

/**
 * Hook to fetch a single platform user by ID.
 */
export function usePlatformUser(id: string) {
  return useQuery({
    queryKey: platformUserKeys.detail(id),
    queryFn: () => getPlatformUser(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch platform user statistics.
 */
export function usePlatformUserStats() {
  return useQuery({
    queryKey: platformUserKeys.stats(),
    queryFn: () => getPlatformUserStats(),
  });
}

/**
 * Hook to fetch activity log for a platform user.
 */
export function usePlatformUserActivities(
  id: string,
  params: { page?: number; size?: number } = {}
) {
  return useQuery({
    queryKey: platformUserKeys.activities(id),
    queryFn: () => getPlatformUserActivities(id, params),
    enabled: !!id,
  });
}

/**
 * Hook to create a new platform user.
 */
export function useCreatePlatformUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlatformUserRequest) => createPlatformUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformUserKeys.lists() });
      queryClient.invalidateQueries({ queryKey: platformUserKeys.stats() });
    },
  });
}

/**
 * Hook to update a platform user.
 */
export function useUpdatePlatformUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePlatformUserRequest;
    }) => updatePlatformUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: platformUserKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: platformUserKeys.lists() });
    },
  });
}

/**
 * Hook to change platform user status.
 */
export function useChangePlatformUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ChangeUserStatusRequest;
    }) => changePlatformUserStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: platformUserKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: platformUserKeys.lists() });
      queryClient.invalidateQueries({ queryKey: platformUserKeys.stats() });
    },
  });
}

/**
 * Hook to reset platform user password.
 */
export function useResetPlatformUserPassword() {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ResetUserPasswordRequest;
    }) => resetPlatformUserPassword(id, data),
  });
}

/**
 * Hook to delete a platform user.
 */
export function useDeletePlatformUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePlatformUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformUserKeys.lists() });
      queryClient.invalidateQueries({ queryKey: platformUserKeys.stats() });
    },
  });
}

/**
 * Hook to invite a new team member.
 */
export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteTeamMemberRequest) => inviteMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformUserKeys.lists() });
      queryClient.invalidateQueries({ queryKey: platformUserKeys.stats() });
    },
  });
}

/**
 * Hook to change a team member's role.
 */
export function useChangeRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ChangeRoleRequest }) =>
      changeRole(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: platformUserKeys.detail(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: platformUserKeys.lists() });
    },
  });
}

/**
 * Hook to deactivate a team user.
 */
export function useDeactivateTeamUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deactivateTeamUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformUserKeys.lists() });
      queryClient.invalidateQueries({ queryKey: platformUserKeys.stats() });
    },
  });
}

/**
 * Hook to reset a team user's password (admin-initiated).
 */
export function useResetTeamUserPassword() {
  return useMutation({
    mutationFn: (userId: string) => resetTeamUserPassword(userId),
  });
}
