import { apiClient } from "./client";
import {
  ContractListItem,
  ContractDetail,
  MembershipContract,
  PendingCancellation,
  CancellationAction,
  ExitSurvey,
  ExitSurveyAnalytics,
  MembershipCategory,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ContractPricingTier,
  CreatePricingTierRequest,
  CreateContractRequest,
  AdminContractsFilter,
} from "../../types/contract";
import { UUID, PaginatedResponse as Page } from "../../types/api";

// ==========================================
// CONTRACT MANAGEMENT
// ==========================================

/**
 * Get paginated list of contracts.
 */
export async function getContracts(
  filter: AdminContractsFilter = {}
): Promise<Page<ContractListItem>> {
  const params = new URLSearchParams();

  if (filter.status) params.set("status", filter.status);
  if (filter.contractType) params.set("contractType", filter.contractType);
  if (filter.contractTerm) params.set("contractTerm", filter.contractTerm);
  if (filter.memberSearch) params.set("memberSearch", filter.memberSearch);
  if (filter.startDateFrom) params.set("startDateFrom", filter.startDateFrom);
  if (filter.startDateTo) params.set("startDateTo", filter.startDateTo);
  if (filter.page !== undefined) params.set("page", filter.page.toString());
  if (filter.size !== undefined) params.set("size", filter.size.toString());

  const response = await apiClient.get("api/admin/contracts", {
    searchParams: params,
  });
  return response.json();
}

/**
 * Get contract by ID.
 */
export async function getContract(id: UUID): Promise<ContractDetail> {
  const response = await apiClient.get(`api/admin/contracts/${id}`);
  return response.json();
}

/**
 * Create a new contract.
 */
export async function createContract(
  data: CreateContractRequest
): Promise<MembershipContract> {
  const response = await apiClient.post("api/admin/contracts", { json: data });
  return response.json();
}

/**
 * Approve a pending contract (staff approval).
 */
export async function approveContract(id: UUID): Promise<MembershipContract> {
  const response = await apiClient.post(`api/admin/contracts/${id}/approve`);
  return response.json();
}

/**
 * Void a contract.
 */
export async function voidContract(
  id: UUID,
  reason: string
): Promise<MembershipContract> {
  const response = await apiClient.post(`api/admin/contracts/${id}/void`, {
    searchParams: { reason },
  });
  return response.json();
}

/**
 * Get contracts for a specific member.
 */
export async function getMemberContracts(
  memberId: UUID
): Promise<MembershipContract[]> {
  const response = await apiClient.get(`api/admin/contracts/member/${memberId}`);
  return response.json();
}

// ==========================================
// CANCELLATION MANAGEMENT
// ==========================================

/**
 * Get pending cancellations.
 */
export async function getPendingCancellations(params?: {
  page?: number;
  size?: number;
}): Promise<Page<PendingCancellation>> {
  const response = await apiClient.get("api/admin/cancellations/pending", {
    searchParams: params,
  });
  return response.json();
}

/**
 * Waive early termination fee.
 */
export async function waiveTerminationFee(
  cancellationId: UUID,
  reason: string
): Promise<PendingCancellation> {
  const response = await apiClient.post(
    `api/admin/cancellations/${cancellationId}/waive-fee`,
    { searchParams: { reason } }
  );
  return response.json();
}

/**
 * Save member (cancel the cancellation).
 */
export async function saveMember(
  cancellationId: UUID,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(
    `api/admin/cancellations/${cancellationId}/save`,
    { searchParams: { reason } }
  );
  return response.json();
}

/**
 * Expedite cancellation (make it effective immediately).
 */
export async function expediteCancellation(
  cancellationId: UUID,
  reason: string
): Promise<PendingCancellation> {
  const response = await apiClient.post(
    `api/admin/cancellations/${cancellationId}/expedite`,
    { searchParams: { reason } }
  );
  return response.json();
}

/**
 * Perform cancellation action.
 */
export async function performCancellationAction(
  action: CancellationAction
): Promise<PendingCancellation> {
  const response = await apiClient.post(
    `api/admin/cancellations/${action.cancellationId}/action`,
    { json: action }
  );
  return response.json();
}

// ==========================================
// EXIT SURVEY MANAGEMENT
// ==========================================

