import type { UUID, LocalizedText, PaginatedResponse } from "./api";

export type FacilityType =
  | "SWIMMING_POOL"
  | "TENNIS_COURT"
  | "SQUASH_COURT"
  | "SAUNA"
  | "STEAM_ROOM"
  | "JACUZZI"
  | "MASSAGE_ROOM"
  | "PRIVATE_STUDIO"
  | "BASKETBALL_COURT"
  | "PADEL_COURT"
  | "OTHER";

export type FacilityStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type SlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED" | "MAINTENANCE";
export type BookingStatus = "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type GenderRestriction = "MALE_ONLY" | "FEMALE_ONLY" | "NONE";

export interface Facility {
  id: UUID;
  locationId: UUID;
  name: LocalizedText;
  description: LocalizedText | null;
  type: FacilityType;
  capacity: number;
  hourlyRate: number | null;
  hourlyRateCurrency: string;
  requiresSubscription: boolean;
  bookingWindowDays: number;
  minBookingMinutes: number;
  maxBookingMinutes: number;
  bufferMinutes: number;
  genderRestriction: GenderRestriction | null;
  imageUrl: string | null;
  status: FacilityStatus;
  operatingHours: OperatingHours[];
  createdAt: string;
  updatedAt: string;
}

export interface OperatingHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface FacilitySlot {
  id: UUID;
  facilityId: UUID;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  booking?: {
    id: UUID;
    memberId: UUID;
  };
}

export interface FacilityBooking {
  id: UUID;
  facilityId: UUID;
  slotId: UUID;
  memberId: UUID;
  status: BookingStatus;
  notes: string | null;
  bookedAt: string;
  checkedInAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface CreateFacilityRequest {
  locationId: UUID;
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type: FacilityType;
  capacity?: number;
  hourlyRate?: number;
  hourlyRateCurrency?: string;
  requiresSubscription?: boolean;
  bookingWindowDays?: number;
  minBookingMinutes?: number;
  maxBookingMinutes?: number;
  bufferMinutes?: number;
  genderRestriction?: GenderRestriction;
  imageUrl?: string;
  operatingHours?: OperatingHoursInput[];
}

export interface UpdateFacilityRequest {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type?: FacilityType;
  capacity?: number;
  hourlyRate?: number;
  hourlyRateCurrency?: string;
  requiresSubscription?: boolean;
  bookingWindowDays?: number;
  minBookingMinutes?: number;
  maxBookingMinutes?: number;
  bufferMinutes?: number;
  genderRestriction?: GenderRestriction;
  imageUrl?: string;
  operatingHours?: OperatingHoursInput[];
}

export interface OperatingHoursInput {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
}

export interface GenerateSlotsRequest {
  startDate: string;
  endDate: string;
}

export interface CreateBookingRequest {
  slotId: UUID;
  memberId: UUID;
  notes?: string;
}

export interface CancelBookingRequest {
  reason?: string;
}

// Query params
export interface FacilityQueryParams {
  locationId?: UUID;
  page?: number;
  size?: number;
}

export interface SlotQueryParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  availableOnly?: boolean;
}

export interface BookingQueryParams {
  page?: number;
  size?: number;
  upcomingOnly?: boolean;
}

// Paginated types
export type PaginatedFacilities = PaginatedResponse<Facility>;
export type PaginatedBookings = PaginatedResponse<FacilityBooking>;
