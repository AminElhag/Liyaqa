import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMemberClasses,
  getMemberTimetable,
  getMemberSessions,
  getBookingOptions,
  bookSession,
  cancelBooking,
  getMyBookings,
  getMyClassPackBalances,
} from "@/lib/api/member-classes";
import type { UUID } from "@/types/api";
import type { BookingPaymentSource } from "@/types/scheduling";

// Query keys
export const memberClassKeys = {
  all: ["member-classes"] as const,
  classes: () => [...memberClassKeys.all, "classes"] as const,
  classList: (params: Record<string, unknown>) =>
    [...memberClassKeys.classes(), params] as const,
  timetable: (date: string) => [...memberClassKeys.all, "timetable", date] as const,
  sessions: (params: Record<string, unknown>) =>
    [...memberClassKeys.all, "sessions", params] as const,
  bookingOptions: (sessionId: UUID) =>
    [...memberClassKeys.all, "booking-options", sessionId] as const,
  bookings: () => [...memberClassKeys.all, "bookings"] as const,
  bookingsList: (params: Record<string, unknown>) =>
    [...memberClassKeys.bookings(), params] as const,
  myPacks: () => [...memberClassKeys.all, "my-packs"] as const,
};

/**
 * Hook to fetch classes available for members
 */
export function useMemberClasses(params: {
  page?: number;
  size?: number;
  classType?: string;
  difficultyLevel?: string;
} = {}) {
  return useQuery({
    queryKey: memberClassKeys.classList(params),
    queryFn: () => getMemberClasses(params),
  });
}

/**
 * Hook to fetch weekly timetable
 */
export function useMemberTimetable(date: string) {
  return useQuery({
    queryKey: memberClassKeys.timetable(date),
    queryFn: () => getMemberTimetable(date),
    enabled: !!date,
  });
}

/**
 * Hook to fetch sessions in a date range
 */
export function useMemberSessions(params: {
  from: string;
  to: string;
  classId?: UUID;
}) {
  return useQuery({
    queryKey: memberClassKeys.sessions(params),
    queryFn: () => getMemberSessions(params),
    enabled: !!(params.from && params.to),
  });
}

/**
 * Hook to fetch booking options for a session
 */
export function useBookingOptions(sessionId: UUID | null) {
  return useQuery({
    queryKey: memberClassKeys.bookingOptions(sessionId || ""),
    queryFn: () => getBookingOptions(sessionId!),
    enabled: !!sessionId,
  });
}

/**
 * Hook to book a session
 */
export function useBookClassSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      sessionId: UUID;
      paymentSource: BookingPaymentSource;
      classPackBalanceId?: UUID;
    }) => bookSession(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberClassKeys.all });
    },
  });
}

/**
 * Hook to cancel a booking
 */
export function useCancelClassBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: UUID) => cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberClassKeys.bookings() });
    },
  });
}

/**
 * Hook to fetch my bookings
 */
export function useMyClassBookings(params: {
  page?: number;
  size?: number;
  status?: string;
  upcoming?: boolean;
} = {}) {
  return useQuery({
    queryKey: memberClassKeys.bookingsList(params),
    queryFn: () => getMyBookings(params),
  });
}

/**
 * Hook to fetch my class pack balances
 */
export function useMyClassPackBalances() {
  return useQuery({
    queryKey: memberClassKeys.myPacks(),
    queryFn: getMyClassPackBalances,
  });
}
