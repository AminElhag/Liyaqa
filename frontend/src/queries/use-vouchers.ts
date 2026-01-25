"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getVouchers,
  getVoucher,
  getVoucherByCode,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  activateVoucher,
  deactivateVoucher,
  getVoucherUsage,
  validateVoucher,
  redeemVoucher,
  redeemGiftCard,
  checkVoucherCode,
  type VoucherQueryParams,
} from "@/lib/api/vouchers";
import type { PaginatedResponse, UUID } from "@/types/api";
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
} from "@/types/voucher";

// Query keys
export const voucherKeys = {
  all: ["vouchers"] as const,
  lists: () => [...voucherKeys.all, "list"] as const,
  list: (params: VoucherQueryParams) => [...voucherKeys.lists(), params] as const,
  details: () => [...voucherKeys.all, "detail"] as const,
  detail: (id: UUID) => [...voucherKeys.details(), id] as const,
  byCode: (code: string) => [...voucherKeys.all, "code", code] as const,
  usage: (voucherId: UUID) => [...voucherKeys.all, "usage", voucherId] as const,
  usageList: (voucherId: UUID, params: { page?: number; size?: number }) =>
    [...voucherKeys.usage(voucherId), params] as const,
  check: (code: string) => [...voucherKeys.all, "check", code] as const,
};

// ============ Query Hooks ============

/**
 * Hook to fetch paginated vouchers
 */
export function useVouchers(
  params: VoucherQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Voucher>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: voucherKeys.list(params),
    queryFn: () => getVouchers(params),
    ...options,
  });
}

/**
 * Hook to fetch a single voucher by ID
 */
export function useVoucher(
  id: UUID,
  options?: Omit<UseQueryOptions<Voucher>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: voucherKeys.detail(id),
    queryFn: () => getVoucher(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch a voucher by code
 */
export function useVoucherByCode(
  code: string,
  options?: Omit<UseQueryOptions<Voucher>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: voucherKeys.byCode(code),
    queryFn: () => getVoucherByCode(code),
    enabled: !!code,
    ...options,
  });
}

/**
 * Hook to fetch voucher usage history
 */
export function useVoucherUsage(
  voucherId: UUID,
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<VoucherUsage>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: voucherKeys.usageList(voucherId, params),
    queryFn: () => getVoucherUsage(voucherId, params),
    enabled: !!voucherId,
    ...options,
  });
}

/**
 * Hook to check a voucher code (public)
 */
export function useCheckVoucherCode(
  code: string,
  options?: Omit<UseQueryOptions<VoucherCheckResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: voucherKeys.check(code),
    queryFn: () => checkVoucherCode(code),
    enabled: !!code,
    ...options,
  });
}

// ============ Mutation Hooks ============

/**
 * Hook to create a new voucher
 */
export function useCreateVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVoucherRequest) => createVoucher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.lists() });
    },
  });
}

/**
 * Hook to update a voucher
 */
export function useUpdateVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateVoucherRequest }) =>
      updateVoucher(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: voucherKeys.detail(id) });
    },
  });
}

/**
 * Hook to delete a voucher
 */
export function useDeleteVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.lists() });
    },
  });
}

/**
 * Hook to activate a voucher
 */
export function useActivateVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateVoucher(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: voucherKeys.detail(id) });
    },
  });
}

/**
 * Hook to deactivate a voucher
 */
export function useDeactivateVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateVoucher(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: voucherKeys.detail(id) });
    },
  });
}

/**
 * Hook to validate a voucher
 */
export function useValidateVoucher() {
  return useMutation({
    mutationFn: (data: ValidateVoucherRequest) => validateVoucher(data),
  });
}

/**
 * Hook to redeem a voucher
 */
export function useRedeemVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RedeemVoucherRequest) => redeemVoucher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.lists() });
    },
  });
}

/**
 * Hook to redeem a gift card
 */
export function useRedeemGiftCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RedeemGiftCardRequest) => redeemGiftCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.lists() });
    },
  });
}
