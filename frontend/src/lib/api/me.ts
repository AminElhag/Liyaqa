import { api } from "./client";
import type { PaginatedResponse, UUID } from "@/types/api";
import type { Member, Subscription, UpdateMemberRequest } from "@/types/member";
import type { Booking, ClassSession, BookingQueryParams } from "@/types/scheduling";
import type { Invoice, InvoiceQueryParams } from "@/types/billing";
import type { AttendanceRecord } from "@/types/attendance";

/**
 * Member summary (from mobile home endpoint)
 */
export interface MemberSummary {
  id: UUID;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  status: string;
}

/**
 * Subscription summary (from mobile home endpoint)
 */
export interface SubscriptionSummary {
  id: UUID;
  planName: { en: string; ar?: string };
  status: string;
  daysRemaining: number;
  classesRemaining?: number;
  endDate: string;
  isExpiringSoon: boolean;
}

/**
 * Upcoming class summary
 */
export interface UpcomingClassSummary {
  bookingId: UUID;
  sessionId: UUID;
  className: { en: string; ar?: string };
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

/**
 * Attendance stats
 */
export interface AttendanceStats {
  totalVisits: number;
  thisMonthVisits: number;
  lastMonthVisits: number;
}

/**
 * Pending invoices summary
 */
export interface PendingInvoicesSummary {
  count: number;
  totalAmount: number;
  hasOverdue: boolean;
}

/**
 * Member dashboard summary (matches MobileHomeDashboardResponse)
 */
export interface MemberDashboard {
  member: MemberSummary;
  subscription?: SubscriptionSummary;
  nextClass?: UpcomingClassSummary;
  upcomingClasses: UpcomingClassSummary[];
  totalUpcomingClasses: number;
  attendanceStats: AttendanceStats;
  pendingInvoices: PendingInvoicesSummary;
  unreadNotifications: number;
  lastUpdated: string;
}

/**
 * QR code response (matches backend QrCodeResponse)
 */
export interface QrCodeResponse {
  qrCode: string;
  token: string;
  memberId?: UUID;
  sessionId?: UUID;
  expiresAt: string;
  type: string;
}

/**
 * Notification channel
 */
export type NotificationChannel = "EMAIL" | "SMS" | "PUSH" | "IN_APP";

/**
 * Notification type
 */
export type NotificationType =
  | "BOOKING_CONFIRMATION"
  | "BOOKING_CANCELLATION"
  | "BOOKING_REMINDER"
  | "WAITLIST_PROMOTION"
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_EXPIRED"
  | "INVOICE_ISSUED"
  | "PAYMENT_RECEIVED"
  | "WELCOME"
  | "PASSWORD_CHANGE"
  | "GENERAL";

/**
 * Notification
 */
export interface Notification {
  id: UUID;
  memberId: UUID;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  read: boolean;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  bookingReminders: boolean;
  subscriptionAlerts: boolean;
  invoiceNotifications: boolean;
  marketingEmails: boolean;
}

/**
 * Update profile request (limited fields for member self-service)
 */
export interface UpdateProfileRequest {
  phone?: string;
  address?: { en: string; ar?: string | null };
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

// ============================================
// Profile endpoints
// ============================================

/**
 * Get current member's profile
 */
export async function getMyProfile(): Promise<Member> {
  return api.get("api/me").json();
}

/**
 * Update current member's profile
 */
export async function updateMyProfile(
  data: UpdateProfileRequest
): Promise<Member> {
  return api.patch("api/me", { json: data }).json();
}

/**
 * Get member home dashboard data
 */
export async function getMyDashboard(): Promise<MemberDashboard> {
  return api.get("api/mobile/home").json();
}

// ============================================
// QR Code endpoints
// ============================================

/**
 * Generate QR code for check-in
 */
export async function getMyQrCode(): Promise<QrCodeResponse> {
  return api.get("api/qr/me").json();
}

// ============================================
// Bookings endpoints
// ============================================

/**
 * Get member's bookings
 * @param type - "upcoming" for future bookings, "past" for past bookings
 */
export async function getMyBookings(
  params: Omit<BookingQueryParams, "memberId"> & { type?: "upcoming" | "past" } = {}
): Promise<PaginatedResponse<Booking>> {
  const searchParams = new URLSearchParams();
  const type = params.type || "upcoming";

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/me/bookings/${type}?${queryString}`
    : `api/me/bookings/${type}`;

  return api.get(url).json();
}

/**
 * Get member's upcoming bookings
 */
export async function getMyUpcomingBookings(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<Booking>> {
  return getMyBookings({ ...params, type: "upcoming" });
}

/**
 * Get member's past bookings
 */
export async function getMyPastBookings(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<Booking>> {
  return getMyBookings({ ...params, type: "past" });
}

/**
 * Get available sessions for booking
 */
export async function getAvailableSessions(
  params: { date?: string; dateFrom?: string; dateTo?: string } = {}
): Promise<PaginatedResponse<ClassSession>> {
  const searchParams = new URLSearchParams();

  if (params.date) searchParams.set("date", params.date);
  // Backend expects startDate/endDate, not dateFrom/dateTo
  if (params.dateFrom) searchParams.set("startDate", params.dateFrom);
  if (params.dateTo) searchParams.set("endDate", params.dateTo);
  searchParams.set("status", "SCHEDULED");
  searchParams.set("size", "50");

  const queryString = searchParams.toString();
  const url = queryString ? `api/classes/sessions?${queryString}` : "api/classes/sessions";

  return api.get(url).json();
}

/**
 * Book a session
 */
export async function bookSession(sessionId: UUID): Promise<Booking> {
  return api.post(`api/me/bookings`, { json: { sessionId } }).json();
}

/**
 * Cancel a booking
 */
export async function cancelMyBooking(bookingId: UUID): Promise<void> {
  await api.post(`api/me/bookings/${bookingId}/cancel`);
}

// ============================================
// Invoices endpoints
// ============================================

/**
 * Get member's invoices
 */
export async function getMyInvoices(
  params: Omit<InvoiceQueryParams, "memberId"> = {}
): Promise<PaginatedResponse<Invoice>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.status) searchParams.set("status", params.status);
  if (params.issuedAfter) searchParams.set("issuedAfter", params.issuedAfter);
  if (params.issuedBefore) searchParams.set("issuedBefore", params.issuedBefore);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.direction) searchParams.set("direction", params.direction);

  const queryString = searchParams.toString();
  const url = queryString ? `api/me/invoices?${queryString}` : "api/me/invoices";

  return api.get(url).json();
}

/**
 * Get a specific invoice
 * Uses the general invoices endpoint since MeController doesn't have this endpoint
 */
export async function getMyInvoice(invoiceId: UUID): Promise<Invoice> {
  return api.get(`api/invoices/${invoiceId}`).json();
}

/**
 * Download invoice PDF
 * Uses the general invoices endpoint since MeController doesn't have this endpoint
 */
export async function downloadMyInvoicePdf(invoiceId: UUID): Promise<Blob> {
  return api.get(`api/invoices/${invoiceId}/pdf`).blob();
}

// ============================================
// Notifications endpoints
// ============================================

/**
 * Get member's notifications
 */
export async function getMyNotifications(
  params: { page?: number; size?: number; unreadOnly?: boolean } = {}
): Promise<PaginatedResponse<Notification>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.unreadOnly) searchParams.set("unreadOnly", "true");

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/me/notifications?${queryString}`
    : "api/me/notifications";

  return api.get(url).json();
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: UUID): Promise<void> {
  await api.post(`api/notifications/${notificationId}/read`);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<void> {
  await api.post("api/me/notifications/read-all");
}

/**
 * Get notification preferences
 * Fetches member's profile first to get memberId, then fetches preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const profile = await getMyProfile();
  return api.get(`api/notifications/preferences/${profile.id}`).json();
}

/**
 * Update notification preferences
 * Fetches member's profile first to get memberId, then updates preferences
 */
export async function updateNotificationPreferences(
  data: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const profile = await getMyProfile();
  return api.put(`api/notifications/preferences/${profile.id}`, { json: data }).json();
}

// ============================================
// Subscription endpoints
// ============================================

/**
 * Get member's active subscription
 */
export async function getMySubscription(): Promise<Subscription | null> {
  try {
    return await api.get("api/me/subscription").json();
  } catch {
    return null;
  }
}

/**
 * Get member's subscription history
 */
export async function getMySubscriptionHistory(): Promise<Subscription[]> {
  return api.get("api/me/subscriptions").json();
}
