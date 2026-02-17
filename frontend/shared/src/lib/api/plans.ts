import { api } from "./client";
import type { PaginatedResponse, UUID, LocalizedText, Money } from "../../types/api";
import type { MembershipPlan, TaxableFeeRequest, BillingPeriod, SubscriptionType, MembershipPlanType, MembershipPlanStatus, PlanStats } from "../../types/member";
import type { ContractType, ContractTerm, TerminationFeeType } from "../../types/contract";

const PLANS_ENDPOINT = "api/membership-plans";

/**
 * Re-export types for convenience
 */
export type { BillingPeriod, MembershipPlanType, MembershipPlanStatus } from "../../types/member";

/**
 * Create plan request
 */
export interface CreatePlanRequest {
  name: LocalizedText;
  description?: LocalizedText;

  // Plan type & status
  planType?: MembershipPlanType;
  status?: MembershipPlanStatus;

  // Date restrictions
  availableFrom?: string;
  availableUntil?: string;

  // Age restrictions
  minimumAge?: number;
  maximumAge?: number;

  // Fee structure (replaces price)
  membershipFee: TaxableFeeRequest;
  administrationFee?: TaxableFeeRequest;
  joinFee?: TaxableFeeRequest;

  // Billing & duration
  billingPeriod: BillingPeriod;
  durationDays?: number;
  maxClassesPerPeriod?: number;

  // GX class access
  classAccessLevel?: "UNLIMITED" | "LIMITED" | "NO_ACCESS";
  eligibleClassCategories?: string;

  // Features
  hasGuestPasses?: boolean;
  guestPassesCount?: number;
  hasLockerAccess?: boolean;
  hasSaunaAccess?: boolean;
  hasPoolAccess?: boolean;
  freezeDaysAllowed?: number;

  // Status
  isActive?: boolean;
  sortOrder?: number;

  // Contract configuration
  categoryId?: UUID;
  contractType?: ContractType;
  supportedTerms?: ContractTerm[];
  defaultCommitmentMonths?: number;
  minimumCommitmentMonths?: number;
  defaultNoticePeriodDays?: number;
  earlyTerminationFeeType?: TerminationFeeType;
  earlyTerminationFeeValue?: number;
  coolingOffDays?: number;

  // PT access
  ptAccessLevel?: "UNLIMITED" | "LIMITED" | "NO_ACCESS";
  maxPtSessionsPerPeriod?: number;
  ptSessionsIncluded?: number;

  // Class pack fields
  sessionCount?: number;
  expiryDays?: number;

  // Trial conversion
  convertsToPlanId?: UUID;

  // Legacy (backward compatibility)
  price?: Money;
  classLimit?: number;
}

/**
 * Update plan request
 */
export interface UpdatePlanRequest extends Partial<CreatePlanRequest> {
  // Clear flags for nullable fields
  clearAvailableFrom?: boolean;
  clearAvailableUntil?: boolean;
  clearMinimumAge?: boolean;
  clearMaximumAge?: boolean;
  clearCategoryId?: boolean;
}

/**
 * Plan query params
 */
export interface PlanQueryParams {
  active?: boolean;
  status?: MembershipPlanStatus;
  planType?: MembershipPlanType;
  type?: SubscriptionType;
  search?: string;
  page?: number;
  size?: number;
}

/**
 * Build query string from params
 */
function buildQueryString(params: PlanQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.active !== undefined)
    searchParams.set("active", String(params.active));
  if (params.status) searchParams.set("status", params.status);
  if (params.planType) searchParams.set("planType", params.planType);
  if (params.type) searchParams.set("type", params.type);
  if (params.search) searchParams.set("search", params.search);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  return searchParams.toString();
}

/**
 * Get paginated list of membership plans
 */
export async function getPlans(
  params: PlanQueryParams = {}
): Promise<PaginatedResponse<MembershipPlan>> {
  const query = buildQueryString(params);
  const url = query ? `${PLANS_ENDPOINT}?${query}` : PLANS_ENDPOINT;
  return api.get(url).json();
}

/**
 * Get all active plans (for dropdowns)
 */
export async function getActivePlans(): Promise<MembershipPlan[]> {
  const response = await getPlans({ active: true, size: 100 });
  return response.content;
}

/**
 * Get plan by ID
 */
export async function getPlan(id: UUID): Promise<MembershipPlan> {
  return api.get(`${PLANS_ENDPOINT}/${id}`).json();
}

/**
 * Create a new membership plan
 */
