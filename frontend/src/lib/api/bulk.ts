import { api } from "./client";
import type { UUID } from "@/types/api";
import type {
  BulkOperationResponse,
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

// Member bulk operations
export async function bulkMemberStatus(
  data: BulkMemberStatusRequest
): Promise<BulkOperationResponse> {
  return api.post("api/members/bulk/status", { json: data }).json();
}

export async function bulkMemberDelete(
  data: BulkMemberDeleteRequest
): Promise<BulkOperationResponse> {
  return api.post("api/members/bulk/delete", { json: data }).json();
}

// Subscription bulk operations
export async function bulkSubscriptionStatus(
  data: BulkSubscriptionStatusRequest
): Promise<BulkOperationResponse> {
  return api.post("api/subscriptions/bulk/status", { json: data }).json();
}

export async function bulkSubscriptionRenew(
  data: BulkSubscriptionRenewRequest
): Promise<BulkOperationResponse> {
  return api.post("api/subscriptions/bulk/renew", { json: data }).json();
}

// Invoice bulk operations
export async function bulkInvoiceStatus(
  data: BulkInvoiceStatusRequest
): Promise<BulkOperationResponse> {
  return api.post("api/invoices/bulk/status", { json: data }).json();
}

export async function bulkRecordPayments(
  data: BulkRecordPaymentRequest
): Promise<BulkOperationResponse> {
  return api.post("api/invoices/bulk/pay", { json: data }).json();
}

export async function bulkCreateInvoicesFromSubscriptions(
  subscriptionIds: UUID[]
): Promise<BulkOperationResponse> {
  return api
    .post("api/invoices/bulk/from-subscriptions", {
      json: { subscriptionIds },
    })
    .json();
}

// Attendance bulk operations
export async function bulkCheckIn(
  data: BulkCheckInRequest
): Promise<BulkOperationResponse> {
  return api.post("api/attendance/bulk/check-in", { json: data }).json();
}

export async function bulkCheckOut(
  data: BulkCheckOutRequest
): Promise<BulkOperationResponse> {
  return api.post("api/attendance/bulk/check-out", { json: data }).json();
}

// Booking bulk operations
export async function bulkCreateBookings(
  data: BulkCreateBookingsRequest
): Promise<BulkOperationResponse> {
  return api.post("api/bookings/bulk/create", { json: data }).json();
}

export async function bulkCancelBookings(
  data: BulkCancelBookingsRequest
): Promise<BulkOperationResponse> {
  return api.post("api/bookings/bulk/cancel", { json: data }).json();
}

export async function bulkCheckInBookings(
  bookingIds: UUID[]
): Promise<BulkOperationResponse> {
  return api
    .post("api/bookings/bulk/check-in", { json: { bookingIds } })
    .json();
}
