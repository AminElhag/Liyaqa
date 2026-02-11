import { api } from "../client";
import type { PlatformNotificationItem } from "../../../types/platform/notifications";

const BASE_URL = "api/v1/platform/notifications";

export async function getNotifications(): Promise<PlatformNotificationItem[]> {
  return api.get(BASE_URL).json<PlatformNotificationItem[]>();
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`${BASE_URL}/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post(`${BASE_URL}/mark-all-read`);
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

export type { PlatformNotificationItem };
