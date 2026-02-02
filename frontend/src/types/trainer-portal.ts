import type { UUID, Money, LocalizedText } from "./api";

// ==================== ENUMS ====================

/**
 * Trainer client status
 */
export type TrainerClientStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "INACTIVE";

/**
 * Earning type
 */
export type EarningType =
  | "PT_SESSION"
  | "CLASS_SESSION"
  | "BONUS"
  | "COMMISSION"
  | "ADJUSTMENT";

/**
 * Earning status
 */
export type EarningStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";

/**
 * Notification type
 */
export type NotificationType =
  | "SESSION_BOOKED"
  | "SESSION_CANCELLED"
  | "SESSION_REMINDER"
  | "NEW_CLIENT"
  | "PAYMENT_PROCESSED"
  | "SCHEDULE_CHANGE"
  | "CERTIFICATION_EXPIRING"
  | "SYSTEM_ANNOUNCEMENT";

/**
 * Certification status
 */
export type CertificationStatus = "ACTIVE" | "EXPIRED" | "PENDING_VERIFICATION";

/**
 * Trainer status (from trainer.ts)
 */
export type TrainerStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";

/**
 * Trainer type (from trainer.ts)
 */
export type TrainerType =
  | "PERSONAL_TRAINER"
  | "GROUP_FITNESS"
  | "SPECIALIST"
  | "HYBRID";

// ==================== CLIENT MANAGEMENT DTOs ====================

/**
 * Response DTO for trainer client
 */
