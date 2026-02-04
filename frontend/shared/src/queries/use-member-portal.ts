import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import * as memberPortalApi from "../lib/api/member-portal";
import type {
  MyProfile,
  UpdateMyProfileRequest,
  ChangePasswordRequest,
  MySubscriptionResponse,
  BookingLite,
  AttendanceLite,
  InvoiceLite,
  NotificationLite,
  WalletBalance,
  WalletTransaction,
  WalletTransactionType,
  SelfServiceBookingRequest,
  MobilePageResponse,
  MessageResponse,
  AvailableSession,
} from "../types/member-portal";
import type { InvoiceStatus } from "../types/billing";

// ==================== Query Keys ====================

export const memberPortalKeys = {
  all: ["member-portal"] as const,
  profile: () => [...memberPortalKeys.all, "profile"] as const,
  subscription: () => [...memberPortalKeys.all, "subscription"] as const,
  bookings: () => [...memberPortalKeys.all, "bookings"] as const,
  upcomingBookings: (params?: { page?: number; size?: number }) =>
    [...memberPortalKeys.bookings(), "upcoming", params] as const,
  pastBookings: (params?: { page?: number; size?: number }) =>
    [...memberPortalKeys.bookings(), "past", params] as const,
  attendance: () => [...memberPortalKeys.all, "attendance"] as const,
  attendanceList: (params?: { page?: number; size?: number }) =>
    [...memberPortalKeys.attendance(), "list", params] as const,
  attendanceRange: (params: { startDate: string; endDate: string; page?: number; size?: number }) =>
    [...memberPortalKeys.attendance(), "range", params] as const,
  invoices: () => [...memberPortalKeys.all, "invoices"] as const,
  invoicesList: (params?: { status?: InvoiceStatus; page?: number; size?: number }) =>
    [...memberPortalKeys.invoices(), "list", params] as const,
  pendingInvoices: () => [...memberPortalKeys.invoices(), "pending"] as const,
  notifications: () => [...memberPortalKeys.all, "notifications"] as const,
  notificationsList: (params?: { unreadOnly?: boolean; page?: number; size?: number }) =>
    [...memberPortalKeys.notifications(), "list", params] as const,
  unreadCount: () => [...memberPortalKeys.notifications(), "unread-count"] as const,
  wallet: () => [...memberPortalKeys.all, "wallet"] as const,
  walletBalance: () => [...memberPortalKeys.wallet(), "balance"] as const,
  walletTransactions: (params?: { type?: WalletTransactionType; page?: number; size?: number }) =>
    [...memberPortalKeys.wallet(), "transactions", params] as const,
  sessions: () => [...memberPortalKeys.all, "sessions"] as const,
  availableSessions: (params: { dateFrom: string; dateTo: string; classId?: string; page?: number; size?: number }) =>
    [...memberPortalKeys.sessions(), "available", params] as const,
};

// ==================== Profile Hooks ====================

export function useMyProfile(
  options?: Omit<UseQueryOptions<MyProfile>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.profile(),
    queryFn: memberPortalApi.getMyProfile,
    ...options,
  });
}

export function useUpdateMyProfile(
  options?: Omit<UseMutationOptions<MyProfile, Error, UpdateMyProfileRequest>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: memberPortalApi.updateMyProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(memberPortalKeys.profile(), data);
    },
    ...options,
  });
}

export function useChangePassword(
  options?: Omit<UseMutationOptions<MessageResponse, Error, ChangePasswordRequest>, "mutationFn">
) {
  return useMutation({
    mutationFn: memberPortalApi.changePassword,
    ...options,
  });
}

// ==================== Subscription Hooks ====================

export function useMySubscription(
  options?: Omit<UseQueryOptions<MySubscriptionResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.subscription(),
    queryFn: memberPortalApi.getMySubscription,
    ...options,
  });
}

// ==================== Booking Hooks ====================

export function useMyUpcomingBookings(
  params?: { page?: number; size?: number },
  options?: Omit<UseQueryOptions<MobilePageResponse<BookingLite>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.upcomingBookings(params),
    queryFn: () => memberPortalApi.getMyUpcomingBookings(params),
    ...options,
  });
}

