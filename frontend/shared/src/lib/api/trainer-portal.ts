import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  TrainerClientResponse,
  TrainerEarningsResponse,
  TrainerNotificationResponse,
  TrainerCertificationResponse,
  TrainerDashboardResponse,
  TrainerScheduleResponse,
  EarningsSummaryResponse,
  ClientStatsResponse,
  UnreadCountResponse,
  UpdateTrainerClientRequest,
  UpdateEarningStatusRequest,
  MarkNotificationsReadRequest,
  UpdateAvailabilityRequest,
  CreateCertificationRequest,
  UpdateCertificationRequest,
  TrainerClientsQueryParams,
  TrainerEarningsQueryParams,
  TrainerNotificationsQueryParams,
  UpcomingSessionsQueryParams,
  UpcomingSessionResponse,
} from "../../types/trainer-portal";

const TRAINER_PORTAL_ENDPOINT = "api/trainer-portal";

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, unknown> | { [key: string]: unknown }): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

// ==================== DASHBOARD ====================

/**
 * Get complete trainer dashboard data (aggregated).
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function getTrainerDashboard(
  trainerId?: UUID
): Promise<TrainerDashboardResponse> {
  if (trainerId) {
    const params = new URLSearchParams({ trainerId });
    return api.get(`${TRAINER_PORTAL_ENDPOINT}/dashboard?${params}`).json();
  }
  return api.get(`${TRAINER_PORTAL_ENDPOINT}/dashboard`).json();
}

// ==================== CLIENT MANAGEMENT ====================

/**
 * Get paginated list of trainer's clients
 */
export async function getTrainerClients(
  params: TrainerClientsQueryParams = {}
): Promise<PaginatedResponse<TrainerClientResponse>> {
  const query = buildQueryString(params as Record<string, unknown>);
  const url = query
    ? `${TRAINER_PORTAL_ENDPOINT}/clients?${query}`
    : `${TRAINER_PORTAL_ENDPOINT}/clients`;
  return api.get(url).json();
}

/**
 * Get specific client details
 */
export async function getTrainerClient(
  clientId: UUID
): Promise<TrainerClientResponse> {
  return api.get(`${TRAINER_PORTAL_ENDPOINT}/clients/${clientId}`).json();
}

/**
 * Update trainer client information (goals, notes, status)
 */
export async function updateTrainerClient(
  clientId: UUID,
  data: UpdateTrainerClientRequest
): Promise<TrainerClientResponse> {
  return api
    .put(`${TRAINER_PORTAL_ENDPOINT}/clients/${clientId}`, { json: data })
    .json();
}

/**
 * Get client statistics.
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function getClientStats(
  trainerId?: UUID
): Promise<ClientStatsResponse> {
  const url = trainerId
    ? `${TRAINER_PORTAL_ENDPOINT}/clients/stats?${new URLSearchParams({ trainerId })}`
    : `${TRAINER_PORTAL_ENDPOINT}/clients/stats`;
  return api.get(url).json();
}

// ==================== EARNINGS MANAGEMENT ====================

/**
 * Get paginated list of trainer earnings
 */
export async function getTrainerEarnings(
  params: TrainerEarningsQueryParams = {}
): Promise<PaginatedResponse<TrainerEarningsResponse>> {
  const query = buildQueryString(params as Record<string, unknown>);
  const url = query
    ? `${TRAINER_PORTAL_ENDPOINT}/earnings?${query}`
    : `${TRAINER_PORTAL_ENDPOINT}/earnings`;
  return api.get(url).json();
}

/**
 * Get specific earning details
 */
export async function getTrainerEarning(
  earningId: UUID
): Promise<TrainerEarningsResponse> {
  return api.get(`${TRAINER_PORTAL_ENDPOINT}/earnings/${earningId}`).json();
}

/**
 * Get earnings summary with statistics.
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function getEarningsSummary(
  trainerId?: UUID
): Promise<EarningsSummaryResponse> {
  const url = trainerId
    ? `${TRAINER_PORTAL_ENDPOINT}/earnings/summary?${new URLSearchParams({ trainerId })}`
    : `${TRAINER_PORTAL_ENDPOINT}/earnings/summary`;
  return api.get(url).json();
}

/**
 * Update earning status (admin only)
 */
export async function updateEarningStatus(
  earningId: UUID,
  data: UpdateEarningStatusRequest
): Promise<TrainerEarningsResponse> {
  return api
    .put(`${TRAINER_PORTAL_ENDPOINT}/earnings/${earningId}/status`, {
      json: data,
    })
    .json();
}

// ==================== NOTIFICATIONS ====================

/**
 * Get paginated list of trainer notifications
 */
export async function getTrainerNotifications(
  params: TrainerNotificationsQueryParams = {}
): Promise<PaginatedResponse<TrainerNotificationResponse>> {
  const query = buildQueryString(params as Record<string, unknown>);
  const url = query
    ? `${TRAINER_PORTAL_ENDPOINT}/notifications?${query}`
    : `${TRAINER_PORTAL_ENDPOINT}/notifications`;
  return api.get(url).json();
}

