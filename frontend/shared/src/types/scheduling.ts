import type { UUID, LocalizedText, ListQueryParams, Money } from "./api";

/**
 * Day of week
 */
export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

/**
 * Class status
 */
export type ClassStatus = "ACTIVE" | "INACTIVE" | "CANCELLED";

/**
 * Session status
 */
export type SessionStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

/**
 * Booking status
 */
export type BookingStatus =
  | "CONFIRMED"
  | "WAITLISTED"
  | "CANCELLED"
  | "CHECKED_IN"
  | "NO_SHOW";

/**
 * Pricing model for classes
 */
export type ClassPricingModel =
  | "INCLUDED_IN_MEMBERSHIP"
  | "PAY_PER_ENTRY"
  | "CLASS_PACK_ONLY"
  | "HYBRID";

/**
 * Payment source for bookings
 */
export type BookingPaymentSource =
  | "MEMBERSHIP_INCLUDED"
  | "CLASS_PACK"
  | "PAY_PER_ENTRY"
  | "COMPLIMENTARY";

/**
 * Class pack status
 */
export type ClassPackStatus = "ACTIVE" | "INACTIVE";

/**
 * Class pack balance status
 */
export type ClassPackBalanceStatus = "ACTIVE" | "DEPLETED" | "EXPIRED" | "CANCELLED";

/**
 * Class schedule for recurring classes
 */
