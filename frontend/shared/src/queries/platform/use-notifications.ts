"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type PlatformNotificationItem,
} from "../../lib/api/platform/notifications";

export const notificationKeys = {
  all: ["platform", "notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};

export function useNotifications(options?: Omit<UseQueryOptions<PlatformNotificationItem[]>, "queryKey" | "queryFn">) {
  return useQuery({ queryKey: notificationKeys.list(), queryFn: getNotifications, staleTime: 60 * 1000, ...options });
}

export function useMarkNotificationRead(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: notificationKeys.list() }); },
    ...options,
  });
}

export function useMarkAllNotificationsRead(options?: UseMutationOptions<void, Error, void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: notificationKeys.list() }); },
    ...options,
  });
}

export function useDeleteNotification(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: notificationKeys.list() }); },
    ...options,
  });
}

export type { PlatformNotificationItem };
