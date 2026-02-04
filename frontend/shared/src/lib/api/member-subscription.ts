import { apiClient } from "./client";
import {
  MembershipContract,
  PlanChangePreview,
  PlanChangeResult,
  PlanChangeRequest,
  CancellationPreview,
  CancellationResult,
  CancellationRequest,
  AcceptOfferResult,
  ExitSurveyRequest,
  ExitSurvey,
  SignContractRequest,
  ScheduledChange,
} from "../../types/contract";
import { Subscription, MembershipPlan } from "../../types/member";
import { UUID } from "../../types/api";

// ==========================================
// MEMBER SUBSCRIPTION SELF-SERVICE API
// ==========================================

/**
 * Get the current member's active subscription.
 */
export async function getMySubscription(): Promise<Subscription | null> {
  try {
    const response = await apiClient.get("api/member/subscription");
    return response.json();
  } catch (error) {
    const err = error as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get the current member's contract.
 */
export async function getMyContract(): Promise<MembershipContract | null> {
  try {
    const response = await apiClient.get("api/member/contract");
    return response.json();
  } catch (error) {
    const err = error as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Sign a pending contract.
 */
export async function signContract(
  contractId: UUID,
  data: SignContractRequest
): Promise<MembershipContract> {
  const response = await apiClient.post(`member/contract/${contractId}/sign`, {
    json: data,
  });
  return response.json();
}

// ==========================================
// PLAN CHANGE API
// ==========================================

/**
 * Get available plans for the member to switch to.
 */
export async function getAvailablePlans(): Promise<MembershipPlan[]> {
  const response = await apiClient.get("api/membership-plans/active");
  return response.json();
}

/**
 * Preview a plan change (upgrade/downgrade).
 */
export async function previewPlanChange(
  newPlanId: UUID,
  locale: string = "en"
): Promise<PlanChangePreview> {
  const response = await apiClient.get("api/member/subscription/change/preview", {
    searchParams: { newPlanId },
    headers: { "Accept-Language": locale },
  });
  return response.json();
}

/**
 * Execute a plan upgrade (immediate with proration).
 */
export async function upgradePlan(
  data: PlanChangeRequest
): Promise<PlanChangeResult> {
  const response = await apiClient.post("api/member/subscription/upgrade", {
    json: data,
  });
  return response.json();
}

/**
 * Execute a plan downgrade (scheduled for end of period).
 */
export async function downgradePlan(
  data: PlanChangeRequest
): Promise<PlanChangeResult> {
  const response = await apiClient.post("api/member/subscription/downgrade", {
    json: data,
  });
  return response.json();
}

/**
 * Cancel a scheduled plan change.
 */
export async function cancelScheduledChange(
  changeId: UUID,
  reason?: string
): Promise<ScheduledChange> {
  const response = await apiClient.post(
    `member/subscription/scheduled-change/${changeId}/cancel`,
    { searchParams: reason ? { reason } : {} }
  );
  return response.json();
}

// ==========================================
// CANCELLATION API
// ==========================================

/**
 * Preview cancellation with fees and retention offers.
 */
export async function previewCancellation(
  locale: string = "en"
): Promise<CancellationPreview> {
  const response = await apiClient.get("api/member/subscription/cancel/preview", {
    headers: { "Accept-Language": locale },
  });
  return response.json();
}

/**
 * Request subscription cancellation.
 */
export async function requestCancellation(
  data: CancellationRequest
): Promise<CancellationResult> {
  const response = await apiClient.post("api/member/subscription/cancel", {
    json: data,
  });
  return response.json();
}

/**
 * Accept a retention offer.
 */
export async function acceptRetentionOffer(
  offerId: UUID
): Promise<AcceptOfferResult> {
  const response = await apiClient.post(
    `member/subscription/cancel/accept-offer/${offerId}`
  );
  return response.json();
}

/**
 * Withdraw cancellation request.
 */
export async function withdrawCancellation(
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post("api/member/subscription/cancel/withdraw", {
    searchParams: reason ? { reason } : {},
  });
  return response.json();
}

/**
 * Submit exit survey.
 */
export async function submitExitSurvey(
  data: ExitSurveyRequest
): Promise<ExitSurvey> {
  const response = await apiClient.post("api/member/subscription/exit-survey", {
    json: data,
  });
  return response.json();
}

// ==========================================
// FREEZE API
// ==========================================

/**
 * Get freeze days balance.
 */
export async function getFreezeBalance(): Promise<{
  freezeDaysRemaining: number;
  totalFreezeDaysUsed: number;
}> {
  const response = await apiClient.get("api/member/subscription/freeze-balance");
  return response.json();
}
