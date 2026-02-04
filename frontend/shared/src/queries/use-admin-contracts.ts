import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContracts,
  getContract,
  createContract,
  approveContract,
  voidContract,
  getMemberContracts,
  getPendingCancellations,
  waiveTerminationFee,
  saveMember,
  expediteCancellation,
  getExitSurveys,
  getExitSurveyAnalytics,
  getMembershipCategories,
  createMembershipCategory,
  updateMembershipCategory,
  deleteMembershipCategory,
  getCategoryUsageStats,
  getPricingTiers,
  getAllPricingTiers,
  createPricingTier,
  updatePricingTier,
  deletePricingTier,
  getRetentionMetrics,
} from "../lib/api/admin-contracts";
import {
  AdminContractsFilter,
  CreateContractRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreatePricingTierRequest,
} from "../types/contract";
import { UUID } from "../types/api";

// ==========================================
// QUERY KEYS
// ==========================================

export const adminContractKeys = {
  all: ["admin-contracts"] as const,
  contracts: () => [...adminContractKeys.all, "contracts"] as const,
  contractsList: (filter: AdminContractsFilter) =>
    [...adminContractKeys.contracts(), filter] as const,
  contract: (id: UUID) => [...adminContractKeys.contracts(), id] as const,
  memberContracts: (memberId: UUID) =>
    [...adminContractKeys.contracts(), "member", memberId] as const,
  cancellations: () => [...adminContractKeys.all, "cancellations"] as const,
  pendingCancellations: (page?: number, size?: number) =>
    [...adminContractKeys.cancellations(), "pending", { page, size }] as const,
  exitSurveys: () => [...adminContractKeys.all, "exit-surveys"] as const,
  exitSurveysList: (params: Record<string, unknown>) =>
    [...adminContractKeys.exitSurveys(), params] as const,
  exitSurveyAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    [...adminContractKeys.exitSurveys(), "analytics", params] as const,
  categories: () => [...adminContractKeys.all, "categories"] as const,
  categoryUsageStats: (id: UUID) =>
    [...adminContractKeys.all, "categories", id, "usage-stats"] as const,
  pricingTiers: () => [...adminContractKeys.all, "pricing-tiers"] as const,
  planPricingTiers: (planId: UUID) =>
    [...adminContractKeys.pricingTiers(), planId] as const,
  retentionMetrics: (params?: { startDate?: string; endDate?: string }) =>
    [...adminContractKeys.all, "retention-metrics", params] as const,
};

// ==========================================
// CONTRACT QUERIES
// ==========================================

/**
 * Get paginated list of contracts.
 */
export function useContracts(filter: AdminContractsFilter = {}) {
  return useQuery({
    queryKey: adminContractKeys.contractsList(filter),
    queryFn: () => getContracts(filter),
  });
}

/**
 * Get contract by ID.
 */
export function useContract(id: UUID) {
  return useQuery({
    queryKey: adminContractKeys.contract(id),
    queryFn: () => getContract(id),
    enabled: !!id,
  });
}

/**
 * Get contracts for a member.
 */
export function useMemberContracts(memberId: UUID) {
  return useQuery({
    queryKey: adminContractKeys.memberContracts(memberId),
    queryFn: () => getMemberContracts(memberId),
    enabled: !!memberId,
  });
}

// ==========================================
// CONTRACT MUTATIONS
// ==========================================

/**
 * Create a new contract.
 */
export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContractRequest) => createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminContractKeys.contracts() });
    },
  });
}

/**
 * Approve a pending contract.
 */
export function useApproveContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => approveContract(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: adminContractKeys.contract(id) });
      queryClient.invalidateQueries({ queryKey: adminContractKeys.contracts() });
    },
  });
}

/**
 * Void a contract.
 */
export function useVoidContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: UUID; reason: string }) =>
      voidContract(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminContractKeys.contract(id) });
      queryClient.invalidateQueries({ queryKey: adminContractKeys.contracts() });
    },
  });
}

// ==========================================
// CANCELLATION QUERIES & MUTATIONS
// ==========================================

