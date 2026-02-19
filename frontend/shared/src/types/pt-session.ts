import type { UUID, LocalizedText } from "./api";

/**
 * Personal training session status
 */
export type PTSessionStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

/**
 * Personal training session (full response)
 */
export interface PTSession {
  id: UUID;
  trainerId: UUID;
  trainerName?: string;
  memberId: UUID;
  memberName?: string;
  memberEmail?: string;
  locationId?: UUID;
  locationName?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: PTSessionStatus;
  price?: number;
  notes?: string;
  cancelledBy?: UUID;
  cancellationReason?: string;
  trainerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * PT session summary (for lists)
 */
export interface PTSessionSummary {
  id: UUID;
  trainerId: UUID;
  trainerName?: string;
  memberId: UUID;
  memberName?: string;
  sessionDate: string;
  startTime: string;
  status: PTSessionStatus;
}

/**
 * Book PT session request (member booking)
 */
export interface BookPTSessionRequest {
  trainerId: UUID;
  sessionDate: string;
  startTime: string;
  durationMinutes?: number;
  locationId?: UUID;
  notes?: string;
}

/**
 * Reschedule PT session request
 */
export interface ReschedulePTSessionRequest {
  newDate: string;
  newStartTime: string;
  newDurationMinutes?: number;
}

/**
 * Cancel PT session request
 */
export interface CancelPTSessionRequest {
  reason?: string;
}

/**
 * Complete PT session request
 */
export interface CompletePTSessionRequest {
  trainerNotes?: string;
}

/**
 * Create trainer session request (trainer-initiated, auto-confirmed)
 */
export interface CreateTrainerSessionRequest {
  memberId: UUID;
  sessionDate: string; // ISO date
  startTime: string; // HH:mm
  durationMinutes?: number;
  locationId?: UUID;
  notes?: string;
}

/**
 * PT session query params
 */
export interface PTSessionQueryParams {
  trainerId?: UUID;
  memberId?: UUID;
  status?: PTSessionStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

/**
 * Available time slot for PT booking
 */
export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}
