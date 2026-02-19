import type { UUID, LocalizedText } from "./api";
import type { Gender } from "./member";

// Re-export Gender for convenience
export type { Gender };

/**
 * Trainer employment type
 */
export type TrainerEmploymentType =
  | "EMPLOYEE"
  | "INDEPENDENT_CONTRACTOR"
  | "FREELANCE";

/**
 * Trainer type (specialization)
 */
export type TrainerType =
  | "PERSONAL_TRAINER"
  | "GROUP_FITNESS"
  | "SPECIALIST"
  | "HYBRID";

/**
 * Trainer status
 */
export type TrainerStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "ON_LEAVE"
  | "TERMINATED";

/**
 * Compensation model
 */
export type CompensationModel =
  | "HOURLY"
  | "PER_SESSION"
  | "REVENUE_SHARE"
  | "SALARY_PLUS_COMMISSION";

/**
 * Club assignment status
 */
export type AssignmentStatus = "ACTIVE" | "INACTIVE";

/**
 * Certification data
 */
export interface Certification {
  name: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
}

/**
 * Time slot for availability
 */
export interface TimeSlot {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
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
 * Trainer skill summary (category the trainer can teach)
 */
export interface TrainerSkillSummary {
  categoryId: UUID;
  categoryName?: LocalizedText;
  colorCode?: string;
  icon?: string;
}

/**
 * Request to update trainer skills
 */
export interface UpdateTrainerSkillsRequest {
  categoryIds: UUID[];
}

/**
 * Trainer entity (full response)
 */
export interface Trainer {
  id: UUID;
  userId: UUID | null;
  organizationId: UUID;
  // Basic Info
  displayName?: LocalizedText;
  dateOfBirth?: string; // ISO date string
  gender?: Gender;
  age?: number; // Calculated by backend
  // User info (populated by controller)
  userName?: string;
  userEmail?: string;
  // Profile
  bio?: LocalizedText;
  profileImageUrl?: string;
  experienceYears?: number;
  employmentType: TrainerEmploymentType;
  trainerType: TrainerType;
  specializations: string[];
  certifications: Certification[];
  availability?: Availability;
  hourlyRate?: number;
  ptSessionRate?: number;
  compensationModel?: CompensationModel;
  status: TrainerStatus;
  phone?: string;
  notes?: LocalizedText;
  skills?: TrainerSkillSummary[];
  assignedClubs?: TrainerClubAssignment[];
  // PT fields
  homeServiceAvailable?: boolean;
  travelFeeAmount?: number;
  travelFeeCurrency?: string;
  travelRadiusKm?: number;
  maxConcurrentClients?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Trainer summary (for lists)
 */
export interface TrainerSummary {
  id: UUID;
  userId: UUID | null;
  displayName?: LocalizedText;
  userName?: string;
  userEmail?: string;
  profileImageUrl?: string;
  trainerType: TrainerType;
  specializations: string[];
  skills?: TrainerSkillSummary[];
  status: TrainerStatus;
  ptSessionRate?: number;
  createdAt: string;
}

/**
 * Trainer club assignment
 */
export interface TrainerClubAssignment {
  id: UUID;
  trainerId: UUID;
  clubId: UUID;
  clubName?: LocalizedText;
  isPrimary: boolean;
  status: AssignmentStatus;
  createdAt: string;
}

/**
 * Create trainer request
 */
/**
 * Reset trainer password request (admin action)
 */
export interface ResetTrainerPasswordRequest {
  newPassword: string;
}

/**
 * Create trainer request
 */
export interface CreateTrainerRequest {
  userId?: UUID | null;
  // Account creation fields (alternative to userId)
  email?: string;
  password?: string;
  organizationId: UUID;
  // Basic Info
  displayName?: {
    en?: string;
    ar?: string;
  };
  dateOfBirth?: string; // ISO date string
  gender?: Gender;
  // Profile
  bio?: {
    en?: string;
    ar?: string;
  };
  profileImageUrl?: string;
  experienceYears?: number;
  employmentType?: TrainerEmploymentType;
  trainerType?: TrainerType;
  specializations?: string[];
  certifications?: Certification[];
  availability?: Availability;
  hourlyRate?: number;
  ptSessionRate?: number;
  compensationModel?: CompensationModel;
  phone?: string;
  notes?: {
    en?: string;
    ar?: string;
  };
  // Skills
  skillCategoryIds?: UUID[];
  // PT fields
  homeServiceAvailable?: boolean;
  travelFeeAmount?: number;
  travelFeeCurrency?: string;
  travelRadiusKm?: number;
  maxConcurrentClients?: number;
}

/**
 * Update trainer profile request
 */
export interface UpdateTrainerProfileRequest {
  bio?: {
    en?: string;
    ar?: string;
  };
  profileImageUrl?: string;
  experienceYears?: number;
  employmentType?: TrainerEmploymentType;
  trainerType?: TrainerType;
  specializations?: string[];
  certifications?: Certification[];
  hourlyRate?: number;
  ptSessionRate?: number;
  compensationModel?: CompensationModel;
  phone?: string;
  notes?: {
    en?: string;
    ar?: string;
  };
  // PT fields
  homeServiceAvailable?: boolean;
  travelFeeAmount?: number;
  travelFeeCurrency?: string;
  travelRadiusKm?: number;
  maxConcurrentClients?: number;
}

/**
 * Update trainer basic info request
 */
export interface UpdateTrainerBasicInfoRequest {
  displayName?: {
    en?: string;
    ar?: string;
  };
  dateOfBirth?: string; // ISO date string
  gender?: Gender;
}

/**
 * Update trainer availability request
 */
export interface UpdateAvailabilityRequest {
  availability: Availability;
}

/**
 * Assign trainer to club request
 */
export interface AssignTrainerToClubRequest {
  clubId: UUID;
  isPrimary?: boolean;
}

/**
 * Trainer query params
 */
export interface TrainerQueryParams {
  status?: TrainerStatus;
  trainerType?: TrainerType;
  employmentType?: TrainerEmploymentType;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

/**
 * Available time slot for booking
 */
export interface AvailableTimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}
