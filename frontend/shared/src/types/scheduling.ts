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
  | "NO_SHOW"
  | "COMPLETED";

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
 * Access policy for a gym class
 */
export type ClassAccessPolicy =
  | "MEMBERS_ONLY"
  | "SPECIFIC_MEMBERSHIPS"
  | "OPEN_TO_ANYONE";

/**
 * Class access level on a membership plan
 */
export type ClassAccessLevel = "UNLIMITED" | "LIMITED" | "NO_ACCESS";

/**
 * Spot status in a room layout
 */
export type SpotStatus = "AVAILABLE" | "INSTRUCTOR_ONLY" | "DISABLED";

// ==================== PT TYPES ====================

/**
 * PT session type
 */
export type PTSessionType = "ONE_ON_ONE" | "SEMI_PRIVATE";

/**
 * PT location type
 */
export type PTLocationType = "CLUB" | "HOME";

/**
 * Service type for universal credit packs
 */
export type ServiceType = "GX" | "PT" | "GOODS";

/**
 * Trainer availability status
 */
export type TrainerAvailabilityStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

/**
 * Trainer profile
 */
export interface TrainerProfile {
  id: UUID;
  userId: UUID;
  displayName?: LocalizedText;
  bio?: LocalizedText;
  specializations?: string[];
  gender?: string;
  experienceYears?: number;
  employmentType: string;
  trainerType: string;
  homeServiceAvailable: boolean;
  travelFeeAmount?: number;
  travelFeeCurrency?: string;
  travelRadiusKm?: number;
  maxConcurrentClients: number;
  hourlyRate?: number;
  ptSessionRate?: number;
  rating?: number;
  status: string;
  phone?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Trainer availability slot
 */
export interface TrainerAvailabilitySlot {
  id: UUID;
  trainerId: UUID;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  locationType: PTLocationType;
  locationId?: UUID;
  isRecurring: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  status: TrainerAvailabilityStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * PT dashboard stats
 */
export interface PTDashboardStats {
  totalPTClasses: number;
  activePTClasses: number;
  totalPTSessions: number;
  completedPTSessions: number;
  cancelledPTSessions: number;
  upcomingPTSessions: number;
}

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
export type ClassType =
  | "GROUP_FITNESS"
  | "PERSONAL_TRAINING"
  | "YOGA"
  | "PILATES"
  | "SPINNING"
  | "CROSSFIT"
  | "SWIMMING"
  | "MARTIAL_ARTS"
  | "DANCE"
  | "OTHER";

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
  // GX access policy
  accessPolicy: ClassAccessPolicy;
  onlineBookableSpots?: number;
  noShowFee?: Money;
  // Spot booking
  spotBookingEnabled: boolean;
  roomLayoutId?: UUID;
  // Category
  categoryId?: UUID;
  categoryName?: LocalizedText;
  // PT fields
  ptSessionType?: PTSessionType;
  ptLocationType?: PTLocationType;
  travelFee?: Money;
  trainerProfileId?: UUID;
  minCapacity?: number;
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
  // PT fields
  ptLocationType?: PTLocationType;
  clientAddress?: string;
  travelFeeApplied?: Money;
  trainerNotes?: string;
  completionNotes?: string;
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
  // Spot booking
  spotId?: string;
  spotLabel?: string;
  // PT travel fee
  travelFeePaid?: Money;
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
  classType?: ClassType;
  difficultyLevel?: DifficultyLevel;
  colorCode?: string;
  imageUrl?: string;
  genderRestriction?: string;
  // Category
  categoryId?: UUID;
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
  // GX access policy
  accessPolicy?: ClassAccessPolicy;
  eligiblePlanIds?: UUID[];
  onlineBookableSpots?: number;
  noShowFeeAmount?: number;
  noShowFeeCurrency?: string;
  // Spot booking
  spotBookingEnabled?: boolean;
  roomLayoutId?: UUID;
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
  classType?: ClassType;
  difficultyLevel?: DifficultyLevel;
  colorCode?: string;
  imageUrl?: string;
  // Category
  categoryId?: UUID;
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
  // GX access policy
  accessPolicy?: ClassAccessPolicy;
  eligiblePlanIds?: UUID[];
  onlineBookableSpots?: number;
  noShowFeeAmount?: number;
  noShowFeeCurrency?: string;
  // Spot booking
  spotBookingEnabled?: boolean;
  roomLayoutId?: UUID;
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
  spotId?: string;
  spotLabel?: string;
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

// ==================== CLASS CATEGORIES ====================

/**
 * Class category (admin-created class groupings)
 */
export interface ClassCategory {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText;
  colorCode?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassCategoryRequest {
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  colorCode?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateClassCategoryRequest {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  colorCode?: string;
  icon?: string;
  sortOrder?: number;
}

// ==================== CLASS PACK ALLOCATION ====================

/**
 * Allocation mode for class packs
 */
export type ClassPackAllocationMode = "FLAT" | "PER_CATEGORY";

/**
 * Per-category credit allocation within a pack
 */
export interface CategoryAllocation {
  id: UUID;
  categoryId: UUID;
  categoryName?: LocalizedText;
  creditCount: number;
}

/**
 * Per-category credit balance for a member
 */
export interface CategoryBalance {
  id: UUID;
  categoryId: UUID;
  categoryName?: LocalizedText;
  creditsAllocated: number;
  creditsRemaining: number;
}

/**
 * Input for creating category allocations
 */
export interface CategoryAllocationInput {
  categoryId: UUID;
  creditCount: number;
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
  allocationMode: ClassPackAllocationMode;
  serviceType: ServiceType;
  categoryAllocations?: CategoryAllocation[];
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
  allocationMode?: ClassPackAllocationMode;
  categoryBalances?: CategoryBalance[];
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
  allocationMode?: ClassPackAllocationMode;
  serviceType?: ServiceType;
  categoryAllocations?: CategoryAllocationInput[];
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
  allocationMode?: ClassPackAllocationMode;
  categoryAllocations?: CategoryAllocationInput[];
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
      allocationMode?: ClassPackAllocationMode;
      categoryBalances?: CategoryBalance[];
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
  spotId?: string;
  spotLabel?: string;
}

// ==================== ROOM LAYOUTS ====================

/**
 * Spot definition in a room layout
 */
export interface SpotDefinition {
  id: string;
  row: number;
  col: number;
  label: string;
  status: SpotStatus;
}

/**
 * Room layout for spot-based booking
 */
export interface RoomLayout {
  id: UUID;
  name: LocalizedText;
  rows: number;
  columns: number;
  layoutJson: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomLayoutRequest {
  nameEn: string;
  nameAr?: string;
  rows?: number;
  columns?: number;
  layoutJson?: string;
}

export interface UpdateRoomLayoutRequest {
  nameEn?: string;
  nameAr?: string;
  rows?: number;
  columns?: number;
  layoutJson?: string;
}

// ==================== GX SETTINGS ====================

/**
 * GX settings (per-tenant configuration)
 */
export interface GxSettings {
  id: UUID;
  defaultBookingWindowDays: number;
  defaultCancellationDeadlineHours: number;
  defaultLateCancellationFee: Money;
  defaultNoShowFee: Money;
  walkinReserveSpots: number;
  autoMarkNoShows: boolean;
  preClassReminderMinutes: number;
  waitlistAutoPromote: boolean;
  waitlistNotificationChannel: string;
  prayerTimeBlockingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateGxSettingsRequest {
  defaultBookingWindowDays?: number;
  defaultCancellationDeadlineHours?: number;
  defaultLateCancellationFeeAmount?: number;
  defaultLateCancellationFeeCurrency?: string;
  defaultNoShowFeeAmount?: number;
  defaultNoShowFeeCurrency?: string;
  walkinReserveSpots?: number;
  autoMarkNoShows?: boolean;
  preClassReminderMinutes?: number;
  waitlistAutoPromote?: boolean;
  waitlistNotificationChannel?: string;
  prayerTimeBlockingEnabled?: boolean;
}

// ==================== PT REQUESTS ====================

/**
 * Create PT class request
 */
export interface CreatePTClassRequest {
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  locationId?: UUID;
  trainerId: UUID;
  ptSessionType: PTSessionType;
  ptLocationType: PTLocationType;
  durationMinutes?: number;
  maxCapacity?: number;
  minCapacity?: number;
  pricingModel?: ClassPricingModel;
  dropInPriceAmount?: number;
  dropInPriceCurrency?: string;
  travelFeeAmount?: number;
  travelFeeCurrency?: string;
  taxRate?: number;
  categoryId?: UUID;
}

/**
 * Schedule PT session request
 */
export interface SchedulePTSessionRequest {
  gymClassId: UUID;
  sessionDate: string;
  startTime: string;
  endTime: string;
  clientAddress?: string;
  notesEn?: string;
  notesAr?: string;
}

/**
 * Complete PT session request
 */
export interface CompletePTSessionRequest {
  completionNotes?: string;
  trainerNotes?: string;
}

/**
 * Set trainer availability request
 */
export interface SetTrainerAvailabilityRequest {
  slots: Array<{
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    locationType?: PTLocationType;
    locationId?: UUID;
    isRecurring?: boolean;
    effectiveFrom?: string;
    effectiveUntil?: string;
  }>;
}

/**
 * Block slot request
 */
export interface BlockSlotRequest {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveUntil?: string;
}

/**
 * PT session query params
 */
export interface PTSessionQueryParams extends ListQueryParams {
  trainerId?: UUID;
  startDate?: string;
  endDate?: string;
}

/**
 * Class pack query params (with service type filter)
 */
export interface ClassPackQueryParams extends ListQueryParams {
  status?: ClassPackStatus;
  serviceType?: ServiceType;
}

