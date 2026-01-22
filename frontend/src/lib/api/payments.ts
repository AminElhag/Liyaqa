import { api } from "./client";
import type { UUID } from "@/types/api";
import type { PaymentInitiation, PaymentVerification } from "@/types/payment";

/**
 * Initiate a payment for an invoice
 * Returns PayTabs redirect URL
 */
export async function initiatePayment(
  invoiceId: UUID
): Promise<PaymentInitiation> {
  return api.post(`api/payments/initiate/${invoiceId}`).json();
}

/**
 * Verify payment status by transaction reference
 */
export async function verifyPayment(
  transactionRef: string
): Promise<PaymentVerification> {
  return api.get(`api/payments/verify/${transactionRef}`).json();
}

/**
 * Get payment status for an invoice
 */
export async function getInvoicePaymentStatus(
  invoiceId: UUID
): Promise<PaymentVerification> {
  return api.get(`api/payments/invoice/${invoiceId}/status`).json();
}
