import { api } from "./client";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  Booking,
  BookingQueryParams,
  CreateBookingRequest,
} from "@/types/scheduling";

/**
 * Get paginated bookings
 */
export async function getBookings(
  params: BookingQueryParams = {}
): Promise<PaginatedResponse<Booking>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sessionId) searchParams.set("sessionId", params.sessionId);
  if (params.memberId) searchParams.set("memberId", params.memberId);
  if (params.status) searchParams.set("status", params.status);
  if (params.date) searchParams.set("date", params.date);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.direction) searchParams.set("direction", params.direction);

  const queryString = searchParams.toString();
  const url = queryString ? `api/bookings?${queryString}` : "api/bookings";

  return api.get(url).json();
}

/**
 * Get a single booking by ID
 */
export async function getBooking(id: UUID): Promise<Booking> {
  return api.get(`api/bookings/${id}`).json();
}

/**
 * Create a new booking
 */
export async function createBooking(
  data: CreateBookingRequest
): Promise<Booking> {
  return api.post("api/bookings", { json: data }).json();
}

/**
 * Cancel a booking
 */
export async function cancelBooking(id: UUID): Promise<Booking> {
  return api.post(`api/bookings/${id}/cancel`).json();
}

/**
 * Check in to a booking
 */
export async function checkInBooking(id: UUID): Promise<Booking> {
  return api.post(`api/bookings/${id}/check-in`).json();
}

/**
 * Mark booking as no-show
 */
export async function markNoShow(id: UUID): Promise<Booking> {
  return api.post(`api/bookings/${id}/no-show`).json();
}

/**
 * Get member's bookings
 */
export async function getMemberBookings(
  memberId: UUID,
  params: Omit<BookingQueryParams, "memberId"> = {}
): Promise<PaginatedResponse<Booking>> {
  return getBookings({ ...params, memberId });
}

/**
 * Get upcoming member bookings
 */
export async function getMemberUpcomingBookings(
  memberId: UUID
): Promise<Booking[]> {
  const today = new Date().toISOString().split("T")[0];
  const response = await getBookings({
    memberId,
    dateFrom: today,
    status: "CONFIRMED",
    size: 10,
  });
  return response.content;
}

/**
 * Get bookings for a session
 */
export async function getSessionBookings(sessionId: UUID): Promise<Booking[]> {
  return api.get(`api/bookings/session/${sessionId}`).json();
}

/**
 * Bulk create bookings
 */
export async function bulkCreateBookings(
  bookings: CreateBookingRequest[]
): Promise<{
  successCount: number;
  failureCount: number;
  failures: Array<{ memberId: UUID; sessionId: UUID; reason: string }>;
}> {
  return api.post("api/bookings/bulk", { json: { bookings } }).json();
}

/**
 * Bulk cancel bookings
 */
export async function bulkCancelBookings(ids: UUID[]): Promise<{
  successCount: number;
  failureCount: number;
  failures: Array<{ id: UUID; reason: string }>;
}> {
  return api.post("api/bookings/bulk/cancel", { json: { ids } }).json();
}

/**
 * Bulk check-in bookings
 */
export async function bulkCheckInBookings(ids: UUID[]): Promise<{
  successCount: number;
  failureCount: number;
  failures: Array<{ id: UUID; reason: string }>;
}> {
  return api.post("api/bookings/bulk/check-in", { json: { ids } }).json();
}
