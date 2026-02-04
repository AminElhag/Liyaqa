"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sendNotification,
  getNotification,
  getMemberNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../lib/api/notifications-admin";
import type { UUID } from "../types/api";
import type {
  SendNotificationRequest,
  NotificationQueryParams,
} from "../types/notification-admin";

export const notificationAdminKeys = {
  all: ["notifications-admin"] as const,
  lists: () => [...notificationAdminKeys.all, "list"] as const,
  list: (memberId: UUID, params: NotificationQueryParams) =>
    [...notificationAdminKeys.lists(), memberId, params] as const,
  detail: (id: UUID) => [...notificationAdminKeys.all, "detail", id] as const,
  unreadCount: (memberId: UUID) =>
    [...notificationAdminKeys.all, "unread", memberId] as const,
};

/**
 * Hook to fetch notifications for a specific member
 */
export function useMemberNotifications(
  memberId: UUID,
  params: NotificationQueryParams = {}
) {
  return useQuery({
    queryKey: notificationAdminKeys.list(memberId, params),
    queryFn: () => getMemberNotifications(memberId, params),
    enabled: !!memberId,
  });
}

/**
 * Hook to fetch a single notification by ID
 */
export function useNotification(id: UUID) {
  return useQuery({
    queryKey: notificationAdminKeys.detail(id),
    queryFn: () => getNotification(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch unread notification count for a member
 */
export function useUnreadCount(memberId: UUID) {
  return useQuery({
    queryKey: notificationAdminKeys.unreadCount(memberId),
    queryFn: () => getUnreadCount(memberId),
    enabled: !!memberId,
  });
}

/**
 * Hook to send a notification
 */
export function useSendNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendNotificationRequest) => sendNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationAdminKeys.lists() });
    },
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationAdminKeys.all });
    },
  });
}

/**
 * Hook to mark all notifications as read for a member
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: UUID) => markAllAsRead(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationAdminKeys.all });
    },
  });
}
