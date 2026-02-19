"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getTrainerDashboard,
  getTrainerClients,
  getTrainerClient,
  updateTrainerClient,
  getClientStats,
  getTrainerEarnings,
  getTrainerEarning,
  getEarningsSummary,
  updateEarningStatus,
  getTrainerNotifications,
  getUnreadNotificationsCount,
  markNotificationsRead,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getTrainerSchedule,
  updateTrainerAvailability,
  getUpcomingSessions,
  getTodaySchedule,
  getTrainerCertifications,
  getTrainerCertification,
  createTrainerCertification,
  updateTrainerCertification,
  deleteCertification,
} from "../lib/api/trainer-portal";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  TrainerDashboardResponse,
  TrainerClientResponse,
  TrainerEarningsResponse,
  TrainerNotificationResponse,
  TrainerCertificationResponse,
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
} from "../types/trainer-portal";

// ==================== QUERY KEYS ====================

export const trainerPortalKeys = {
  all: ["trainerPortal"] as const,

  // Dashboard
  dashboards: () => [...trainerPortalKeys.all, "dashboard"] as const,
  dashboard: (trainerId?: UUID) =>
    trainerId
      ? ([...trainerPortalKeys.dashboards(), trainerId] as const)
      : ([...trainerPortalKeys.dashboards(), "self"] as const),

  // Clients
  clients: () => [...trainerPortalKeys.all, "clients"] as const,
  clientsList: (params: TrainerClientsQueryParams) =>
    [...trainerPortalKeys.clients(), "list", params] as const,
  clientDetail: (clientId: UUID) =>
    [...trainerPortalKeys.clients(), "detail", clientId] as const,
  clientStats: (trainerId?: UUID) =>
    [...trainerPortalKeys.clients(), "stats", trainerId ?? "self"] as const,

  // Earnings
  earnings: () => [...trainerPortalKeys.all, "earnings"] as const,
  earningsList: (params: TrainerEarningsQueryParams) =>
    [...trainerPortalKeys.earnings(), "list", params] as const,
  earningDetail: (earningId: UUID) =>
    [...trainerPortalKeys.earnings(), "detail", earningId] as const,
  earningsSummary: (trainerId?: UUID) =>
    [...trainerPortalKeys.earnings(), "summary", trainerId ?? "self"] as const,

  // Notifications
  notifications: () => [...trainerPortalKeys.all, "notifications"] as const,
  notificationsList: (params: TrainerNotificationsQueryParams) =>
    [...trainerPortalKeys.notifications(), "list", params] as const,
  unreadCount: (trainerId?: UUID) =>
    [...trainerPortalKeys.notifications(), "unreadCount", trainerId ?? "self"] as const,

  // Schedule
  schedule: () => [...trainerPortalKeys.all, "schedule"] as const,
  scheduleDetail: (trainerId?: UUID) =>
    [...trainerPortalKeys.schedule(), trainerId ?? "self"] as const,
  upcomingSessions: (params: UpcomingSessionsQueryParams) =>
    [...trainerPortalKeys.schedule(), "upcoming", params] as const,
  todaySchedule: (trainerId?: UUID) =>
    [...trainerPortalKeys.schedule(), "today", trainerId ?? "self"] as const,

  // Certifications
  certifications: () => [...trainerPortalKeys.all, "certifications"] as const,
  certificationsList: (
    params: { page?: number; size?: number },
    trainerId?: UUID
  ) => [...trainerPortalKeys.certifications(), "list", trainerId ?? "self", params] as const,
  certificationDetail: (certificationId: UUID) =>
    [...trainerPortalKeys.certifications(), "detail", certificationId] as const,
};

// ==================== DASHBOARD QUERIES ====================

/**
 * Hook to fetch complete trainer dashboard (aggregated data).
 * When trainerId is omitted/undefined, fetches for the current authenticated trainer (self-service).
 */
export function useTrainerDashboard(
  trainerId?: UUID,
  options?: Omit<
    UseQueryOptions<TrainerDashboardResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerPortalKeys.dashboard(trainerId),
    queryFn: () => getTrainerDashboard(trainerId),
    staleTime: 60000, // 1 minute
    ...options,
  });
}

// ==================== CLIENT QUERIES ====================

/**
 * Hook to fetch paginated trainer clients.
 * trainerId in params is optional — backend resolves from JWT when omitted.
 */
export function useTrainerClients(
  params: TrainerClientsQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<TrainerClientResponse>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerPortalKeys.clientsList(params),
    queryFn: () => getTrainerClients(params),
    ...options,
  });
}

