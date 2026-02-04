import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  Voucher,
  VoucherUsage,
  CreateVoucherRequest,
  UpdateVoucherRequest,
  ValidateVoucherRequest,
  VoucherValidationResponse,
  RedeemVoucherRequest,
  RedeemGiftCardRequest,
  VoucherRedemptionResponse,
  VoucherCheckResponse,
} from "../../types/voucher";

export interface VoucherQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  active?: boolean;
}

// ============ CRUD ============

/**
 * Create a new voucher
 */
export async function createVoucher(data: CreateVoucherRequest): Promise<Voucher> {
  return api.post("api/vouchers", { json: data }).json();
}

/**
 * Get paginated vouchers
 */
export async function getVouchers(
  params: VoucherQueryParams = {}
): Promise<PaginatedResponse<Voucher>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDir) searchParams.set("sortDir", params.sortDir);
  if (params.active !== undefined) searchParams.set("active", String(params.active));

  const queryString = searchParams.toString();
  const url = queryString ? `api/vouchers?${queryString}` : "api/vouchers";

  return api.get(url).json();
}

/**
 * Get a single voucher by ID
 */
export async function getVoucher(id: UUID): Promise<Voucher> {
  return api.get(`api/vouchers/${id}`).json();
}

/**
 * Get a voucher by code
 */
export async function getVoucherByCode(code: string): Promise<Voucher> {
  return api.get(`api/vouchers/code/${code}`).json();
}

/**
 * Update a voucher
 */
export async function updateVoucher(
  id: UUID,
  data: UpdateVoucherRequest
): Promise<Voucher> {
  return api.put(`api/vouchers/${id}`, { json: data }).json();
}

/**
 * Delete a voucher
 */
export async function deleteVoucher(id: UUID): Promise<void> {
  await api.delete(`api/vouchers/${id}`);
}

/**
 * Activate a voucher
 */
export async function activateVoucher(id: UUID): Promise<Voucher> {
  return api.post(`api/vouchers/${id}/activate`).json();
}

/**
 * Deactivate a voucher
 */
export async function deactivateVoucher(id: UUID): Promise<Voucher> {
  return api.post(`api/vouchers/${id}/deactivate`).json();
}

// ============ Usage ============

/**
 * Get voucher usage history
 */
export async function getVoucherUsage(
  voucherId: UUID,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<VoucherUsage>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/vouchers/${voucherId}/usage?${queryString}`
    : `api/vouchers/${voucherId}/usage`;

  return api.get(url).json();
}

// ============ Validation & Redemption ============

/**
 * Validate a voucher code
 */
export async function validateVoucher(
  data: ValidateVoucherRequest
): Promise<VoucherValidationResponse> {
  return api.post("api/vouchers/validate", { json: data }).json();
}

/**
 * Redeem a voucher
 */
export async function redeemVoucher(
  data: RedeemVoucherRequest
): Promise<VoucherRedemptionResponse> {
  return api.post("api/vouchers/redeem", { json: data }).json();
}

/**
 * Redeem a gift card to wallet
 */
export async function redeemGiftCard(
  data: RedeemGiftCardRequest
): Promise<VoucherRedemptionResponse> {
  return api.post("api/vouchers/redeem/gift-card", { json: data }).json();
}

/**
 * Check if a voucher code is valid (public)
 */
export async function checkVoucherCode(code: string): Promise<VoucherCheckResponse> {
  return api.get(`api/vouchers/check/${code}`).json();
}
