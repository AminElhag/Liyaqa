import { api } from "./client";
import type { UUID } from "../../types/api";
import type {
  Facility,
  FacilitySlot,
  FacilityBooking,
  CreateFacilityRequest,
  UpdateFacilityRequest,
  GenerateSlotsRequest,
  CreateBookingRequest,
  CancelBookingRequest,
  FacilityQueryParams,
  SlotQueryParams,
  BookingQueryParams,
  PaginatedFacilities,
  PaginatedBookings,
} from "../../types/facility";

const FACILITIES_ENDPOINT = "api/facilities";

// ========== Facilities ==========

function buildFacilityQueryString(params: FacilityQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.locationId) searchParams.set("locationId", params.locationId);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  return searchParams.toString();
}

export async function getFacilities(
  params: FacilityQueryParams = {}
): Promise<PaginatedFacilities> {
  const query = buildFacilityQueryString(params);
  const url = query ? `${FACILITIES_ENDPOINT}?${query}` : FACILITIES_ENDPOINT;
  return api.get(url).json();
}

export async function getFacility(id: UUID): Promise<Facility> {
  return api.get(`${FACILITIES_ENDPOINT}/${id}`).json();
}

export async function createFacility(
  data: CreateFacilityRequest
): Promise<Facility> {
  return api.post(FACILITIES_ENDPOINT, { json: data }).json();
}

export async function updateFacility(
  id: UUID,
  data: UpdateFacilityRequest
): Promise<Facility> {
  return api.put(`${FACILITIES_ENDPOINT}/${id}`, { json: data }).json();
}

export async function deleteFacility(id: UUID): Promise<void> {
  await api.delete(`${FACILITIES_ENDPOINT}/${id}`);
}

export async function activateFacility(id: UUID): Promise<Facility> {
  return api.post(`${FACILITIES_ENDPOINT}/${id}/activate`).json();
}

export async function deactivateFacility(id: UUID): Promise<Facility> {
  return api.post(`${FACILITIES_ENDPOINT}/${id}/deactivate`).json();
}

// ========== Slots ==========

export async function generateSlots(
  facilityId: UUID,
  data: GenerateSlotsRequest
): Promise<FacilitySlot[]> {
  return api
    .post(`${FACILITIES_ENDPOINT}/${facilityId}/slots/generate`, { json: data })
    .json();
}

function buildSlotQueryString(params: SlotQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.date) searchParams.set("date", params.date);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.availableOnly !== undefined)
    searchParams.set("availableOnly", String(params.availableOnly));
  return searchParams.toString();
}

export async function getFacilitySlots(
  facilityId: UUID,
  params: SlotQueryParams = {}
): Promise<FacilitySlot[]> {
  const query = buildSlotQueryString(params);
  const url = query
    ? `${FACILITIES_ENDPOINT}/${facilityId}/slots?${query}`
    : `${FACILITIES_ENDPOINT}/${facilityId}/slots`;
  return api.get(url).json();
}

// ========== Bookings ==========

export async function createBooking(
  facilityId: UUID,
  data: CreateBookingRequest
): Promise<FacilityBooking> {
  return api
    .post(`${FACILITIES_ENDPOINT}/${facilityId}/bookings`, { json: data })
    .json();
}

export async function getFacilityBookings(
  facilityId: UUID,
  params: BookingQueryParams = {}
): Promise<PaginatedBookings> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query
    ? `${FACILITIES_ENDPOINT}/${facilityId}/bookings?${query}`
    : `${FACILITIES_ENDPOINT}/${facilityId}/bookings`;
  return api.get(url).json();
}

export async function getBooking(id: UUID): Promise<FacilityBooking> {
  return api.get(`api/facility-bookings/${id}`).json();
}

export async function getMemberFacilityBookings(
  memberId: UUID,
  params: BookingQueryParams = {}
): Promise<PaginatedBookings> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.upcomingOnly !== undefined)
    searchParams.set("upcomingOnly", String(params.upcomingOnly));

  const query = searchParams.toString();
  const url = query
    ? `api/members/${memberId}/facility-bookings?${query}`
    : `api/members/${memberId}/facility-bookings`;
  return api.get(url).json();
}

export async function checkInBooking(id: UUID): Promise<FacilityBooking> {
  return api.post(`api/facility-bookings/${id}/check-in`).json();
}

export async function completeBooking(id: UUID): Promise<FacilityBooking> {
  return api.post(`api/facility-bookings/${id}/complete`).json();
}

export async function cancelBooking(
  id: UUID,
  data?: CancelBookingRequest
): Promise<FacilityBooking> {
  return api.post(`api/facility-bookings/${id}/cancel`, { json: data || {} }).json();
}

export async function markNoShow(id: UUID): Promise<FacilityBooking> {
  return api.post(`api/facility-bookings/${id}/no-show`).json();
}
