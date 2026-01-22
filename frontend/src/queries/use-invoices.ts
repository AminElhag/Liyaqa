"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  issueInvoice,
  cancelInvoice,
  payInvoice,
  downloadInvoicePdf,
  getMemberInvoices,
  bulkIssueInvoices,
  bulkCancelInvoices,
  createInvoiceFromSubscription,
} from "@/lib/api/invoices";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  Invoice,
  InvoiceQueryParams,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  PayInvoiceRequest,
} from "@/types/billing";
import { memberKeys } from "./use-members";
import { dashboardKeys } from "./use-dashboard";

// Query keys
export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (params: InvoiceQueryParams) =>
    [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: UUID) => [...invoiceKeys.details(), id] as const,
  member: (memberId: UUID) =>
    [...invoiceKeys.all, "member", memberId] as const,
};

/**
 * Hook to fetch paginated invoices
 */
export function useInvoices(
  params: InvoiceQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Invoice>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => getInvoices(params),
    ...options,
  });
}

/**
 * Hook to fetch a single invoice by ID
 */
export function useInvoice(
  id: UUID,
  options?: Omit<UseQueryOptions<Invoice>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoice(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch member's invoices
 */
export function useMemberInvoices(
  memberId: UUID,
  params: Omit<InvoiceQueryParams, "memberId"> = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Invoice>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: invoiceKeys.member(memberId),
    queryFn: () => getMemberInvoices(memberId, params),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to create a new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => createInvoice(data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.member(invoice.memberId),
      });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Hook to update an invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateInvoiceRequest }) =>
      updateInvoice(id, data),
    onSuccess: (invoice) => {
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.member(invoice.memberId),
      });
    },
  });
}

/**
 * Hook to delete an invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteInvoice(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Hook to issue an invoice
 */
export function useIssueInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => issueInvoice(id),
    onSuccess: (invoice) => {
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.member(invoice.memberId),
      });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Hook to cancel an invoice
 */
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => cancelInvoice(id),
    onSuccess: (invoice) => {
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.member(invoice.memberId),
      });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Hook to pay an invoice
 */
export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: PayInvoiceRequest }) =>
      payInvoice(id, data),
    onSuccess: (invoice) => {
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.member(invoice.memberId),
      });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Hook to download invoice PDF
 */
export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: async (id: UUID) => {
      const blob = await downloadInvoicePdf(id);
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}

/**
 * Hook for bulk issue invoices
 */
export function useBulkIssueInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: UUID[]) => bulkIssueInvoices(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Hook for bulk cancel invoices
 */
export function useBulkCancelInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: UUID[]) => bulkCancelInvoices(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Hook to create invoice from subscription
 */
export function useCreateInvoiceFromSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: UUID) =>
      createInvoiceFromSubscription(subscriptionId),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.member(invoice.memberId),
      });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
