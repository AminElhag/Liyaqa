"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createDeal,
  getDeal,
  getDeals,
  getDealsByStatus,
  getOpenDeals,
  getMyDeals,
  getDealsBySalesRep,
  updateDeal,
  deleteDeal,
  qualifyDeal,
  sendProposal,
  startNegotiation,
  changeDealStage,
  convertDeal,
  loseDeal,
  reopenDeal,
  reassignDeal,
  getDealStats,
  getMyDealStats,
} from "../../lib/api/platform/deals";
import { useToast } from "../../hooks/use-toast";
import type { PageResponse, UUID } from "../../types/api";
import type {
  Deal,
  DealSummary,
  DealStats,
  SalesRepDealStats,
  DealConversionResult,
  CreateDealRequest,
  UpdateDealRequest,
  ConvertDealRequest,
  LoseDealRequest,
  ReassignDealRequest,
  DealQueryParams,
  DealStatus,
} from "../../types/platform";

// Query keys
export const dealKeys = {
  all: ["platform", "deals"] as const,
  lists: () => [...dealKeys.all, "list"] as const,
  list: (params: DealQueryParams) => [...dealKeys.lists(), params] as const,
  byStatus: (status: DealStatus) => [...dealKeys.lists(), "status", status] as const,
  open: () => [...dealKeys.lists(), "open"] as const,
  myDeals: (params: DealQueryParams) => [...dealKeys.lists(), "my", params] as const,
  bySalesRep: (salesRepId: UUID) => [...dealKeys.lists(), "rep", salesRepId] as const,
  details: () => [...dealKeys.all, "detail"] as const,
  detail: (id: UUID) => [...dealKeys.details(), id] as const,
  stats: () => [...dealKeys.all, "stats"] as const,
  myStats: () => [...dealKeys.all, "myStats"] as const,
};

/**
 * Hook to fetch paginated deals list
 */
export function useDeals(
  params: DealQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<DealSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => getDeals(params),
    ...options,
  });
}

/**
 * Hook to fetch deals by status
 */
export function useDealsByStatus(
  status: DealStatus,
  params: DealQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<DealSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dealKeys.byStatus(status),
    queryFn: () => getDealsByStatus(status, params),
    ...options,
  });
}

/**
 * Hook to fetch open deals
 */
export function useOpenDeals(
  params: DealQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<DealSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dealKeys.open(),
    queryFn: () => getOpenDeals(params),
    ...options,
  });
}

/**
 * Hook to fetch current user's deals
 */
export function useMyDeals(
  params: DealQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<DealSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dealKeys.myDeals(params),
    queryFn: () => getMyDeals(params),
    ...options,
  });
}

/**
 * Hook to fetch deals by sales rep
 */
export function useDealsBySalesRep(
  salesRepId: UUID,
  params: DealQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<DealSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dealKeys.bySalesRep(salesRepId),
    queryFn: () => getDealsBySalesRep(salesRepId, params),
    enabled: !!salesRepId,
    ...options,
  });
}

/**
 * Hook to fetch a single deal by ID
 */
export function useDeal(
  id: UUID,
  options?: Omit<UseQueryOptions<Deal>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => getDeal(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch deal statistics
 */
export function useDealStats(
  options?: Omit<UseQueryOptions<DealStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dealKeys.stats(),
    queryFn: () => getDealStats(),
    ...options,
  });
}

/**
 * Hook to fetch current user's deal statistics
 */
export function useMyDealStats(
  options?: Omit<UseQueryOptions<SalesRepDealStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dealKeys.myStats(),
    queryFn: () => getMyDealStats(),
    ...options,
  });
}

/**
 * Hook to create a new deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateDealRequest) => createDeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create deal",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to update a deal
 */
export function useUpdateDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateDealRequest }) =>
      updateDeal(id, data),
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(dealKeys.detail(updatedDeal.id), updatedDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update deal",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to delete a deal
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: UUID) => deleteDeal(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: dealKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete deal",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to qualify a deal
 */
export function useQualifyDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: UUID) => qualifyDeal(id),
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(dealKeys.detail(updatedDeal.id), updatedDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to qualify deal",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to send proposal
 */
export function useSendProposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: UUID) => sendProposal(id),
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(dealKeys.detail(updatedDeal.id), updatedDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send proposal",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to start negotiation
 */
export function useStartNegotiation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: UUID) => startNegotiation(id),
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(dealKeys.detail(updatedDeal.id), updatedDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start negotiation",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to change deal stage (e.g. CONTACTED -> DEMO_SCHEDULED)
 */
export function useChangeDealStage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, stage, reason }: { id: UUID; stage: DealStatus; reason?: string }) =>
      changeDealStage(id, stage, reason),
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(dealKeys.detail(updatedDeal.id), updatedDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to change deal stage",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to convert deal to client
 */
export function useConvertDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: ConvertDealRequest }) =>
      convertDeal(id, data),
    onSuccess: (result: DealConversionResult) => {
      queryClient.setQueryData(dealKeys.detail(result.deal.id), result.deal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
      // Also invalidate client lists since a new client was created
      queryClient.invalidateQueries({ queryKey: ["platform", "clients"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to convert deal",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to mark deal as lost
 */
export function useLoseDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: LoseDealRequest }) =>
      loseDeal(id, data),
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(dealKeys.detail(updatedDeal.id), updatedDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark deal as lost",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to reopen a lost deal
 */
export function useReopenDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: UUID) => reopenDeal(id),
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(dealKeys.detail(updatedDeal.id), updatedDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reopen deal",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to reassign deal to another sales rep
 */
export function useReassignDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: ReassignDealRequest }) =>
      reassignDeal(id, data),
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(dealKeys.detail(updatedDeal.id), updatedDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reassign deal",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}