/**
 * Get pending cancellations.
 */
export function usePendingCancellations(page?: number, size?: number) {
  return useQuery({
    queryKey: adminContractKeys.pendingCancellations(page, size),
    queryFn: () => getPendingCancellations({ page, size }),
  });
}

/**
 * Waive termination fee.
 */
export function useWaiveTerminationFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: UUID; reason: string }) =>
      waiveTerminationFee(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminContractKeys.cancellations(),
      });
    },
  });
}

/**
 * Save member (cancel the cancellation).
 */
export function useSaveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: UUID; reason: string }) =>
      saveMember(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminContractKeys.cancellations(),
      });
    },
  });
}

/**
 * Expedite cancellation.
 */
export function useExpediteCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: UUID; reason: string }) =>
      expediteCancellation(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminContractKeys.cancellations(),
      });
    },
  });
}

// ==========================================
// EXIT SURVEY QUERIES
// ==========================================

/**
 * Get exit surveys.
 */
export function useExitSurveys(params?: {
  page?: number;
  size?: number;
  reasonCategory?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: adminContractKeys.exitSurveysList(params || {}),
    queryFn: () => getExitSurveys(params),
  });
}

/**
 * Get exit survey analytics.
 */
export function useExitSurveyAnalytics(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: adminContractKeys.exitSurveyAnalytics(params),
    queryFn: () => getExitSurveyAnalytics(params),
  });
}

// ==========================================
// MEMBERSHIP CATEGORY QUERIES & MUTATIONS
// ==========================================

/**
 * Get membership categories.
 */
export function useMembershipCategories() {
  return useQuery({
    queryKey: adminContractKeys.categories(),
    queryFn: getMembershipCategories,
  });
}

/**
 * Create membership category.
 */
export function useCreateMembershipCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createMembershipCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminContractKeys.categories(),
      });
    },
  });
}

/**
 * Update membership category.
 */
export function useUpdateMembershipCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: UpdateCategoryRequest;
    }) => updateMembershipCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminContractKeys.categories(),
      });
    },
  });
}

/**
 * Delete membership category.
 */
export function useDeleteMembershipCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteMembershipCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminContractKeys.categories(),
      });
    },
  });
}

/**
 * Get membership category usage stats.
 */
export function useCategoryUsageStats(categoryId: UUID | null) {
  return useQuery({
    queryKey: adminContractKeys.categoryUsageStats(categoryId!),
    queryFn: () => getCategoryUsageStats(categoryId!),
    enabled: !!categoryId,
  });
}

// ==========================================
// PRICING TIER QUERIES & MUTATIONS
// ==========================================

/**
 * Get all pricing tiers.
 */
export function useAllPricingTiers() {
  return useQuery({
    queryKey: adminContractKeys.pricingTiers(),
    queryFn: getAllPricingTiers,
  });
}

/**
 * Get pricing tiers for a plan.
 */
export function usePlanPricingTiers(planId: UUID) {
  return useQuery({
    queryKey: adminContractKeys.planPricingTiers(planId),
    queryFn: () => getPricingTiers(planId),
    enabled: !!planId,
  });
}

/**
 * Create pricing tier.
 */
export function useCreatePricingTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePricingTierRequest) => createPricingTier(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: adminContractKeys.pricingTiers(),
      });
      queryClient.invalidateQueries({
        queryKey: adminContractKeys.planPricingTiers(data.planId),
      });
    },
  });
}

/**
 * Update pricing tier.
 */
export function useUpdatePricingTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: Partial<CreatePricingTierRequest>;
    }) => updatePricingTier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminContractKeys.pricingTiers(),
      });
    },
  });
}

/**
 * Delete pricing tier.
 */
export function useDeletePricingTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deletePricingTier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminContractKeys.pricingTiers(),
      });
    },
  });
}

// ==========================================
// RETENTION METRICS
// ==========================================

/**
 * Get retention metrics.
 */
export function useRetentionMetrics(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: adminContractKeys.retentionMetrics(params),
    queryFn: () => getRetentionMetrics(params),
  });
}
