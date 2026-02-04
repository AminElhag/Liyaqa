import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  Notification,
  SendNotificationRequest,
  NotificationQueryParams,
} from "../../types/notification-admin";

const BASE_URL = "api/notifications";

/**
 * Send a notification to a member
 */
export async function sendNotification(
  data: SendNotificationRequest
): Promise<Notification> {
  return api.post(BASE_URL, { json: data }).json();
}

/**
 * Get a notification by ID
 */
export async function getNotification(id: UUID): Promise<Notification> {
  return api.get(`${BASE_URL}/${id}`).json();
}

/**
 * Get notifications for a specific member
 */
export async function getMemberNotifications(
  memberId: UUID,
  params: NotificationQueryParams = {}
): Promise<PaginatedResponse<Notification>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  const url = query
    ? `${BASE_URL}/member/${memberId}?${query}`
    : `${BASE_URL}/member/${memberId}`;
  return api.get(url).json();
}

/**
 * Get unread notification count for a member
 */
export async function getUnreadCount(memberId: UUID): Promise<number> {
  const res = await api
    .get(`${BASE_URL}/member/${memberId}/unread-count`)
    .json<{ unreadCount: number }>();
  return res.unreadCount;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(id: UUID): Promise<Notification> {
  return api.post(`${BASE_URL}/${id}/read`).json();
}

/**
 * Mark all notifications as read for a member
 */
export async function markAllAsRead(memberId: UUID): Promise<number> {
  const res = await api
    .post(`${BASE_URL}/member/${memberId}/read-all`)
    .json<{ markedAsRead: number }>();
  return res.markedAsRead;
}