/**
 * Get exit surveys with pagination.
 */
export async function getExitSurveys(params?: {
  page?: number;
  size?: number;
  reasonCategory?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Page<ExitSurvey>> {
  const response = await apiClient.get("api/admin/exit-surveys", {
    searchParams: params,
  });
  return response.json();
}

/**
 * Get exit survey by ID.
 */
export async function getExitSurvey(id: UUID): Promise<ExitSurvey> {
  const response = await apiClient.get(`api/admin/exit-surveys/${id}`);
  return response.json();
}

/**
 * Get exit survey analytics.
 */
export async function getExitSurveyAnalytics(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ExitSurveyAnalytics> {
  const response = await apiClient.get("api/admin/exit-surveys/analytics", {
    searchParams: params,
  });
  return response.json();
}

// ==========================================
// MEMBERSHIP CATEGORIES
// ==========================================

/**
 * Get all membership categories.
 */
export async function getMembershipCategories(): Promise<MembershipCategory[]> {
  const response = await apiClient.get("api/admin/membership-categories/active");
  return response.json();
}

/**
 * Get membership category by ID.
 */
export async function getMembershipCategory(
  id: UUID
): Promise<MembershipCategory> {
  const response = await apiClient.get(`api/admin/membership-categories/${id}`);
  return response.json();
}

/**
 * Create membership category.
 */
export async function createMembershipCategory(
  data: CreateCategoryRequest
): Promise<MembershipCategory> {
  const response = await apiClient.post("api/admin/membership-categories", {
    json: data,
  });
  return response.json();
}

/**
 * Update membership category.
 */
export async function updateMembershipCategory(
  id: UUID,
  data: UpdateCategoryRequest
): Promise<MembershipCategory> {
  const response = await apiClient.put(`api/admin/membership-categories/${id}`, {
    json: data,
  });
  return response.json();
}

/**
 * Delete membership category.
 */
export async function deleteMembershipCategory(id: UUID): Promise<void> {
  await apiClient.delete(`api/admin/membership-categories/${id}`);
}

/**
 * Get membership category usage stats.
 */
export async function getCategoryUsageStats(id: UUID): Promise<{
  categoryId: UUID;
  totalMembers: number;
  activeMembers: number;
  plansUsingCategory: number;
}> {
  const response = await apiClient.get(
    `api/admin/membership-categories/${id}/usage-stats`
  );
  return response.json();
}

// ==========================================
// CONTRACT PRICING TIERS
// ==========================================

/**
 * Get pricing tiers for a plan.
 */
export async function getPricingTiers(
  planId: UUID
): Promise<ContractPricingTier[]> {
  const response = await apiClient.get(`api/admin/plans/${planId}/pricing-tiers`);
  return response.json();
}

/**
 * Get all pricing tiers.
 */
export async function getAllPricingTiers(): Promise<ContractPricingTier[]> {
  const response = await apiClient.get("api/admin/pricing-tiers");
  return response.json();
}

/**
 * Create pricing tier.
 */
export async function createPricingTier(
  data: CreatePricingTierRequest
): Promise<ContractPricingTier> {
  const response = await apiClient.post(
    `api/admin/plans/${data.planId}/pricing-tiers`,
    { json: data }
  );
  return response.json();
}

/**
 * Update pricing tier.
 */
export async function updatePricingTier(
  id: UUID,
  data: Partial<CreatePricingTierRequest>
): Promise<ContractPricingTier> {
  const response = await apiClient.put(`api/admin/pricing-tiers/${id}`, {
    json: data,
  });
  return response.json();
}

/**
 * Delete pricing tier.
 */
export async function deletePricingTier(id: UUID): Promise<void> {
  await apiClient.delete(`api/admin/pricing-tiers/${id}`);
}

// ==========================================
// RETENTION ANALYTICS
// ==========================================

/**
 * Get retention metrics.
 */
export async function getRetentionMetrics(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalCancellationRequests: number;
  savedMembers: number;
  retentionRate: number;
  averageTimeToSave: number;
  offerAcceptanceRate: number;
  topAcceptedOfferTypes: { offerType: string; count: number }[];
}> {
  const response = await apiClient.get("api/admin/retention/metrics", {
    searchParams: params,
  });
  return response.json();
}
