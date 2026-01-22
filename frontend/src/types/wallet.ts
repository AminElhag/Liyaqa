import { PageResponse } from "./api";

/**
 * Wallet transaction types
 */
export type WalletTransactionType =
  | "CREDIT"
  | "DEBIT"
  | "SUBSCRIPTION_CHARGE"
  | "REFUND"
  | "ADJUSTMENT";

/**
 * Wallet balance response from API
 */
export interface WalletBalance {
  memberId: string;
  balance: {
    amount: number;
    currency: string;
  };
  lastTransactionAt: string | null;
  hasCredit: boolean;
  hasDebt: boolean;
}

/**
 * Wallet transaction record
 */
export interface WalletTransaction {
  id: string;
  memberId: string;
  type: WalletTransactionType;
  amount: {
    amount: number;
    currency: string;
  };
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  balanceAfter: number;
  createdAt: string;
}

/**
 * Paginated wallet transactions response
 */
export type WalletTransactionsResponse = PageResponse<WalletTransaction>;

/**
 * Query params for wallet transactions
 */
export interface WalletTransactionsParams {
  page?: number;
  size?: number;
  type?: WalletTransactionType;
}

/**
 * Request to add credit to wallet
 */
export interface AddCreditRequest {
  amount: number;
  currency?: string;
  description?: string;
  paymentMethod?: string;
}

/**
 * Request to adjust wallet balance (admin only)
 */
export interface AdjustBalanceRequest {
  amount: number;
  currency?: string;
  description: string;
}

/**
 * Response from auto-pay trigger
 */
export interface AutoPayResponse {
  activatedCount: number;
  activatedSubscriptionIds: string[];
}

/**
 * Payment methods for add credit (wallet-specific, includes local methods)
 */
export const WALLET_PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "ONLINE",
  "MADA",
  "PAYTABS",
  "STC_PAY",
] as const;

export type WalletPaymentMethod = (typeof WALLET_PAYMENT_METHODS)[number];

/** @deprecated Use WALLET_PAYMENT_METHODS instead */
export const PAYMENT_METHODS = WALLET_PAYMENT_METHODS;
