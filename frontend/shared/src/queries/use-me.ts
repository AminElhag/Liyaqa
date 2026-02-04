"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getMyProfile,
  updateMyProfile,
  getMyDashboard,
  getMyQrCode,
  getMyBookings,
  getAvailableSessions,
  bookSession,
  cancelMyBooking,
  getMyInvoices,
  getMyInvoice,
  downloadMyInvoicePdf,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  getMySubscription,
  getMySubscriptionHistory,
  type MemberDashboard,
  type QrCodeResponse,
  type Notification,
  type NotificationPreferences,
  type UpdateProfileRequest,
} from "../lib/api/me";
import type { PaginatedResponse, UUID } from "../types/api";
import type { Member, Subscription } from "../types/member";
import type { Booking, ClassSession, BookingQueryParams } from "../types/scheduling";
import type { Invoice, InvoiceQueryParams } from "../types/billing";

// ============================================
// Query keys
// ============================================

export const meKeys = {
  all: ["me"] as const,
  profile: () => [...meKeys.all, "profile"] as const,
  dashboard: () => [...meKeys.all, "dashboard"] as const,
  qrCode: () => [...meKeys.all, "qr-code"] as const,
  subscription: () => [...meKeys.all, "subscription"] as const,
  subscriptionHistory: () => [...meKeys.all, "subscription-history"] as const,
  bookings: () => [...meKeys.all, "bookings"] as const,
  bookingsList: (params: Omit<BookingQueryParams, "memberId">) =>
    [...meKeys.bookings(), params] as const,
  invoices: () => [...meKeys.all, "invoices"] as const,
  invoicesList: (params: Omit<InvoiceQueryParams, "memberId">) =>
    [...meKeys.invoices(), params] as const,
  invoice: (id: UUID) => [...meKeys.invoices(), id] as const,
  notifications: () => [...meKeys.all, "notifications"] as const,
  notificationsList: (params: { page?: number; size?: number; unreadOnly?: boolean }) =>
    [...meKeys.notifications(), params] as const,
  notificationPreferences: () => [...meKeys.all, "notification-preferences"] as const,
  availableSessions: (params: { date?: string; dateFrom?: string; dateTo?: string }) =>
    [...meKeys.all, "available-sessions", params] as const,
};

// ============================================
// Profile hooks
// ============================================

/**
 * Hook to fetch current member's profile
 */
export function useMyProfile(
  options?: Omit<UseQueryOptions<Member>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: meKeys.profile(),
    queryFn: () => getMyProfile(),
    ...options,
  });
}

/**
 * Hook to update profile
 */
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKeys.profile() });
      queryClient.invalidateQueries({ queryKey: meKeys.dashboard() });
    },
  });
}

/**
 * Hook to fetch member home dashboard
 */
export function useMyDashboard(
  options?: Omit<UseQueryOptions<MemberDashboard>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: meKeys.dashboard(),
    queryFn: () => getMyDashboard(),
    ...options,
  });
}

// ============================================
// QR Code hooks
// ============================================

/**
 * Hook to generate QR code for check-in
 */
export function useMyQrCode(
  options?: Omit<UseQueryOptions<QrCodeResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: meKeys.qrCode(),
    queryFn: () => getMyQrCode(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 4 * 60 * 1000, // Consider stale after 4 minutes
    ...options,
  });
}

// ============================================
// Subscription hooks
// ============================================

/**
 * Hook to fetch member's active subscription
 */
export function useMySubscription(
  options?: Omit<UseQueryOptions<Subscription | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: meKeys.subscription(),
    queryFn: () => getMySubscription(),
    ...options,
  });
}

/**
 * Hook to fetch subscription history
 */
export function useMySubscriptionHistory(
  options?: Omit<UseQueryOptions<Subscription[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: meKeys.subscriptionHistory(),
    queryFn: () => getMySubscriptionHistory(),
    ...options,
  });
}

// ============================================
// Booking hooks
// ============================================

/**
 * Hook to fetch member's bookings
 */
export function useMyBookings(
  params: Omit<BookingQueryParams, "memberId"> = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Booking>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: meKeys.bookingsList(params),
    queryFn: () => getMyBookings(params),
    ...options,
  });
}

/**
 * Hook to fetch available sessions for booking
 */
export function useAvailableSessions(
  params: { date?: string; dateFrom?: string; dateTo?: string } = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<ClassSession>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: meKeys.availableSessions(params),
    queryFn: () => getAvailableSessions(params),
    ...options,
  });
}

/**
 * Hook to book a session
 */
export function useBookSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: UUID) => bookSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKeys.bookings() });
      queryClient.invalidateQueries({ queryKey: meKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: meKeys.subscription() });
      // Also invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

/**
 * Hook to cancel a booking
 */
export function useCancelMyBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: UUID) => cancelMyBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKeys.bookings() });
      queryClient.invalidateQueries({ queryKey: meKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: meKeys.subscription() });
      // Also invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

// ============================================
// Invoice hooks
// ============================================

/**
 * Hook to fetch member's invoices
 */
export function useMyInvoices(
  params: Omit<InvoiceQueryParams, "memberId"> = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Invoice>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: meKeys.invoicesList(params),
    queryFn: () => getMyInvoices(params),
    ...options,
  });
}

/**
 * Hook to fetch a specific invoice
 */
export function useMyInvoice(
  invoiceId: UUID,
  options?: Omit<UseQueryOptions<Invoice>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: meKeys.invoice(invoiceId),
    queryFn: () => getMyInvoice(invoiceId),
    enabled: !!invoiceId,
    ...options,
  });
}

/**
 * Hook to download invoice PDF
 */
export function useDownloadMyInvoicePdf() {
  return useMutation({
    mutationFn: async (invoiceId: UUID) => {
      const blob = await downloadMyInvoicePdf(invoiceId);
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}

// ============================================
// Notification hooks
// ============================================

/**
 * Hook to fetch member's notifications
 */
export function useMyNotifications(
  params: { page?: number; size?: number; unreadOnly?: boolean } = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Notification>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: meKeys.notificationsList(params),
    queryFn: () => getMyNotifications(params),
    refetchInterval: 60000, // Refetch every minute
    ...options,
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: UUID) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKeys.notifications() });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKeys.notifications() });
    },
  });
}

/**
 * Hook to fetch notification preferences
 */
export function useNotificationPreferences(
  options?: Omit<UseQueryOptions<NotificationPreferences>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: meKeys.notificationPreferences(),
    queryFn: () => getNotificationPreferences(),
    ...options,
  });
}

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) =>
      updateNotificationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: meKeys.notificationPreferences(),
      });
    },
  });
}
