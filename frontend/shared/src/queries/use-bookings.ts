"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getBookings,
  getBooking,
  createBooking,
  cancelBooking,
  checkInBooking,
  markNoShow,
  getMemberBookings,
  getMemberUpcomingBookings,
  getSessionBookings,
  bulkCreateBookings,
  bulkCancelBookings,
  bulkCheckInBookings,
} from "../lib/api/bookings";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  Booking,
  BookingQueryParams,
  CreateBookingRequest,
} from "../types/scheduling";
import { classSessionKeys } from "./use-classes";
import { memberKeys } from "./use-members";

// Query keys
export const bookingKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: (params: BookingQueryParams) => [...bookingKeys.lists(), params] as const,
  details: () => [...bookingKeys.all, "detail"] as const,
  detail: (id: UUID) => [...bookingKeys.details(), id] as const,
  member: (memberId: UUID) => [...bookingKeys.all, "member", memberId] as const,
  memberUpcoming: (memberId: UUID) =>
    [...bookingKeys.all, "member", memberId, "upcoming"] as const,
};

/**
 * Hook to fetch paginated bookings
 */
export function useBookings(
  params: BookingQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Booking>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () => getBookings(params),
    ...options,
  });
}

/**
 * Hook to fetch a single booking by ID
 */
export function useBooking(
  id: UUID,
  options?: Omit<UseQueryOptions<Booking>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => getBooking(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch member's bookings
 */
export function useMemberBookings(
  memberId: UUID,
  params: Omit<BookingQueryParams, "memberId"> = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Booking>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: bookingKeys.member(memberId),
    queryFn: () => getMemberBookings(memberId, params),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to fetch member's upcoming bookings
 */
export function useMemberUpcomingBookings(
  memberId: UUID,
  options?: Omit<UseQueryOptions<Booking[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: bookingKeys.memberUpcoming(memberId),
    queryFn: () => getMemberUpcomingBookings(memberId),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to fetch bookings for a session
 */
export function useSessionBookings(
  sessionId: UUID,
  options?: Omit<UseQueryOptions<Booking[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...bookingKeys.all, "session", sessionId],
    queryFn: () => getSessionBookings(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

/**
 * Hook to create a booking
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingRequest) => createBooking(data),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.member(booking.memberId),
      });
      queryClient.invalidateQueries({
        queryKey: classSessionKeys.detail(booking.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.all,
      });
      // Invalidate session lists to update booked count
      queryClient.invalidateQueries({ queryKey: classSessionKeys.lists() });
    },
  });
}

/**
 * Hook to cancel a booking
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => cancelBooking(id),
    onSuccess: (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.member(booking.memberId),
      });
      queryClient.invalidateQueries({
        queryKey: classSessionKeys.detail(booking.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.all,
      });
      queryClient.invalidateQueries({ queryKey: classSessionKeys.lists() });
    },
  });
}

/**
 * Hook to check in to a booking
 */
export function useCheckInBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => checkInBooking(id),
    onSuccess: (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.member(booking.memberId),
      });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.all,
      });
      // Also invalidate member details (subscription classes might change)
      queryClient.invalidateQueries({
        queryKey: memberKeys.detail(booking.memberId),
      });
    },
  });
}

/**
 * Hook to mark a booking as no-show
 */
export function useMarkNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => markNoShow(id),
    onSuccess: (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.member(booking.memberId),
      });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.all,
      });
    },
  });
}

/**
 * Hook for bulk create bookings
 */
export function useBulkCreateBookings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookings: CreateBookingRequest[]) =>
      bulkCreateBookings(bookings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      queryClient.invalidateQueries({ queryKey: classSessionKeys.all });
    },
  });
}

/**
 * Hook for bulk cancel bookings
 */
export function useBulkCancelBookings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: UUID[]) => bulkCancelBookings(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      queryClient.invalidateQueries({ queryKey: classSessionKeys.all });
    },
  });
}

/**
 * Hook for bulk check-in bookings
 */
export function useBulkCheckInBookings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: UUID[]) => bulkCheckInBookings(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      queryClient.invalidateQueries({ queryKey: classSessionKeys.all });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}
