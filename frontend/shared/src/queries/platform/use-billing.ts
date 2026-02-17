"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  getRevenueMetrics,
  getRevenueByPlan,
  getOutstandingInvoices,
  markInvoicePaid,
} from "../../lib/api/platform/billing";
import type {
  RevenueMetricsResponse,
  PlanRevenueResponse,
  OutstandingInvoiceResponse,
  MarkPaidRequest,
} from "../../types/platform/billing";

export const billingKeys = {
  all: ["platform", "billing"] as const,
  revenue: () => [...billingKeys.all, "revenue"] as const,
  revenueByPlan: () => [...billingKeys.all, "revenue-by-plan"] as const,
  outstanding: () => [...billingKeys.all, "outstanding"] as const,
};

export function useRevenueMetrics(
  options?: Omit<UseQueryOptions<RevenueMetricsResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: billingKeys.revenue(),
    queryFn: getRevenueMetrics,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useRevenueByPlan(
  options?: Omit<UseQueryOptions<PlanRevenueResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: billingKeys.revenueByPlan(),
    queryFn: getRevenueByPlan,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useOutstandingInvoices(
  options?: Omit<UseQueryOptions<OutstandingInvoiceResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: billingKeys.outstanding(),
    queryFn: getOutstandingInvoices,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useMarkInvoicePaid(
  options?: UseMutationOptions<void, Error, { invoiceId: string; data?: MarkPaidRequest }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, data }) => markInvoicePaid(invoiceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.outstanding() });
      queryClient.invalidateQueries({ queryKey: billingKeys.revenue() });
    },
    ...options,
  });
}