export interface ClassSchedule {
  id: UUID;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

/**
 * Class type
 */
export type ClassType = "GROUP_FITNESS" | "PERSONAL_TRAINING" | "SPECIALTY" | "WORKSHOP";

/**
 * Difficulty level
 */
export type DifficultyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";

/**
 * Gym class
 */
export interface GymClass {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText;
  trainerId?: UUID;
  trainerName?: LocalizedText;
  capacity: number;
  durationMinutes: number;
  locationId?: UUID;
  locationName?: LocalizedText;
  status: ClassStatus;
  schedules: ClassSchedule[];
  // Class attributes
  classType?: ClassType;
  difficultyLevel: DifficultyLevel;
  colorCode?: string;
  imageUrl?: string;
  // Pricing fields
  pricingModel: ClassPricingModel;
  dropInPrice?: Money;
  taxRate?: number;
  allowNonSubscribers: boolean;
  // Booking settings
  advanceBookingDays: number;
  cancellationDeadlineHours: number;
  lateCancellationFee?: Money;
  tenantId: UUID;
  createdAt: string;
  updatedAt: string;
}

/**
 * Class session (instance of a class)
 */
export interface ClassSession {
  id: UUID;
  classId: UUID;
  className: LocalizedText;
  trainerId?: UUID;
  trainerName?: LocalizedText;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  availableSpots: number;
  status: SessionStatus;
  locationId?: UUID;
  locationName?: LocalizedText;
  // Member-specific fields (from member portal API)
  bookedByCurrentMember?: boolean;
  waitlistEnabled?: boolean;
  colorCode?: string;
  tenantId: UUID;
  createdAt: string;
  updatedAt: string;
}

/**
 * Booking
 */
export interface Booking {
  id: UUID;
  sessionId: UUID;
  sessionDate: string;
  sessionTime: string;
  className: LocalizedText;
  memberId: UUID;
  memberName: LocalizedText;
  memberEmail: string;
  status: BookingStatus;
  waitlistPosition?: number;
  checkedInAt?: string;
  cancelledAt?: string;
  // Payment tracking
  paymentSource?: BookingPaymentSource;
  classPackBalanceId?: UUID;
  orderId?: UUID;
  paidAmount?: Money;
  tenantId: UUID;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create class request
 */
export interface CreateClassRequest {
  name: LocalizedText;
  description?: LocalizedText;
  trainerId?: UUID;
  capacity: number;
  durationMinutes: number;
  locationId?: UUID;
  // Pricing settings
  pricingModel?: ClassPricingModel;
  dropInPriceAmount?: number;
  dropInPriceCurrency?: string;
  taxRate?: number;
  allowNonSubscribers?: boolean;
  // Booking settings
  advanceBookingDays?: number;
  cancellationDeadlineHours?: number;
  lateCancellationFeeAmount?: number;
  lateCancellationFeeCurrency?: string;
  schedules?: Array<{
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
  }>;
}

/**
 * Update class request
 */
export interface UpdateClassRequest {
  name?: LocalizedText;
  description?: LocalizedText;
  trainerId?: UUID;
  capacity?: number;
  durationMinutes?: number;
  locationId?: UUID;
  status?: ClassStatus;
  // Pricing settings
  pricingModel?: ClassPricingModel;
  dropInPriceAmount?: number;
  dropInPriceCurrency?: string;
  taxRate?: number;
  allowNonSubscribers?: boolean;
  // Booking settings
  advanceBookingDays?: number;
  cancellationDeadlineHours?: number;
  lateCancellationFeeAmount?: number;
  lateCancellationFeeCurrency?: string;
}

/**
 * Generate sessions request
 */
export interface GenerateSessionsRequest {
  startDate: string;
  endDate: string;
}

/**
 * Create booking request
 */
export interface CreateBookingRequest {
  sessionId: UUID;
  memberId: UUID;
}

/**
 * Class query params
 */
export interface ClassQueryParams extends ListQueryParams {
  status?: ClassStatus;
  trainerId?: UUID;
  locationId?: UUID;
}

/**
 * Session query params
 */
export interface SessionQueryParams extends ListQueryParams {
  classId?: UUID;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: SessionStatus;
}

/**
 * Booking query params
 */
export interface BookingQueryParams extends ListQueryParams {
  sessionId?: UUID;
  memberId?: UUID;
  status?: BookingStatus;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ==================== CLASS PACKS ====================

/**
 * Class pack
 */
export interface ClassPack {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText;
  classCount: number;
  price: Money;
  priceWithTax: Money;
  taxRate: number;
  validityDays?: number;
  validClassTypes: string[];
  validClassIds: UUID[];
  status: ClassPackStatus;
  sortOrder: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Member class pack balance
 */
export interface MemberClassPackBalance {
  id: UUID;
  memberId: UUID;
  classPackId: UUID;
  packName: LocalizedText;
  classesPurchased: number;
  classesRemaining: number;
  classesUsed: number;
  purchasedAt: string;
  expiresAt?: string;
  status: ClassPackBalanceStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create class pack request
 */
export interface CreateClassPackRequest {
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  classCount: number;
  priceAmount: number;
  priceCurrency?: string;
  taxRate?: number;
  validityDays?: number;
  validClassTypes?: string[];
  validClassIds?: UUID[];
  sortOrder?: number;
  imageUrl?: string;
}

/**
 * Update class pack request
 */
export interface UpdateClassPackRequest {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  classCount?: number;
  priceAmount?: number;
  priceCurrency?: string;
  taxRate?: number;
  validityDays?: number;
  validClassTypes?: string[];
  validClassIds?: UUID[];
  sortOrder?: number;
  imageUrl?: string;
}

/**
 * Booking options response (for member booking)
 */
export interface BookingOptionsResponse {
  sessionId: UUID;
  memberId: UUID;
  canBook: boolean;
  reason?: string;
  options: {
    membership?: {
      available: boolean;
      classesRemaining: number;
    };
    classPacks: Array<{
      balanceId: UUID;
      packName: LocalizedText;
      classesRemaining: number;
      expiresAt?: string;
    }>;
    payPerEntry?: {
      available: boolean;
      price: Money;
      taxRate: number;
      totalWithTax: Money;
    };
  };
}

/**
 * Create booking with payment request
 */
export interface CreateBookingWithPaymentRequest {
  sessionId: UUID;
  paymentSource: BookingPaymentSource;
  classPackBalanceId?: UUID;
}

