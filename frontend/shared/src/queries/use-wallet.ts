"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getWallet,
  getWalletTransactions,
  addCredit,
  adjustBalance,
  triggerAutoPay,
} from "../lib/api/wallet";
import type { UUID } from "../types/api";
import type {
  WalletBalance,
  WalletTransactionsResponse,
  WalletTransactionsParams,
  AddCreditRequest,
  AdjustBalanceRequest,
  AutoPayResponse,
} from "../types/wallet";
import { subscriptionKeys } from "./use-subscriptions";

// Query keys
export const walletKeys = {
  all: ["wallet"] as const,
  balance: (memberId: UUID) => [...walletKeys.all, "balance", memberId] as const,
  transactions: (memberId: UUID) =>
    [...walletKeys.all, "transactions", memberId] as const,
  transactionsList: (memberId: UUID, params: WalletTransactionsParams) =>
    [...walletKeys.transactions(memberId), params] as const,
};

/**
 * Hook to fetch wallet balance for a member
 */
export function useWallet(
  memberId: UUID,
  options?: Omit<UseQueryOptions<WalletBalance>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: walletKeys.balance(memberId),
    queryFn: () => getWallet(memberId),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to fetch wallet transaction history
 */
export function useWalletTransactions(
  memberId: UUID,
  params: WalletTransactionsParams = {},
  options?: Omit<
    UseQueryOptions<WalletTransactionsResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: walletKeys.transactionsList(memberId, params),
    queryFn: () => getWalletTransactions(memberId, params),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to add credit to a member's wallet
 */
export function useAddCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: UUID;
      data: AddCreditRequest;
    }) => addCredit(memberId, data),
    onSuccess: (_, { memberId }) => {
      // Invalidate wallet balance
      queryClient.invalidateQueries({ queryKey: walletKeys.balance(memberId) });
      // Invalidate transactions
      queryClient.invalidateQueries({
        queryKey: walletKeys.transactions(memberId),
      });
      // Invalidate subscriptions (auto-pay may have activated some)
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.byMember(memberId),
      });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

/**
 * Hook to adjust wallet balance (admin only)
 */
export function useAdjustBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: UUID;
      data: AdjustBalanceRequest;
    }) => adjustBalance(memberId, data),
    onSuccess: (_, { memberId }) => {
      // Invalidate wallet balance
      queryClient.invalidateQueries({ queryKey: walletKeys.balance(memberId) });
      // Invalidate transactions
      queryClient.invalidateQueries({
        queryKey: walletKeys.transactions(memberId),
      });
      // Invalidate subscriptions (auto-pay may have activated some)
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.byMember(memberId),
      });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

/**
 * Hook to trigger auto-pay for pending subscriptions
 */
export function useTriggerAutoPay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: UUID) => triggerAutoPay(memberId),
    onSuccess: (result: AutoPayResponse, memberId) => {
      // Invalidate wallet balance
      queryClient.invalidateQueries({ queryKey: walletKeys.balance(memberId) });
      // Invalidate transactions
      queryClient.invalidateQueries({
        queryKey: walletKeys.transactions(memberId),
      });
      // Invalidate subscriptions
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.byMember(memberId),
      });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}