/**
 * Get unread notifications count (for badge).
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function getUnreadNotificationsCount(
  trainerId?: UUID
): Promise<UnreadCountResponse> {
  const url = trainerId
    ? `${TRAINER_PORTAL_ENDPOINT}/notifications/unread-count?${new URLSearchParams({ trainerId })}`
    : `${TRAINER_PORTAL_ENDPOINT}/notifications/unread-count`;
  return api.get(url).json();
}

/**
 * Mark multiple notifications as read.
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function markNotificationsRead(
  data: MarkNotificationsReadRequest,
  trainerId?: UUID
): Promise<void> {
  const url = trainerId
    ? `${TRAINER_PORTAL_ENDPOINT}/notifications/mark-read?${new URLSearchParams({ trainerId })}`
    : `${TRAINER_PORTAL_ENDPOINT}/notifications/mark-read`;
  await api.put(url, { json: data });
}

/**
 * Mark single notification as read.
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function markNotificationRead(
  notificationId: UUID,
  trainerId?: UUID
): Promise<void> {
  const url = trainerId
    ? `${TRAINER_PORTAL_ENDPOINT}/notifications/${notificationId}/read?${new URLSearchParams({ trainerId })}`
    : `${TRAINER_PORTAL_ENDPOINT}/notifications/${notificationId}/read`;
  await api.put(url);
}

/**
 * Mark all notifications as read.
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function markAllNotificationsRead(trainerId?: UUID): Promise<void> {
  const url = trainerId
    ? `${TRAINER_PORTAL_ENDPOINT}/notifications/mark-all-read?${new URLSearchParams({ trainerId })}`
    : `${TRAINER_PORTAL_ENDPOINT}/notifications/mark-all-read`;
  await api.put(url);
}

/**
 * Delete a notification.
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function deleteNotification(
  notificationId: UUID,
  trainerId?: UUID
): Promise<void> {
  const url = trainerId
    ? `${TRAINER_PORTAL_ENDPOINT}/notifications/${notificationId}?${new URLSearchParams({ trainerId })}`
    : `${TRAINER_PORTAL_ENDPOINT}/notifications/${notificationId}`;
  await api.delete(url);
}

// ==================== SCHEDULE MANAGEMENT ====================

/**
 * Get complete trainer schedule (availability + sessions).
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function getTrainerSchedule(
  trainerId?: UUID
): Promise<TrainerScheduleResponse> {
  const url = trainerId
    ? `${TRAINER_PORTAL_ENDPOINT}/schedule?${new URLSearchParams({ trainerId })}`
    : `${TRAINER_PORTAL_ENDPOINT}/schedule`;
  return api.get(url).json();
}

/**
 * Update trainer weekly availability.
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function updateTrainerAvailability(
  data: UpdateAvailabilityRequest,
  trainerId?: UUID
): Promise<void> {
  const url = trainerId
    ? `${TRAINER_PORTAL_ENDPOINT}/schedule/availability?${new URLSearchParams({ trainerId })}`
    : `${TRAINER_PORTAL_ENDPOINT}/schedule/availability`;
  await api.put(url, { json: data });
}

/**
 * Get upcoming sessions
 */
export async function getUpcomingSessions(
  params: UpcomingSessionsQueryParams = {}
): Promise<UpcomingSessionResponse[]> {
  const query = buildQueryString(params as Record<string, unknown>);
  const url = query
    ? `${TRAINER_PORTAL_ENDPOINT}/schedule/upcoming-sessions?${query}`
    : `${TRAINER_PORTAL_ENDPOINT}/schedule/upcoming-sessions`;
  return api.get(url).json();
}

/**
 * Get today's schedule.
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function getTodaySchedule(
  trainerId?: UUID
): Promise<UpcomingSessionResponse[]> {
  const url = trainerId
    ? `${TRAINER_PORTAL_ENDPOINT}/schedule/today?${new URLSearchParams({ trainerId })}`
    : `${TRAINER_PORTAL_ENDPOINT}/schedule/today`;
  return api.get(url).json();
}

// ==================== CERTIFICATION MANAGEMENT ====================

/**
 * Get paginated list of trainer certifications.
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function getTrainerCertifications(
  params: { page?: number; size?: number } = {},
  trainerId?: UUID
): Promise<PaginatedResponse<TrainerCertificationResponse>> {
  const searchParams = new URLSearchParams();
  if (trainerId) searchParams.set("trainerId", trainerId);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  const query = searchParams.toString();
  const url = query
    ? `${TRAINER_PORTAL_ENDPOINT}/certifications?${query}`
    : `${TRAINER_PORTAL_ENDPOINT}/certifications`;
  return api.get(url).json();
}

/**
 * Get specific certification details
 */
export async function getTrainerCertification(
  certificationId: UUID
): Promise<TrainerCertificationResponse> {
  return api
    .get(`${TRAINER_PORTAL_ENDPOINT}/certifications/${certificationId}`)
    .json();
}

/**
 * Create a new certification.
 * When trainerId is omitted, the backend resolves the trainer from the JWT.
 */
export async function createTrainerCertification(
  data: CreateCertificationRequest,
  trainerId?: UUID
): Promise<TrainerCertificationResponse> {
  const url = trainerId
    ? `${TRAINER_PORTAL_ENDPOINT}/certifications?${new URLSearchParams({ trainerId })}`
    : `${TRAINER_PORTAL_ENDPOINT}/certifications`;
  return api.post(url, { json: data }).json();
}

/**
 * Update an existing certification
 */
export async function updateTrainerCertification(
  certificationId: UUID,
  data: UpdateCertificationRequest
): Promise<TrainerCertificationResponse> {
  return api
    .put(`${TRAINER_PORTAL_ENDPOINT}/certifications/${certificationId}`, {
      json: data,
    })
    .json();
}

/**
 * Delete a certification
 */
export async function deleteCertification(certificationId: UUID): Promise<void> {
  await api.delete(
    `${TRAINER_PORTAL_ENDPOINT}/certifications/${certificationId}`
  );
}
