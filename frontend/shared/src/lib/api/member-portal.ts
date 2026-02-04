import { api } from "./client";
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

/**
 * Member Portal API client
 * Provides self-service endpoints for authenticated members
 */

// ==================== PROFILE ====================

/**
 * Get authenticated user's profile
 */
export async function getMyProfile(): Promise<MyProfile> {
  return api.get("api/me").json<MyProfile>();
}

/**
 * Update authenticated member's profile
 */
export async function updateMyProfile(
  data: UpdateMyProfileRequest
): Promise<MyProfile> {
  return api.patch("api/me", { json: data }).json<MyProfile>();
}

/**
 * Change password for authenticated user
 */
export async function changePassword(
  data: ChangePasswordRequest
): Promise<MessageResponse> {
  return api.post("api/me/password/change", { json: data }).json<MessageResponse>();
}

// ==================== SUBSCRIPTION ====================

/**
 * Get my current subscription status
 */
export async function getMySubscription(): Promise<MySubscriptionResponse> {
  return api.get("api/me/subscription").json<MySubscriptionResponse>();
}

// ==================== BOOKINGS ====================

/**
 * Get my upcoming bookings
 */
export async function getMyUpcomingBookings(params?: {
  page?: number;
  size?: number;
}): Promise<MobilePageResponse<BookingLite>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get("api/me/bookings/upcoming", { searchParams })
    .json<MobilePageResponse<BookingLite>>();
}

/**
 * Get my past bookings
 */
export async function getMyPastBookings(params?: {
  page?: number;
  size?: number;
}): Promise<MobilePageResponse<BookingLite>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get("api/me/bookings/past", { searchParams })
    .json<MobilePageResponse<BookingLite>>();
}

/**
 * Book a class session
 */
export async function bookSession(
  data: SelfServiceBookingRequest
): Promise<BookingLite> {
  return api.post("api/me/bookings", { json: data }).json<BookingLite>();
}

/**
 * Cancel a booking
 */
export async function cancelMyBooking(
  bookingId: string
): Promise<MessageResponse> {
  return api
    .post(`api/me/bookings/${bookingId}/cancel`)
    .json<MessageResponse>();
}

// ==================== ATTENDANCE ====================

/**
 * Get my attendance history
 */
export async function getMyAttendance(params?: {
  page?: number;
  size?: number;
}): Promise<MobilePageResponse<AttendanceLite>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get("api/me/attendance", { searchParams })
    .json<MobilePageResponse<AttendanceLite>>();
}

/**
 * Get my attendance by date range
 */
export async function getMyAttendanceByDateRange(params: {
  startDate: string;
  endDate: string;
  page?: number;
  size?: number;
}): Promise<MobilePageResponse<AttendanceLite>> {
  const searchParams = new URLSearchParams();
  searchParams.set("startDate", params.startDate);
  searchParams.set("endDate", params.endDate);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get("api/me/attendance/range", { searchParams })
    .json<MobilePageResponse<AttendanceLite>>();
}

// ==================== INVOICES ====================

/**
 * Get my invoices
 */
export async function getMyInvoices(params?: {
  status?: InvoiceStatus;
  page?: number;
  size?: number;
}): Promise<MobilePageResponse<InvoiceLite>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get("api/me/invoices", { searchParams })
    .json<MobilePageResponse<InvoiceLite>>();
}

/**
 * Get my pending invoices
 */
export async function getMyPendingInvoices(): Promise<InvoiceLite[]> {
  return api.get("api/me/invoices/pending").json<InvoiceLite[]>();
}

// ==================== NOTIFICATIONS ====================

/**
 * Get my notifications
 */
export async function getMyNotifications(params?: {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}): Promise<MobilePageResponse<NotificationLite>> {
  const searchParams = new URLSearchParams();
  if (params?.unreadOnly !== undefined)
    searchParams.set("unreadOnly", String(params.unreadOnly));
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get("api/me/notifications", { searchParams })
    .json<MobilePageResponse<NotificationLite>>();
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<{
  unreadCount: number;
}> {
  return api
    .get("api/me/notifications/unread-count")
    .json<{ unreadCount: number }>();
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<MessageResponse> {
  return api.post("api/me/notifications/read-all").json<MessageResponse>();
}

// ==================== WALLET ====================

/**
 * Get my wallet balance
 */
export async function getMyWallet(): Promise<WalletBalance> {
  return api.get("api/me/wallet").json<WalletBalance>();
}

/**
 * Get my wallet transaction history
 */
export async function getMyWalletTransactions(params?: {
  type?: WalletTransactionType;
  page?: number;
  size?: number;
}): Promise<MobilePageResponse<WalletTransaction>> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get("api/me/wallet/transactions", { searchParams })
    .json<MobilePageResponse<WalletTransaction>>();
}

// ==================== CLASS SESSIONS (for booking) ====================

/**
 * Get available class sessions for booking
 * Uses the existing class sessions API with date range filter
 */
export async function getAvailableSessions(params: {
  dateFrom: string;
  dateTo: string;
  classId?: string;
  page?: number;
  size?: number;
}): Promise<{ content: AvailableSession[]; totalElements: number; last: boolean }> {
  const searchParams = new URLSearchParams();
  searchParams.set("dateFrom", params.dateFrom);
  searchParams.set("dateTo", params.dateTo);
  searchParams.set("status", "SCHEDULED");
  if (params.classId) searchParams.set("classId", params.classId);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get("api/sessions", { searchParams })
    .json<{ content: AvailableSession[]; totalElements: number; last: boolean }>();
}