export interface TrainerClientResponse {
  id: UUID;
  trainerId: UUID;
  memberId: UUID;
  memberName: string | null;
  memberEmail: string | null;
  memberPhone: string | null;
  status: TrainerClientStatus;
  startDate: string; // ISO date string
  endDate: string | null; // ISO date string
  completedSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  goalsEn: string | null;
  goalsAr: string | null;
  notesEn: string | null;
  notesAr: string | null;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

/**
 * Request to update trainer client information
 */
export interface UpdateTrainerClientRequest {
  goalsEn?: string;
  goalsAr?: string;
  notesEn?: string;
  notesAr?: string;
  status?: TrainerClientStatus;
}

/**
 * Client statistics response
 */
export interface ClientStatsResponse {
  totalClients: number;
  activeClients: number;
  onHoldClients: number;
  completedClients: number;
  newThisMonth: number;
}

// ==================== EARNINGS MANAGEMENT DTOs ====================

/**
 * Response DTO for trainer earnings
 */
export interface TrainerEarningsResponse {
  id: UUID;
  trainerId: UUID;
  earningType: EarningType;
  sessionId: UUID | null;
  earningDate: string; // ISO date string
  amount: Money;
  deductions: Money | null;
  netAmount: Money;
  status: EarningStatus;
  paymentDate: string | null; // ISO date string
  paymentReference: string | null;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

/**
 * Summary response for earnings statistics
 */
export interface EarningsSummaryResponse {
  totalEarnings: Money;
  pendingEarnings: Money;
  approvedEarnings: Money;
  paidEarnings: Money;
  currentMonthEarnings: Money;
  lastMonthEarnings: Money;
  earningsByType: Record<EarningType, Money>;
  recentEarnings: TrainerEarningsResponse[];
}

/**
 * Request to update earning status (admin only)
 */
export interface UpdateEarningStatusRequest {
  status: EarningStatus;
  paymentDate?: string; // ISO date string
  notes?: string;
}

// ==================== NOTIFICATION MANAGEMENT DTOs ====================

/**
 * Response DTO for trainer notification
 */
export interface TrainerNotificationResponse {
  id: UUID;
  trainerId: UUID;
  notificationType: NotificationType;
  titleEn: string;
  titleAr: string;
  messageEn: string | null;
  messageAr: string | null;
  isRead: boolean;
  relatedEntityId: UUID | null;
  createdAt: string; // ISO datetime string
  readAt: string | null; // ISO datetime string
}

/**
 * Request to mark notifications as read
 */
export interface MarkNotificationsReadRequest {
  notificationIds: UUID[];
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  unreadCount: number;
}

// ==================== SCHEDULE MANAGEMENT DTOs ====================

/**
 * Time slot for availability
 */
export interface TimeSlot {
  start: string; // "HH:mm" format
  end: string; // "HH:mm" format
}

/**
 * Weekly availability pattern
 */
export interface Availability {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

/**
 * Availability response
 */
export interface AvailabilityResponse {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

/**
 * Response DTO for upcoming session
 */
export interface UpcomingSessionResponse {
  sessionId: UUID;
  sessionType: "PT" | "CLASS";
  sessionDate: string; // ISO date string
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
  clientName: string | null;
  className: string | null;
  location: string | null;
  status: string;
}

/**
 * Response DTO for trainer schedule
 */
export interface TrainerScheduleResponse {
  trainerId: UUID;
  availability: AvailabilityResponse | null;
  upcomingSessions: UpcomingSessionResponse[];
  unavailableDates: string[]; // ISO date strings
}

/**
 * Request to update trainer availability
 */
export interface UpdateAvailabilityRequest {
  availability: Availability;
}

// ==================== CERTIFICATION MANAGEMENT DTOs ====================

/**
 * Response DTO for trainer certification
 */
export interface TrainerCertificationResponse {
  id: UUID;
  trainerId: UUID;
  nameEn: string;
  nameAr: string;
  issuingOrganization: string;
  issuedDate: string | null; // ISO date string
  expiryDate: string | null; // ISO date string
  certificateNumber: string | null;
  certificateFileUrl: string | null;
  status: CertificationStatus;
  isVerified: boolean;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

/**
 * Request to create a certification
 */
export interface CreateCertificationRequest {
  nameEn: string;
  nameAr: string;
  issuingOrganization: string;
  issuedDate?: string; // ISO date string
  expiryDate?: string; // ISO date string
  certificateNumber?: string;
  certificateFileUrl?: string;
}

/**
 * Request to update a certification
 */
export interface UpdateCertificationRequest {
  nameEn?: string;
  nameAr?: string;
  issuingOrganization?: string;
  issuedDate?: string; // ISO date string
  expiryDate?: string; // ISO date string
  certificateNumber?: string;
  certificateFileUrl?: string;
  status?: CertificationStatus;
}

// ==================== DASHBOARD DTOs ====================

/**
 * Dashboard overview section
 */
export interface DashboardOverviewResponse {
  trainerName: string;
  trainerStatus: TrainerStatus;
  profileImageUrl: string | null;
  trainerType: TrainerType;
  specializations: string[];
}

/**
 * Schedule summary section
 */
export interface ScheduleSummaryResponse {
  todaysSessions: number;
  upcomingSessions: number;
  completedThisMonth: number;
  nextSession: UpcomingSessionResponse | null;
}

/**
 * Clients summary section
 */
export interface ClientsSummaryResponse {
  totalClients: number;
  activeClients: number;
  newThisMonth: number;
}

/**
 * Notifications summary section
 */
export interface NotificationsSummaryResponse {
  unreadCount: number;
  totalCount: number;
  recent: TrainerNotificationResponse[];
}

/**
 * Complete trainer dashboard response
 */
export interface TrainerDashboardResponse {
  trainerId: UUID;
  overview: DashboardOverviewResponse;
  earnings: EarningsSummaryResponse;
  schedule: ScheduleSummaryResponse;
  clients: ClientsSummaryResponse;
  notifications: NotificationsSummaryResponse;
}

// ==================== QUERY PARAMS ====================

/**
 * Query parameters for trainer clients list
 */
export interface TrainerClientsQueryParams {
  trainerId?: UUID;
  status?: TrainerClientStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

/**
 * Query parameters for trainer earnings list
 */
export interface TrainerEarningsQueryParams {
  trainerId?: UUID;
  status?: EarningStatus;
  earningType?: EarningType;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

/**
 * Query parameters for trainer notifications list
 */
export interface TrainerNotificationsQueryParams {
  trainerId?: UUID;
  isRead?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

/**
 * Query parameters for upcoming sessions
 */
export interface UpcomingSessionsQueryParams {
  trainerId?: UUID;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  limit?: number;
}
