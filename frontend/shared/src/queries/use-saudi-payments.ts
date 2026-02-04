/**
 * TanStack Query hooks for Saudi Arabia payment methods
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  initiateSTCPayPayment,
  confirmSTCPayPayment,
  verifySTCPayTransaction,
  generateSadadBill,
  checkSadadBillStatus,
  cancelSadadBill,
  createTamaraCheckout,
  getTamaraPaymentOptions,
  getTamaraOrderStatus,
  authorizeTamaraOrder,
  captureTamaraOrder,
} from "../lib/api/saudi-payments";
import type {
  STCPayInitiateRequest,
  STCPayConfirmRequest,
  TamaraCheckoutRequest,
} from "../types/saudi-payments";

// Query keys
export const saudiPaymentKeys = {
  all: ["saudi-payments"] as const,
  stcPay: {
    all: ["saudi-payments", "stcpay"] as const,
    transaction: (transactionId: string) =>
      ["saudi-payments", "stcpay", "transaction", transactionId] as const,
  },
  sadad: {
    all: ["saudi-payments", "sadad"] as const,
    bill: (billNumber: string) =>
      ["saudi-payments", "sadad", "bill", billNumber] as const,
  },
  tamara: {
    all: ["saudi-payments", "tamara"] as const,
    options: (amount: number) =>
      ["saudi-payments", "tamara", "options", amount] as const,
    order: (orderId: string) =>
      ["saudi-payments", "tamara", "order", orderId] as const,
  },
};

// ==================== STC Pay Hooks ====================

/**
 * Mutation to initiate STC Pay payment.
 */
export function useInitiateSTCPayPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      request,
    }: {
      invoiceId: string;
      request: STCPayInitiateRequest;
    }) => initiateSTCPayPayment(invoiceId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saudiPaymentKeys.stcPay.all });
    },
  });
}

/**
 * Mutation to confirm STC Pay payment with OTP.
 */
export function useConfirmSTCPayPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      request,
    }: {
      invoiceId: string;
      request: STCPayConfirmRequest;
    }) => confirmSTCPayPayment(invoiceId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saudiPaymentKeys.stcPay.all });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

/**
 * Query to verify STC Pay transaction status.
 */
export function useSTCPayTransactionStatus(
  transactionId: string,
  enabled = true
) {
  return useQuery({
    queryKey: saudiPaymentKeys.stcPay.transaction(transactionId),
    queryFn: () => verifySTCPayTransaction(transactionId),
    enabled: enabled && !!transactionId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

// ==================== SADAD Hooks ====================

/**
 * Mutation to generate SADAD bill.
 */
export function useGenerateSadadBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => generateSadadBill(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saudiPaymentKeys.sadad.all });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

/**
 * Query to check SADAD bill status.
 */
export function useSadadBillStatus(billNumber: string, enabled = true) {
  return useQuery({
    queryKey: saudiPaymentKeys.sadad.bill(billNumber),
    queryFn: () => checkSadadBillStatus(billNumber),
    enabled: enabled && !!billNumber,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

/**
 * Mutation to cancel SADAD bill.
 */
export function useCancelSadadBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => cancelSadadBill(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saudiPaymentKeys.sadad.all });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

// ==================== Tamara Hooks ====================

/**
 * Mutation to create Tamara checkout session.
 */
export function useCreateTamaraCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      request,
    }: {
      invoiceId: string;
      request?: TamaraCheckoutRequest;
    }) => createTamaraCheckout(invoiceId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saudiPaymentKeys.tamara.all });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

/**
 * Query to get Tamara payment options for an amount.
 */
export function useTamaraPaymentOptions(amount: number, enabled = true) {
  return useQuery({
    queryKey: saudiPaymentKeys.tamara.options(amount),
    queryFn: () => getTamaraPaymentOptions(amount),
    enabled: enabled && amount > 0,
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Query to get Tamara order status.
 */
export function useTamaraOrderStatus(orderId: string, enabled = true) {
  return useQuery({
    queryKey: saudiPaymentKeys.tamara.order(orderId),
    queryFn: () => getTamaraOrderStatus(orderId),
    enabled: enabled && !!orderId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

/**
 * Mutation to authorize Tamara order.
 */
export function useAuthorizeTamaraOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => authorizeTamaraOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({
        queryKey: saudiPaymentKeys.tamara.order(orderId),
      });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

/**
 * Mutation to capture Tamara order.
 */
export function useCaptureTamaraOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => captureTamaraOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({
        queryKey: saudiPaymentKeys.tamara.order(orderId),
      });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
