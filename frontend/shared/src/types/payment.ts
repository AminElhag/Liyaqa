import type { UUID, Money } from "./api";

/**
 * Payment status
 */
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

/**
 * Payment initiation response from backend
 */
export interface PaymentInitiation {
  invoiceId: UUID;
  transactionRef: string;
  redirectUrl: string;
  amount: Money;
  expiresAt: string;
}

/**
 * Payment verification response
 */
export interface PaymentVerification {
  invoiceId: UUID;
  transactionRef: string;
  status: PaymentStatus;
  amount: Money;
  paidAt?: string;
  failureReason?: string;
}

/**
 * Payment callback data (from PayTabs)
 */
export interface PaymentCallback {
  transactionRef: string;
  cartId: string;
  status: string;
  responseCode: string;
  responseMessage: string;
}

/**
 * Payment return page query params
 */
export interface PaymentReturnParams {
  tranRef?: string;
  cartId?: string;
  respStatus?: string;
  respCode?: string;
  respMessage?: string;
}
