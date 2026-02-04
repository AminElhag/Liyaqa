"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createClientInvoice,
  generateFromSubscription,
  getClientInvoice,
  getClientInvoices,
  getInvoicesByOrganization,
  updateClientInvoice,
  issueClientInvoice,
  recordClientPayment,
  cancelClientInvoice,
  getClientInvoicePdf,
  getClientInvoiceStats,
} from "../lib/api/platform/client-invoices";
import type { PageResponse, UUID } from "../types/api";
import type {
  ClientInvoice,
  ClientInvoiceSummary,
  ClientInvoiceStats,
  CreateClientInvoiceRequest,
  GenerateFromSubscriptionRequest,
  IssueClientInvoiceRequest,
  RecordClientPaymentRequest,
  UpdateClientInvoiceRequest,
  ClientInvoiceQueryParams,
} from "../types/platform";

// Query keys
export const clientInvoiceKeys = {
  all: ["platform", "clientInvoices"] as const,
  lists: () => [...clientInvoiceKeys.all, "list"] as const,
  list: (params: ClientInvoiceQueryParams) =>
    [...clientInvoiceKeys.lists(), params] as const,
  byOrganization: (organizationId: UUID) =>
    [...clientInvoiceKeys.lists(), "org", organizationId] as const,
  details: () => [...clientInvoiceKeys.all, "detail"] as const,
  detail: (id: UUID) => [...clientInvoiceKeys.details(), id] as const,
  stats: () => [...clientInvoiceKeys.all, "stats"] as const,
};

/**
 * Hook to fetch paginated client invoices list
 */
export function useClientInvoices(
  params: ClientInvoiceQueryParams = {},
  options?: Omit<
    UseQueryOptions<PageResponse<ClientInvoiceSummary>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: clientInvoiceKeys.list(params),
    queryFn: () => getClientInvoices(params),
    ...options,
  });
}

/**
 * Hook to fetch invoices by organization
 */
export function useInvoicesByOrganization(
  organizationId: UUID,
  params: ClientInvoiceQueryParams = {},
  options?: Omit<
    UseQueryOptions<PageResponse<ClientInvoiceSummary>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: clientInvoiceKeys.byOrganization(organizationId),
    queryFn: () => getInvoicesByOrganization(organizationId, params),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to fetch a single client invoice by ID
 */
export function useClientInvoice(
  id: UUID,
  options?: Omit<UseQueryOptions<ClientInvoice>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientInvoiceKeys.detail(id),
    queryFn: () => getClientInvoice(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch invoice statistics
 */
export function useClientInvoiceStats(
  options?: Omit<UseQueryOptions<ClientInvoiceStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientInvoiceKeys.stats(),
    queryFn: () => getClientInvoiceStats(),
    ...options,
  });
}

/**
 * Hook to create a new client invoice
 */
export function useCreateClientInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientInvoiceRequest) => createClientInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.stats() });
    },
  });
}

/**
 * Hook to generate invoice from subscription
 */
export function useGenerateFromSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateFromSubscriptionRequest) =>
      generateFromSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.stats() });
    },
  });
}

/**
 * Hook to update a client invoice
 */
export function useUpdateClientInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: UpdateClientInvoiceRequest;
    }) => updateClientInvoice(id, data),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(
        clientInvoiceKeys.detail(updatedInvoice.id),
        updatedInvoice
      );
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() });
    },
  });
}

/**
 * Hook to issue a client invoice
 */
export function useIssueClientInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data?: IssueClientInvoiceRequest;
    }) => issueClientInvoice(id, data),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(
        clientInvoiceKeys.detail(updatedInvoice.id),
        updatedInvoice
      );
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.stats() });
    },
  });
}

/**
 * Hook to record payment on a client invoice
 */
export function useRecordClientPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: RecordClientPaymentRequest;
    }) => recordClientPayment(id, data),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(
        clientInvoiceKeys.detail(updatedInvoice.id),
        updatedInvoice
      );
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.stats() });
    },
  });
}

/**
 * Hook to cancel a client invoice
 */
export function useCancelClientInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => cancelClientInvoice(id),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(
        clientInvoiceKeys.detail(updatedInvoice.id),
        updatedInvoice
      );
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientInvoiceKeys.stats() });
    },
  });
}

/**
 * Hook to download invoice PDF
 */
export function useClientInvoicePdf() {
  return useMutation({
    mutationFn: (id: UUID) => getClientInvoicePdf(id),
    onSuccess: (blob, id) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
