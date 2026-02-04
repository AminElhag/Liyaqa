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
 * Get complete trainer dashboard data (aggregated)
 */
export async function getTrainerDashboard(
  trainerId: UUID
): Promise<TrainerDashboardResponse> {
  const params = new URLSearchParams({ trainerId });
  return api.get(`${TRAINER_PORTAL_ENDPOINT}/dashboard?${params}`).json();
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
 * Get client statistics
 */
export async function getClientStats(
  trainerId: UUID
): Promise<ClientStatsResponse> {
  const params = new URLSearchParams({ trainerId });
  return api.get(`${TRAINER_PORTAL_ENDPOINT}/clients/stats?${params}`).json();
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
 * Get earnings summary with statistics
 */
export async function getEarningsSummary(
  trainerId: UUID
): Promise<EarningsSummaryResponse> {
  const params = new URLSearchParams({ trainerId });
  return api.get(`${TRAINER_PORTAL_ENDPOINT}/earnings/summary?${params}`).json();
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
 * Get unread notifications count (for badge)
 */
export async function getUnreadNotificationsCount(
  trainerId: UUID
): Promise<UnreadCountResponse> {
  const params = new URLSearchParams({ trainerId });
  return api
    .get(`${TRAINER_PORTAL_ENDPOINT}/notifications/unread-count?${params}`)
    .json();
}

/**
 * Mark multiple notifications as read
 */
export async function markNotificationsRead(
  trainerId: UUID,
  data: MarkNotificationsReadRequest
): Promise<void> {
  const params = new URLSearchParams({ trainerId });
  await api.put(
    `${TRAINER_PORTAL_ENDPOINT}/notifications/mark-read?${params}`,
    { json: data }
  );
}

/**
 * Mark single notification as read
 */
export async function markNotificationRead(
  notificationId: UUID,
  trainerId: UUID
): Promise<void> {
  const params = new URLSearchParams({ trainerId });
  await api.put(
    `${TRAINER_PORTAL_ENDPOINT}/notifications/${notificationId}/read?${params}`
  );
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(trainerId: UUID): Promise<void> {
  const params = new URLSearchParams({ trainerId });
  await api.put(
    `${TRAINER_PORTAL_ENDPOINT}/notifications/mark-all-read?${params}`
  );
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: UUID,
  trainerId: UUID
): Promise<void> {
  const params = new URLSearchParams({ trainerId });
  await api.delete(
    `${TRAINER_PORTAL_ENDPOINT}/notifications/${notificationId}?${params}`
  );
}

// ==================== SCHEDULE MANAGEMENT ====================

/**
 * Get complete trainer schedule (availability + sessions)
 */
export async function getTrainerSchedule(
  trainerId: UUID
): Promise<TrainerScheduleResponse> {
  const params = new URLSearchParams({ trainerId });
  return api.get(`${TRAINER_PORTAL_ENDPOINT}/schedule?${params}`).json();
}

/**
 * Update trainer weekly availability
 */
export async function updateTrainerAvailability(
  trainerId: UUID,
  data: UpdateAvailabilityRequest
): Promise<void> {
  const params = new URLSearchParams({ trainerId });
  await api.put(
    `${TRAINER_PORTAL_ENDPOINT}/schedule/availability?${params}`,
    { json: data }
  );
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
 * Get today's schedule
 */
export async function getTodaySchedule(
  trainerId: UUID
): Promise<UpcomingSessionResponse[]> {
  const params = new URLSearchParams({ trainerId });
  return api.get(`${TRAINER_PORTAL_ENDPOINT}/schedule/today?${params}`).json();
}

// ==================== CERTIFICATION MANAGEMENT ====================

/**
 * Get paginated list of trainer certifications
 */
export async function getTrainerCertifications(
  trainerId: UUID,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<TrainerCertificationResponse>> {
  const searchParams = new URLSearchParams({ trainerId });
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  return api
    .get(`${TRAINER_PORTAL_ENDPOINT}/certifications?${searchParams}`)
    .json();
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
 * Create a new certification
 */
export async function createTrainerCertification(
  trainerId: UUID,
  data: CreateCertificationRequest
): Promise<TrainerCertificationResponse> {
  const params = new URLSearchParams({ trainerId });
  return api
    .post(`${TRAINER_PORTAL_ENDPOINT}/certifications?${params}`, { json: data })
    .json();
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