export function useMyPastBookings(
  params?: { page?: number; size?: number },
  options?: Omit<UseQueryOptions<MobilePageResponse<BookingLite>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.pastBookings(params),
    queryFn: () => memberPortalApi.getMyPastBookings(params),
    ...options,
  });
}

export function useBookSession(
  options?: Omit<UseMutationOptions<BookingLite, Error, SelfServiceBookingRequest>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: memberPortalApi.bookSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberPortalKeys.bookings() });
      queryClient.invalidateQueries({ queryKey: memberPortalKeys.subscription() });
    },
    ...options,
  });
}

export function useCancelMyBooking(
  options?: Omit<UseMutationOptions<MessageResponse, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: memberPortalApi.cancelMyBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberPortalKeys.bookings() });
      queryClient.invalidateQueries({ queryKey: memberPortalKeys.subscription() });
    },
    ...options,
  });
}

// ==================== Attendance Hooks ====================

export function useMyAttendance(
  params?: { page?: number; size?: number },
  options?: Omit<UseQueryOptions<MobilePageResponse<AttendanceLite>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.attendanceList(params),
    queryFn: () => memberPortalApi.getMyAttendance(params),
    ...options,
  });
}

export function useMyAttendanceByDateRange(
  params: { startDate: string; endDate: string; page?: number; size?: number },
  options?: Omit<UseQueryOptions<MobilePageResponse<AttendanceLite>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.attendanceRange(params),
    queryFn: () => memberPortalApi.getMyAttendanceByDateRange(params),
    ...options,
  });
}

// ==================== Invoice Hooks ====================

export function useMyInvoices(
  params?: { status?: InvoiceStatus; page?: number; size?: number },
  options?: Omit<UseQueryOptions<MobilePageResponse<InvoiceLite>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.invoicesList(params),
    queryFn: () => memberPortalApi.getMyInvoices(params),
    ...options,
  });
}

export function useMyPendingInvoices(
  options?: Omit<UseQueryOptions<InvoiceLite[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.pendingInvoices(),
    queryFn: memberPortalApi.getMyPendingInvoices,
    ...options,
  });
}

// ==================== Notification Hooks ====================

export function useMyNotifications(
  params?: { unreadOnly?: boolean; page?: number; size?: number },
  options?: Omit<UseQueryOptions<MobilePageResponse<NotificationLite>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.notificationsList(params),
    queryFn: () => memberPortalApi.getMyNotifications(params),
    ...options,
  });
}

export function useUnreadNotificationCount(
  options?: Omit<UseQueryOptions<{ unreadCount: number }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.unreadCount(),
    queryFn: memberPortalApi.getUnreadNotificationCount,
    refetchInterval: 60000, // Refetch every minute
    ...options,
  });
}

export function useMarkAllNotificationsAsRead(
  options?: Omit<UseMutationOptions<MessageResponse, Error, void>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: memberPortalApi.markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberPortalKeys.notifications() });
    },
    ...options,
  });
}

// ==================== Wallet Hooks ====================

export function useMyWallet(
  options?: Omit<UseQueryOptions<WalletBalance>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.walletBalance(),
    queryFn: memberPortalApi.getMyWallet,
    ...options,
  });
}

export function useMyWalletTransactions(
  params?: { type?: WalletTransactionType; page?: number; size?: number },
  options?: Omit<UseQueryOptions<MobilePageResponse<WalletTransaction>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.walletTransactions(params),
    queryFn: () => memberPortalApi.getMyWalletTransactions(params),
    ...options,
  });
}

// ==================== Available Sessions Hooks ====================

export function useAvailableSessions(
  params: { dateFrom: string; dateTo: string; classId?: string; page?: number; size?: number },
  options?: Omit<UseQueryOptions<{ content: AvailableSession[]; totalElements: number; last: boolean }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberPortalKeys.availableSessions(params),
    queryFn: () => memberPortalApi.getAvailableSessions(params),
    ...options,
  });
}