export async function createPlan(
  data: CreatePlanRequest
): Promise<MembershipPlan> {
  // Transform to backend format
  const backendData = {
    // Name and description
    nameEn: data.name.en,
    nameAr: data.name.ar || null,
    descriptionEn: data.description?.en || null,
    descriptionAr: data.description?.ar || null,

    // Plan type & status
    planType: data.planType ?? "RECURRING",
    status: data.status ?? "ACTIVE",

    // Date restrictions
    availableFrom: data.availableFrom || null,
    availableUntil: data.availableUntil || null,

    // Age restrictions
    minimumAge: data.minimumAge ?? null,
    maximumAge: data.maximumAge ?? null,

    // Fee structure
    membershipFee: {
      amount: data.membershipFee.amount,
      currency: data.membershipFee.currency || "SAR",
      taxRate: data.membershipFee.taxRate ?? 15,
    },
    administrationFee: {
      amount: data.administrationFee?.amount ?? 0,
      currency: data.administrationFee?.currency || "SAR",
      taxRate: data.administrationFee?.taxRate ?? 15,
    },
    joinFee: {
      amount: data.joinFee?.amount ?? 0,
      currency: data.joinFee?.currency || "SAR",
      taxRate: data.joinFee?.taxRate ?? 0,
    },

    // Billing & duration
    billingPeriod: data.billingPeriod,
    durationDays: data.durationDays ?? null,
    maxClassesPerPeriod: data.maxClassesPerPeriod ?? data.classLimit ?? null,
    classAccessLevel: data.classAccessLevel ?? "UNLIMITED",
    eligibleClassCategories: data.eligibleClassCategories ?? null,

    // Features
    hasGuestPasses: data.hasGuestPasses ?? false,
    guestPassesCount: data.guestPassesCount ?? 0,
    hasLockerAccess: data.hasLockerAccess ?? false,
    hasSaunaAccess: data.hasSaunaAccess ?? false,
    hasPoolAccess: data.hasPoolAccess ?? false,
    freezeDaysAllowed: data.freezeDaysAllowed ?? 0,

    // Status
    isActive: data.isActive ?? true,
    sortOrder: data.sortOrder ?? 0,

    // Contract configuration
    categoryId: data.categoryId ?? null,
    contractType: data.contractType ?? "MONTH_TO_MONTH",
    supportedTerms: data.supportedTerms ?? ["MONTHLY"],
    defaultCommitmentMonths: data.defaultCommitmentMonths ?? 1,
    minimumCommitmentMonths: data.minimumCommitmentMonths ?? null,
    defaultNoticePeriodDays: data.defaultNoticePeriodDays ?? 30,
    earlyTerminationFeeType: data.earlyTerminationFeeType ?? "NONE",
    earlyTerminationFeeValue: data.earlyTerminationFeeValue ?? null,
    coolingOffDays: data.coolingOffDays ?? 14,

    // PT access
    ptAccessLevel: data.ptAccessLevel ?? "NO_ACCESS",
    maxPtSessionsPerPeriod: data.maxPtSessionsPerPeriod ?? null,
    ptSessionsIncluded: data.ptSessionsIncluded ?? null,

    // Class pack & trial
    sessionCount: data.sessionCount ?? null,
    expiryDays: data.expiryDays ?? null,
    convertsToPlanId: data.convertsToPlanId ?? null,
  };
  return api.post(PLANS_ENDPOINT, { json: backendData }).json();
}

/**
 * Update a membership plan
 */
