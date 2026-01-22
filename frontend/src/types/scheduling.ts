import type { UUID, LocalizedText, ListQueryParams } from "./api";

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
 * Class schedule for recurring classes
 */
export interface ClassSchedule {
  id: UUID;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

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

