"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { UUID } from "../types/api";
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
} from "../types/facility";
import {
  getFacilities,
  getFacility,
  createFacility,
  updateFacility,
  deleteFacility,
  activateFacility,
  deactivateFacility,
  generateSlots,
  getFacilitySlots,
  createBooking,
  getFacilityBookings,
  getBooking,
  getMemberFacilityBookings,
  checkInBooking,
  completeBooking,
  cancelBooking,
  markNoShow,
} from "../lib/api/facilities";

// Query keys
export const facilityKeys = {
  all: ["facilities"] as const,
  lists: () => [...facilityKeys.all, "list"] as const,
  list: (params?: FacilityQueryParams) =>
    [...facilityKeys.lists(), params] as const,
  details: () => [...facilityKeys.all, "detail"] as const,
  detail: (id: UUID) => [...facilityKeys.details(), id] as const,
  slots: (facilityId: UUID, params?: SlotQueryParams) =>
    [...facilityKeys.all, "slots", facilityId, params] as const,
  slotsPrefix: (facilityId: UUID) =>
    [...facilityKeys.all, "slots", facilityId] as const,
  bookings: () => [...facilityKeys.all, "bookings"] as const,
  facilityBookings: (facilityId: UUID, params?: BookingQueryParams) =>
    [...facilityKeys.bookings(), "facility", facilityId, params] as const,
  memberBookings: (memberId: UUID, params?: BookingQueryParams) =>
    [...facilityKeys.bookings(), "member", memberId, params] as const,
  bookingDetail: (id: UUID) => [...facilityKeys.bookings(), id] as const,
};

// ========== Facility Hooks ==========

export function useFacilities(
  params: FacilityQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedFacilities>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: facilityKeys.list(params),
    queryFn: () => getFacilities(params),
    ...options,
  });
}

export function useFacility(
  id: UUID,
  options?: Omit<UseQueryOptions<Facility>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: facilityKeys.detail(id),
    queryFn: () => getFacility(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFacilityRequest) => createFacility(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facilityKeys.lists() });
    },
  });
}

export function useUpdateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateFacilityRequest }) =>
      updateFacility(id, data),
    onSuccess: (updatedFacility) => {
      queryClient.setQueryData(
        facilityKeys.detail(updatedFacility.id),
        updatedFacility
      );
      queryClient.invalidateQueries({ queryKey: facilityKeys.lists() });
    },
  });
}

export function useDeleteFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteFacility(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: facilityKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: facilityKeys.lists() });
    },
  });
}

export function useActivateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateFacility(id),
    onSuccess: (updatedFacility) => {
      queryClient.setQueryData(
        facilityKeys.detail(updatedFacility.id),
        updatedFacility
      );
      queryClient.invalidateQueries({ queryKey: facilityKeys.lists() });
    },
  });
}

export function useDeactivateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateFacility(id),
    onSuccess: (updatedFacility) => {
      queryClient.setQueryData(
        facilityKeys.detail(updatedFacility.id),
        updatedFacility
      );
      queryClient.invalidateQueries({ queryKey: facilityKeys.lists() });
    },
  });
}

// ========== Slot Hooks ==========

export function useFacilitySlots(
  facilityId: UUID,
  params: SlotQueryParams = {},
  options?: Omit<UseQueryOptions<FacilitySlot[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: facilityKeys.slots(facilityId, params),
    queryFn: () => getFacilitySlots(facilityId, params),
    enabled: !!facilityId,
    ...options,
  });
}

export function useGenerateSlots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      facilityId,
      data,
    }: {
      facilityId: UUID;
      data: GenerateSlotsRequest;
    }) => generateSlots(facilityId, data),
    onSuccess: (_, { facilityId }) => {
      queryClient.invalidateQueries({
        queryKey: facilityKeys.slotsPrefix(facilityId),
      });
    },
  });
}

// ========== Booking Hooks ==========

export function useFacilityBookings(
  facilityId: UUID,
  params: BookingQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedBookings>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: facilityKeys.facilityBookings(facilityId, params),
    queryFn: () => getFacilityBookings(facilityId, params),
    enabled: !!facilityId,
    ...options,
  });
}

export function useMemberFacilityBookings(
  memberId: UUID,
  params: BookingQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedBookings>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: facilityKeys.memberBookings(memberId, params),
    queryFn: () => getMemberFacilityBookings(memberId, params),
    enabled: !!memberId,
    ...options,
  });
}

export function useBooking(
  id: UUID,
  options?: Omit<UseQueryOptions<FacilityBooking>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: facilityKeys.bookingDetail(id),
    queryFn: () => getBooking(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      facilityId,
      data,
    }: {
      facilityId: UUID;
      data: CreateBookingRequest;
    }) => createBooking(facilityId, data),
    onSuccess: (_, { facilityId }) => {
      queryClient.invalidateQueries({
        queryKey: facilityKeys.slotsPrefix(facilityId),
      });
      queryClient.invalidateQueries({
        queryKey: facilityKeys.facilityBookings(facilityId),
      });
      queryClient.invalidateQueries({ queryKey: facilityKeys.bookings() });
    },
  });
}

export function useCheckInBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => checkInBooking(id),
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(
        facilityKeys.bookingDetail(updatedBooking.id),
        updatedBooking
      );
      queryClient.invalidateQueries({ queryKey: facilityKeys.bookings() });
    },
  });
}

export function useCompleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => completeBooking(id),
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(
        facilityKeys.bookingDetail(updatedBooking.id),
        updatedBooking
      );
      queryClient.invalidateQueries({ queryKey: facilityKeys.bookings() });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data?: CancelBookingRequest }) =>
      cancelBooking(id, data),
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(
        facilityKeys.bookingDetail(updatedBooking.id),
        updatedBooking
      );
      queryClient.invalidateQueries({ queryKey: facilityKeys.bookings() });
      queryClient.invalidateQueries({
        queryKey: facilityKeys.slotsPrefix(updatedBooking.facilityId),
      });
    },
  });
}

export function useMarkNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => markNoShow(id),
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(
        facilityKeys.bookingDetail(updatedBooking.id),
        updatedBooking
      );
      queryClient.invalidateQueries({ queryKey: facilityKeys.bookings() });
    },
  });
}
