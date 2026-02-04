"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  initiatePayment,
  verifyPayment,
  getInvoicePaymentStatus,
} from "../lib/api/payments";
import type { UUID } from "../types/api";
import type { PaymentVerification } from "../types/payment";
import { invoiceKeys } from "./use-invoices";
import { meKeys } from "./use-me";

// Query keys
export const paymentKeys = {
  all: ["payments"] as const,
  verification: (transactionRef: string) =>
    [...paymentKeys.all, "verify", transactionRef] as const,
  invoiceStatus: (invoiceId: UUID) =>
    [...paymentKeys.all, "invoice", invoiceId] as const,
};

/**
 * Hook to initiate a payment for an invoice
 */
export function useInitiatePayment() {
  return useMutation({
    mutationFn: (invoiceId: UUID) => initiatePayment(invoiceId),
  });
}

/**
 * Hook to verify payment status
 */
export function useVerifyPayment(
  transactionRef: string,
  options?: Omit<
    UseQueryOptions<PaymentVerification>,
    "queryKey" | "queryFn"
  >
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: paymentKeys.verification(transactionRef),
    queryFn: () => verifyPayment(transactionRef),
    enabled: !!transactionRef,
    // Refetch to poll for payment completion
    refetchInterval: (query) => {
      const data = query.state.data;
      if (
        data?.status === "COMPLETED" ||
        data?.status === "FAILED" ||
        data?.status === "CANCELLED"
      ) {
        // Stop polling when payment is finalized
        // Also invalidate related queries
        queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
        queryClient.invalidateQueries({ queryKey: meKeys.invoices() });
        return false;
      }
      // Poll every 3 seconds while pending/processing
      return 3000;
    },
    ...options,
  });
}

/**
 * Hook to get payment status for an invoice
 */
export function useInvoicePaymentStatus(
  invoiceId: UUID,
  options?: Omit<
    UseQueryOptions<PaymentVerification>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: paymentKeys.invoiceStatus(invoiceId),
    queryFn: () => getInvoicePaymentStatus(invoiceId),
    enabled: !!invoiceId,
    ...options,
  });
}
