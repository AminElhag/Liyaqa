/**
 * API client for Saudi Arabia payment methods: STC Pay, SADAD, and Tamara BNPL
 */

import { api } from "./client";
import type {
  STCPayInitiateRequest,
  STCPayConfirmRequest,
  STCPayInitiationResponse,
  STCPayConfirmationResponse,
  STCPayStatusResponse,
  SadadBillResponse,
  SadadStatusResponse,
  SadadCancelResponse,
  TamaraCheckoutRequest,
  TamaraCheckoutResponse,
  TamaraOptionsResponse,
  TamaraOrderStatusResponse,
  TamaraAuthorizeResponse,
  TamaraCaptureResponse,
} from "../types/saudi-payments";

const STC_PAY_BASE = "api/payments/stcpay";
const SADAD_BASE = "api/payments/sadad";
const TAMARA_BASE = "api/payments/tamara";

// ==================== STC Pay ====================

/**
 * Initiates an STC Pay payment for an invoice.
 * Sends OTP to customer's STC Pay mobile app.
 */
export async function initiateSTCPayPayment(
  invoiceId: string,
  request: STCPayInitiateRequest
): Promise<STCPayInitiationResponse> {
  return api
    .post(`${STC_PAY_BASE}/initiate/${invoiceId}`, { json: request })
    .json<STCPayInitiationResponse>();
}

/**
 * Confirms an STC Pay payment with OTP.
 */
export async function confirmSTCPayPayment(
  invoiceId: string,
  request: STCPayConfirmRequest
): Promise<STCPayConfirmationResponse> {
  return api
    .post(`${STC_PAY_BASE}/confirm/${invoiceId}`, { json: request })
    .json<STCPayConfirmationResponse>();
}

/**
 * Verifies STC Pay transaction status.
 */
export async function verifySTCPayTransaction(
  transactionId: string
): Promise<STCPayStatusResponse> {
  return api
    .get(`${STC_PAY_BASE}/verify/${transactionId}`)
    .json<STCPayStatusResponse>();
}

// ==================== SADAD ====================

/**
 * Generates a SADAD bill for an invoice.
 * Returns bill number that customer can use to pay via any Saudi bank.
 */
export async function generateSadadBill(
  invoiceId: string
): Promise<SadadBillResponse> {
  return api
    .post(`${SADAD_BASE}/generate-bill/${invoiceId}`)
    .json<SadadBillResponse>();
}

/**
 * Checks the payment status of a SADAD bill.
 */
export async function checkSadadBillStatus(
  billNumber: string
): Promise<SadadStatusResponse> {
  return api
    .get(`${SADAD_BASE}/bill-status/${billNumber}`)
    .json<SadadStatusResponse>();
}

/**
 * Cancels a SADAD bill.
 */
export async function cancelSadadBill(
  invoiceId: string
): Promise<SadadCancelResponse> {
  return api
    .post(`${SADAD_BASE}/cancel-bill/${invoiceId}`)
    .json<SadadCancelResponse>();
}

// ==================== Tamara BNPL ====================

/**
 * Creates a Tamara checkout session for an invoice.
 * Returns checkout URL where customer completes the BNPL purchase.
 */
export async function createTamaraCheckout(
  invoiceId: string,
  request?: TamaraCheckoutRequest
): Promise<TamaraCheckoutResponse> {
  return api
    .post(`${TAMARA_BASE}/checkout/${invoiceId}`, {
      json: request || { instalments: 3 },
    })
    .json<TamaraCheckoutResponse>();
}

/**
 * Gets available Tamara payment options for an amount.
 */
export async function getTamaraPaymentOptions(
  amount: number
): Promise<TamaraOptionsResponse> {
  return api
    .get(`${TAMARA_BASE}/options?amount=${amount}`)
    .json<TamaraOptionsResponse>();
}

/**
 * Gets the status of a Tamara order.
 */
export async function getTamaraOrderStatus(
  orderId: string
): Promise<TamaraOrderStatusResponse> {
  return api
    .get(`${TAMARA_BASE}/status/${orderId}`)
    .json<TamaraOrderStatusResponse>();
}

/**
 * Authorizes a Tamara order after customer completes checkout.
 */
export async function authorizeTamaraOrder(
  orderId: string
): Promise<TamaraAuthorizeResponse> {
  return api
    .post(`${TAMARA_BASE}/authorize/${orderId}`)
    .json<TamaraAuthorizeResponse>();
}

/**
 * Captures a Tamara order (triggers the actual charge).
 */
export async function captureTamaraOrder(
  orderId: string
): Promise<TamaraCaptureResponse> {
  return api
    .post(`${TAMARA_BASE}/capture/${orderId}`)
    .json<TamaraCaptureResponse>();
}
