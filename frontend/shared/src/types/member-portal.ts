import type { UUID, LocalizedText, Money } from "./api";
import type { MemberStatus } from "./member";
import type { BookingStatus } from "./scheduling";
import type { InvoiceStatus, PaymentMethod } from "./billing";

/**
 * Member profile address
 */
export interface MemberAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Member profile response from /api/me
 */
export interface MyProfile {
  id: UUID;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: MemberAddress;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update profile request
 */
export interface UpdateMyProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Subscription lite response
 */
export interface SubscriptionLite {
  id: UUID;
  planId: UUID;
  planName?: LocalizedText;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  classesRemaining?: number;
  guestPassesRemaining: number;
  freezeDaysRemaining: number;
  frozenAt?: string;
  isActive: boolean;
  daysRemaining: number;
}

/**
 * My subscription response
 */
export interface MySubscriptionResponse {
  hasSubscription: boolean;
  subscription?: SubscriptionLite;
}

/**
 * Booking lite response
 */
export interface BookingLite {
  id: UUID;
  sessionId: UUID;
  sessionDate: string;
  sessionStartTime: string;
  sessionEndTime: string;
  className: LocalizedText;
  trainerName?: LocalizedText;
  locationName?: LocalizedText;
  status: BookingStatus;
  waitlistPosition?: number;
  checkedInAt?: string;
  createdAt: string;
}

/**
 * Attendance lite response
 */
export interface AttendanceLite {
  id: UUID;
  checkInTime: string;
  checkOutTime?: string;
  method: string;
  duration?: number;
}

/**
 * Invoice lite response
 */
export interface InvoiceLite {
  id: UUID;
  invoiceNumber: string;
  totalAmount: Money;
  paidAmount?: Money;
  remainingBalance: Money;
  status: InvoiceStatus;
  issueDate?: string;
  dueDate?: string;
  paidDate?: string;
}

/**
 * Notification lite response
 */
export interface NotificationLite {
  id: UUID;
  type: string;
  title: LocalizedText;
  message: LocalizedText;
  readAt?: string;
  createdAt: string;
}

/**
 * Wallet response
 */
export interface WalletBalance {
  memberId: UUID;
  balance: Money;
  lastTransactionAt?: string;
}

/**
 * Wallet transaction type
 */
export type WalletTransactionType =
  | "CREDIT"
  | "DEBIT"
  | "REFUND"
  | "ADJUSTMENT"
  | "REWARD"
  | "GIFT_CARD";

/**
 * Wallet transaction response
 */
export interface WalletTransaction {
  id: UUID;
  type: WalletTransactionType;
  amount: Money;
  description?: LocalizedText;
  referenceType?: string;
  referenceId?: UUID;
  createdAt: string;
}

/**
 * Self-service booking request
 */
export interface SelfServiceBookingRequest {
  sessionId: UUID;
  notes?: string;
}

/**
 * Mobile page response (pagination for /api/me endpoints)
 */
export interface MobilePageResponse<T> {
  items: T[];
  itemCount: number;
  hasMore: boolean;
  totalCount: number;
}

/**
 * API message response
 */
export interface MessageResponse {
  success: boolean;
  message: string;
  messageAr?: string;
}

/**
 * Available class session for booking
 */
export interface AvailableSession {
  id: UUID;
  classId: UUID;
  className: LocalizedText;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  availableSpots: number;
  status: string;
  trainerId?: UUID;
  trainerName?: LocalizedText;
  locationId?: UUID;
  locationName?: LocalizedText;
  colorCode?: string;
  isBooked?: boolean;
  isFull?: boolean;
  waitlistAvailable?: boolean;
}
