import { api } from "./client";
import type { UUID } from "@/types/api";
import type {
  WalletBalance,
  WalletTransaction,
  WalletTransactionsParams,
  WalletTransactionsResponse,
  AddCreditRequest,
  AdjustBalanceRequest,
  AutoPayResponse,
} from "@/types/wallet";

/**
 * Build query string for wallet transactions
 */
function buildTransactionsQueryString(params: WalletTransactionsParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.type) searchParams.set("type", params.type);
  return searchParams.toString();
}

/**
 * Get wallet balance for a member
 */
export async function getWallet(memberId: UUID): Promise<WalletBalance> {
  return api.get(`api/members/${memberId}/wallet`).json();
}

/**
 * Get wallet transaction history for a member
 */
export async function getWalletTransactions(
  memberId: UUID,
  params: WalletTransactionsParams = {}
): Promise<WalletTransactionsResponse> {
  const query = buildTransactionsQueryString(params);
  const url = query
    ? `api/members/${memberId}/wallet/transactions?${query}`
    : `api/members/${memberId}/wallet/transactions`;
  return api.get(url).json();
}

/**
 * Add credit to a member's wallet
 */
export async function addCredit(
  memberId: UUID,
  data: AddCreditRequest
): Promise<WalletBalance> {
  return api
    .post(`api/members/${memberId}/wallet/credit`, {
      json: {
        amount: data.amount,
        currency: data.currency || "SAR",
        description: data.description,
        paymentMethod: data.paymentMethod,
      },
    })
    .json();
}

/**
 * Debit from a member's wallet
 */
export async function debitWallet(
  memberId: UUID,
  data: {
    amount: number;
    currency?: string;
    referenceType?: string;
    referenceId?: string;
    description?: string;
  }
): Promise<WalletBalance> {
  return api
    .post(`api/members/${memberId}/wallet/debit`, {
      json: {
        amount: data.amount,
        currency: data.currency || "SAR",
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        description: data.description,
      },
    })
    .json();
}

/**
 * Adjust wallet balance (admin only)
 */
export async function adjustBalance(
  memberId: UUID,
  data: AdjustBalanceRequest
): Promise<WalletBalance> {
  return api
    .post(`api/members/${memberId}/wallet/adjust`, {
      json: {
        amount: data.amount,
        currency: data.currency || "SAR",
        description: data.description,
      },
    })
    .json();
}

/**
 * Trigger auto-pay for pending subscriptions
 */
export async function triggerAutoPay(memberId: UUID): Promise<AutoPayResponse> {
  return api.post(`api/members/${memberId}/wallet/auto-pay`).json();
}