/**
 * Hook to fetch single client details
 */
export function useTrainerClient(
  clientId: UUID | undefined,
  options?: Omit<UseQueryOptions<TrainerClientResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: trainerPortalKeys.clientDetail(clientId!),
    queryFn: () => getTrainerClient(clientId!),
    enabled: !!clientId,
    ...options,
  });
}

/**
 * Hook to fetch client statistics.
 * When trainerId is omitted, backend resolves from JWT.
 */
export function useClientStats(
  trainerId?: UUID,
  options?: Omit<UseQueryOptions<ClientStatsResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: trainerPortalKeys.clientStats(trainerId),
    queryFn: () => getClientStats(trainerId),
    ...options,
  });
}

// ==================== EARNINGS QUERIES ====================

/**
 * Hook to fetch paginated trainer earnings.
 * trainerId in params is optional — backend resolves from JWT when omitted.
 */
export function useTrainerEarnings(
  params: TrainerEarningsQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<TrainerEarningsResponse>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerPortalKeys.earningsList(params),
    queryFn: () => getTrainerEarnings(params),
    ...options,
  });
}

/**
 * Hook to fetch single earning details
 */
export function useTrainerEarning(
  earningId: UUID | undefined,
  options?: Omit<
    UseQueryOptions<TrainerEarningsResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerPortalKeys.earningDetail(earningId!),
    queryFn: () => getTrainerEarning(earningId!),
    enabled: !!earningId,
    ...options,
  });
}

/**
 * Hook to fetch earnings summary.
 * When trainerId is omitted, backend resolves from JWT.
 */
export function useEarningsSummary(
  trainerId?: UUID,
  options?: Omit<
    UseQueryOptions<EarningsSummaryResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerPortalKeys.earningsSummary(trainerId),
    queryFn: () => getEarningsSummary(trainerId),
    staleTime: 60000, // 1 minute
    ...options,
  });
}

// ==================== NOTIFICATION QUERIES ====================

/**
 * Hook to fetch paginated trainer notifications.
 * trainerId in params is optional — backend resolves from JWT when omitted.
 */
export function useTrainerNotifications(
  params: TrainerNotificationsQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<TrainerNotificationResponse>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerPortalKeys.notificationsList(params),
    queryFn: () => getTrainerNotifications(params),
    ...options,
  });
}

/**
 * Hook to fetch unread notifications count.
 * When trainerId is omitted, backend resolves from JWT.
 */
export function useUnreadNotificationsCount(
  trainerId?: UUID,
  options?: Omit<UseQueryOptions<UnreadCountResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: trainerPortalKeys.unreadCount(trainerId),
    queryFn: () => getUnreadNotificationsCount(trainerId),
    refetchInterval: 30000, // Refetch every 30 seconds
    ...options,
  });
}

// ==================== SCHEDULE QUERIES ====================

/**
 * Hook to fetch trainer schedule.
 * When trainerId is omitted, backend resolves from JWT.
 */
export function useTrainerSchedule(
  trainerId?: UUID,
  options?: Omit<
    UseQueryOptions<TrainerScheduleResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerPortalKeys.scheduleDetail(trainerId),
    queryFn: () => getTrainerSchedule(trainerId),
    ...options,
  });
}

/**
 * Hook to fetch upcoming sessions.
 * trainerId in params is optional — backend resolves from JWT when omitted.
 */
export function useUpcomingSessions(
  params: UpcomingSessionsQueryParams = {},
  options?: Omit<
    UseQueryOptions<UpcomingSessionResponse[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerPortalKeys.upcomingSessions(params),
    queryFn: () => getUpcomingSessions(params),
    ...options,
  });
}

/**
 * Hook to fetch today's schedule.
 * When trainerId is omitted, backend resolves from JWT.
 */
export function useTodaySchedule(
  trainerId?: UUID,
  options?: Omit<
    UseQueryOptions<UpcomingSessionResponse[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerPortalKeys.todaySchedule(trainerId),
    queryFn: () => getTodaySchedule(trainerId),
    refetchInterval: 300000, // Refetch every 5 minutes
    ...options,
  });
}

// ==================== CERTIFICATION QUERIES ====================

/**
 * Hook to fetch paginated trainer certifications.
 * When trainerId is omitted, backend resolves from JWT.
 */
