"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bulkMemberStatus,
  bulkMemberDelete,
  bulkSubscriptionStatus,
  bulkSubscriptionRenew,
  bulkInvoiceStatus,
  bulkRecordPayments,
  bulkCreateInvoicesFromSubscriptions,
  bulkCheckIn,
  bulkCheckOut,
  bulkCreateBookings,
  bulkCancelBookings,
  bulkCheckInBookings,
} from "@/lib/api/bulk";
import type {
  BulkMemberStatusRequest,
  BulkMemberDeleteRequest,
  BulkSubscriptionStatusRequest,
  BulkSubscriptionRenewRequest,
  BulkInvoiceStatusRequest,
  BulkRecordPaymentRequest,
  BulkCheckInRequest,
  BulkCheckOutRequest,
  BulkCreateBookingsRequest,
  BulkCancelBookingsRequest,
} from "@/types/bulk";
import type { UUID } from "@/types/api";
import { memberKeys } from "./use-members";
import { subscriptionKeys } from "./use-subscriptions";
import { invoiceKeys } from "./use-invoices";
import { attendanceKeys } from "./use-attendance";
import { bookingKeys } from "./use-bookings";

// Member bulk mutations
export function useBulkMemberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkMemberStatusRequest) => bulkMemberStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

export function useBulkMemberDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkMemberDeleteRequest) => bulkMemberDelete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

// Subscription bulk mutations
export function useBulkSubscriptionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkSubscriptionStatusRequest) =>
      bulkSubscriptionStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useBulkSubscriptionRenew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkSubscriptionRenewRequest) =>
      bulkSubscriptionRenew(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

// Invoice bulk mutations
export function useBulkInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkInvoiceStatusRequest) => bulkInvoiceStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

export function useBulkRecordPayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkRecordPaymentRequest) => bulkRecordPayments(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

export function useBulkCreateInvoicesFromSubscriptions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionIds: UUID[]) =>
      bulkCreateInvoicesFromSubscriptions(subscriptionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

// Attendance bulk mutations
export function useBulkCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCheckInRequest) => bulkCheckIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useBulkCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCheckOutRequest) => bulkCheckOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

// Booking bulk mutations
export function useBulkCreateBookings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCreateBookingsRequest) => bulkCreateBookings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useBulkCancelBookings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCancelBookingsRequest) => bulkCancelBookings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useBulkCheckInBookings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingIds: UUID[]) => bulkCheckInBookings(bookingIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}
