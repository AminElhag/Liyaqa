import { api } from "./client";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  GymClass,
  ClassSession,
  Booking,
  BookingOptionsResponse,
  BookingPaymentSource,
  MemberClassPackBalance,
} from "../types/scheduling";

/**
 * Get active classes available for members
 */
export async function getMemberClasses(params: {
  page?: number;
  size?: number;
  classType?: string;
  difficultyLevel?: string;
} = {}): Promise<PaginatedResponse<GymClass>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.classType) searchParams.set("classType", params.classType);
  if (params.difficultyLevel) searchParams.set("difficultyLevel", params.difficultyLevel);

  const queryString = searchParams.toString();
  const url = queryString ? `api/me/classes?${queryString}` : "api/me/classes";

  return api.get(url).json();
}

/**
 * Get weekly timetable for members
 */
export async function getMemberTimetable(date: string): Promise<ClassSession[]> {
  return api.get(`api/me/timetable?date=${date}`).json();
}

/**
 * Get available sessions in a date range
 */
export async function getMemberSessions(params: {
  from: string;
  to: string;
  classId?: UUID;
}): Promise<ClassSession[]> {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  });

  if (params.classId) searchParams.set("classId", params.classId);

  return api.get(`api/me/sessions?${searchParams.toString()}`).json();
}

/**
 * Get booking options for a session
 */
export async function getBookingOptions(sessionId: UUID): Promise<BookingOptionsResponse> {
  return api.get(`api/me/sessions/${sessionId}/booking-options`).json();
}

/**
 * Book a session
 */
export async function bookSession(params: {
  sessionId: UUID;
  paymentSource: BookingPaymentSource;
  classPackBalanceId?: UUID;
}): Promise<Booking> {
  return api
    .post(`api/me/sessions/${params.sessionId}/book`, {
      json: {
        paymentSource: params.paymentSource,
        classPackBalanceId: params.classPackBalanceId,
      },
    })
    .json();
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: UUID): Promise<Booking> {
  return api.post(`api/me/bookings/${bookingId}/cancel`).json();
}

/**
 * Get my bookings
 */
export async function getMyBookings(params: {
  page?: number;
  size?: number;
  status?: string;
  upcoming?: boolean;
} = {}): Promise<PaginatedResponse<Booking>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.status) searchParams.set("status", params.status);
  if (params.upcoming !== undefined) searchParams.set("upcoming", String(params.upcoming));

  const queryString = searchParams.toString();
  const url = queryString ? `api/me/bookings?${queryString}` : "api/me/bookings";

  return api.get(url).json();
}

/**
 * Get my class pack balances
 */
export async function getMyClassPackBalances(): Promise<MemberClassPackBalance[]> {
  return api.get("api/me/class-packs").json();
}