export async function updatePlan(
  id: UUID,
  data: UpdatePlanRequest
): Promise<MembershipPlan> {
  // Transform to backend format
  const backendData: Record<string, unknown> = {};

  // Name and description
  if (data.name) {
    backendData.nameEn = data.name.en;
    backendData.nameAr = data.name.ar || null;
  }
  if (data.description) {
    backendData.descriptionEn = data.description.en;
    backendData.descriptionAr = data.description.ar || null;
  }

  // Date restrictions
  if (data.clearAvailableFrom) {
    backendData.clearAvailableFrom = true;
  } else if (data.availableFrom !== undefined) {
    backendData.availableFrom = data.availableFrom || null;
  }
  if (data.clearAvailableUntil) {
    backendData.clearAvailableUntil = true;
  } else if (data.availableUntil !== undefined) {
    backendData.availableUntil = data.availableUntil || null;
  }

  // Age restrictions
  if (data.clearMinimumAge) {
    backendData.clearMinimumAge = true;
  } else if (data.minimumAge !== undefined) {
    backendData.minimumAge = data.minimumAge;
  }
  if (data.clearMaximumAge) {
    backendData.clearMaximumAge = true;
  } else if (data.maximumAge !== undefined) {
    backendData.maximumAge = data.maximumAge;
  }

  // Fee structure
  if (data.membershipFee) {
    backendData.membershipFee = {
      amount: data.membershipFee.amount,
      currency: data.membershipFee.currency || "SAR",
      taxRate: data.membershipFee.taxRate ?? 15,
    };
  }
  if (data.administrationFee) {
    backendData.administrationFee = {
      amount: data.administrationFee.amount,
      currency: data.administrationFee.currency || "SAR",
      taxRate: data.administrationFee.taxRate ?? 15,
    };
  }
  if (data.joinFee) {
    backendData.joinFee = {
      amount: data.joinFee.amount,
      currency: data.joinFee.currency || "SAR",
      taxRate: data.joinFee.taxRate ?? 0,
    };
  }

  // Billing & duration
  if (data.billingPeriod !== undefined) backendData.billingPeriod = data.billingPeriod;
  if (data.durationDays !== undefined) backendData.durationDays = data.durationDays;
  if (data.maxClassesPerPeriod !== undefined) backendData.maxClassesPerPeriod = data.maxClassesPerPeriod;
  if (data.classLimit !== undefined) backendData.maxClassesPerPeriod = data.classLimit;
  if (data.classAccessLevel !== undefined) backendData.classAccessLevel = data.classAccessLevel;
  if (data.eligibleClassCategories !== undefined) backendData.eligibleClassCategories = data.eligibleClassCategories;

  // Features
  if (data.hasGuestPasses !== undefined) backendData.hasGuestPasses = data.hasGuestPasses;
  if (data.guestPassesCount !== undefined) backendData.guestPassesCount = data.guestPassesCount;
  if (data.hasLockerAccess !== undefined) backendData.hasLockerAccess = data.hasLockerAccess;
  if (data.hasSaunaAccess !== undefined) backendData.hasSaunaAccess = data.hasSaunaAccess;
  if (data.hasPoolAccess !== undefined) backendData.hasPoolAccess = data.hasPoolAccess;
  if (data.freezeDaysAllowed !== undefined) backendData.freezeDaysAllowed = data.freezeDaysAllowed;

  // Status
  if (data.isActive !== undefined) backendData.isActive = data.isActive;
  if (data.sortOrder !== undefined) backendData.sortOrder = data.sortOrder;

  // Contract configuration
  if (data.clearCategoryId) {
    backendData.clearCategoryId = true;
  } else if (data.categoryId !== undefined) {
    backendData.categoryId = data.categoryId;
  }
  if (data.contractType !== undefined) backendData.contractType = data.contractType;
  if (data.supportedTerms !== undefined) backendData.supportedTerms = data.supportedTerms;
  if (data.defaultCommitmentMonths !== undefined) backendData.defaultCommitmentMonths = data.defaultCommitmentMonths;
  if (data.minimumCommitmentMonths !== undefined) backendData.minimumCommitmentMonths = data.minimumCommitmentMonths;
  if (data.defaultNoticePeriodDays !== undefined) backendData.defaultNoticePeriodDays = data.defaultNoticePeriodDays;
  if (data.earlyTerminationFeeType !== undefined) backendData.earlyTerminationFeeType = data.earlyTerminationFeeType;
  if (data.earlyTerminationFeeValue !== undefined) backendData.earlyTerminationFeeValue = data.earlyTerminationFeeValue;
  if (data.coolingOffDays !== undefined) backendData.coolingOffDays = data.coolingOffDays;

  // PT access
  if (data.ptAccessLevel !== undefined) backendData.ptAccessLevel = data.ptAccessLevel;
  if (data.maxPtSessionsPerPeriod !== undefined) backendData.maxPtSessionsPerPeriod = data.maxPtSessionsPerPeriod;
  if (data.ptSessionsIncluded !== undefined) backendData.ptSessionsIncluded = data.ptSessionsIncluded;

  return api.put(`${PLANS_ENDPOINT}/${id}`, { json: backendData }).json();
}

/**
 * Delete a membership plan
 */
export async function deletePlan(id: UUID): Promise<void> {
  await api.delete(`${PLANS_ENDPOINT}/${id}`);
}

/**
 * Activate a plan
 */
export async function activatePlan(id: UUID): Promise<MembershipPlan> {
  return api.post(`${PLANS_ENDPOINT}/${id}/activate`).json();
}

/**
 * Deactivate a plan
 */
export async function deactivatePlan(id: UUID): Promise<MembershipPlan> {
  return api.post(`${PLANS_ENDPOINT}/${id}/deactivate`).json();
}

/**
 * Archive a plan (ACTIVE -> ARCHIVED)
 */
export async function archivePlan(id: UUID): Promise<MembershipPlan> {
  return api.post(`${PLANS_ENDPOINT}/${id}/archive`).json();
}

/**
 * Reactivate an archived plan (ARCHIVED -> ACTIVE)
 */
export async function reactivatePlan(id: UUID): Promise<MembershipPlan> {
  return api.post(`${PLANS_ENDPOINT}/${id}/reactivate`).json();
}

/**
 * Publish a draft plan (DRAFT -> ACTIVE)
 */
export async function publishPlan(id: UUID): Promise<MembershipPlan> {
  return api.post(`${PLANS_ENDPOINT}/${id}/publish`).json();
}

/**
 * Get plan statistics
 */
export async function getPlanStats(): Promise<PlanStats> {
  return api.get(`${PLANS_ENDPOINT}/stats`).json();
}