export function useTrainerCertifications(
  params: { page?: number; size?: number } = {},
  trainerId?: UUID,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<TrainerCertificationResponse>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerPortalKeys.certificationsList(params, trainerId),
    queryFn: () => getTrainerCertifications(params, trainerId),
    ...options,
  });
}

/**
 * Hook to fetch single certification details
 */
export function useTrainerCertification(
  certificationId: UUID | undefined,
  options?: Omit<
    UseQueryOptions<TrainerCertificationResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: trainerPortalKeys.certificationDetail(certificationId!),
    queryFn: () => getTrainerCertification(certificationId!),
    enabled: !!certificationId,
    ...options,
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Hook to update trainer client
 */
export function useUpdateTrainerClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: UUID;
      data: UpdateTrainerClientRequest;
    }) => updateTrainerClient(clientId, data),
    onSuccess: (updatedClient) => {
      // Update detail cache
      queryClient.setQueryData(
        trainerPortalKeys.clientDetail(updatedClient.id),
        updatedClient
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.clients(),
      });
      // Invalidate dashboard
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.dashboards(),
      });
    },
  });
}

/**
 * Hook to update earning status (admin only)
 */
export function useUpdateEarningStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      earningId,
      data,
    }: {
      earningId: UUID;
      data: UpdateEarningStatusRequest;
    }) => updateEarningStatus(earningId, data),
    onSuccess: (updatedEarning) => {
      // Update detail cache
      queryClient.setQueryData(
        trainerPortalKeys.earningDetail(updatedEarning.id),
        updatedEarning
      );
      // Invalidate lists and summaries
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.earnings(),
      });
      // Invalidate dashboard
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.dashboards(),
      });
    },
  });
}

/**
 * Hook to mark notifications as read.
 * trainerId is no longer required — backend resolves from JWT.
 */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
    }: {
      data: MarkNotificationsReadRequest;
    }) => markNotificationsRead(data),
    onSuccess: () => {
      // Invalidate all notification queries (lists + unread count)
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.notifications(),
      });
      // Invalidate dashboard
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.dashboards(),
      });
    },
  });
}

/**
 * Hook to mark single notification as read.
 * trainerId is no longer required — backend resolves from JWT.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
    }: {
      notificationId: UUID;
    }) => markNotificationRead(notificationId),
    onSuccess: () => {
      // Invalidate all notification queries (lists + unread count)
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.notifications(),
      });
      // Invalidate dashboard
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.dashboards(),
      });
    },
  });
}

/**
 * Hook to mark all notifications as read.
 * trainerId is no longer required — backend resolves from JWT.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      // Invalidate all notification queries (lists + unread count)
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.notifications(),
      });
      // Invalidate dashboard
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.dashboards(),
      });
    },
  });
}

/**
 * Hook to delete a notification.
 * trainerId is no longer required — backend resolves from JWT.
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
    }: {
      notificationId: UUID;
    }) => deleteNotification(notificationId),
    onSuccess: () => {
      // Invalidate all notification queries (lists + unread count)
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.notifications(),
      });
      // Invalidate dashboard
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.dashboards(),
      });
    },
  });
}

/**
 * Hook to update trainer availability.
 * trainerId is no longer required — backend resolves from JWT.
 */
export function useUpdateTrainerAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
    }: {
      data: UpdateAvailabilityRequest;
    }) => updateTrainerAvailability(data),
    onSuccess: () => {
      // Invalidate schedule
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.schedule(),
      });
      // Invalidate dashboard
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.dashboards(),
      });
    },
  });
}

/**
 * Hook to create a certification.
 * trainerId is no longer required — backend resolves from JWT.
 */
export function useCreateCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
    }: {
      data: CreateCertificationRequest;
    }) => createTrainerCertification(data),
    onSuccess: () => {
      // Invalidate certification lists
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.certifications(),
      });
    },
  });
}

/**
 * Hook to update a certification
 */
export function useUpdateCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificationId,
      data,
    }: {
      certificationId: UUID;
      data: UpdateCertificationRequest;
    }) => updateTrainerCertification(certificationId, data),
    onSuccess: (updatedCertification) => {
      // Update detail cache
      queryClient.setQueryData(
        trainerPortalKeys.certificationDetail(updatedCertification.id),
        updatedCertification
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.certifications(),
      });
    },
  });
}

/**
 * Hook to delete a certification
 */
export function useDeleteCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (certificationId: UUID) => deleteCertification(certificationId),
    onSuccess: () => {
      // Invalidate certification lists
      queryClient.invalidateQueries({
        queryKey: trainerPortalKeys.certifications(),
      });
    },
  });
}
