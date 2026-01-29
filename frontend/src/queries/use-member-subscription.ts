import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import {
  getMySubscription,
  getMyContract,
  signContract,
  getAvailablePlans,
  previewPlanChange,
  upgradePlan,
  downgradePlan,
  cancelScheduledChange,
  previewCancellation,
  requestCancellation,
  acceptRetentionOffer,
  withdrawCancellation,
  submitExitSurvey,
  getFreezeBalance,
} from "@/lib/api/member-subscription";
import {
  PlanChangeRequest,
  CancellationRequest,
  SignContractRequest,
  ExitSurveyRequest,
} from "@/types/contract";
import { UUID } from "@/types/api";

// ==========================================
// QUERY KEYS
// ==========================================

export const memberSubscriptionKeys = {
  all: ["member-subscription"] as const,
  subscription: () => [...memberSubscriptionKeys.all, "subscription"] as const,
  contract: () => [...memberSubscriptionKeys.all, "contract"] as const,
  availablePlans: () => [...memberSubscriptionKeys.all, "available-plans"] as const,
  planChangePreview: (planId: UUID) =>
    [...memberSubscriptionKeys.all, "plan-change-preview", planId] as const,
  cancellationPreview: () =>
    [...memberSubscriptionKeys.all, "cancellation-preview"] as const,
  freezeBalance: () => [...memberSubscriptionKeys.all, "freeze-balance"] as const,
};

// ==========================================
// SUBSCRIPTION QUERIES
// ==========================================

/**
 * Get current member's active subscription.
 */
export function useMyActiveSubscription() {
  return useQuery({
    queryKey: memberSubscriptionKeys.subscription(),
    queryFn: getMySubscription,
  });
}

/**
 * Get current member's contract.
 */
export function useMyContract() {
  return useQuery({
    queryKey: memberSubscriptionKeys.contract(),
    queryFn: getMyContract,
  });
}

/**
 * Get available plans to switch to.
 */
export function useAvailablePlans() {
  return useQuery({
    queryKey: memberSubscriptionKeys.availablePlans(),
    queryFn: getAvailablePlans,
  });
}

/**
 * Preview a plan change.
 */
export function usePlanChangePreview(newPlanId: UUID | null) {
  const locale = useLocale();
  return useQuery({
    queryKey: memberSubscriptionKeys.planChangePreview(newPlanId || ""),
    queryFn: () => previewPlanChange(newPlanId!, locale),
    enabled: !!newPlanId,
  });
}

/**
 * Preview cancellation.
 */
export function useCancellationPreview(enabled: boolean = true) {
  const locale = useLocale();
  return useQuery({
    queryKey: memberSubscriptionKeys.cancellationPreview(),
    queryFn: () => previewCancellation(locale),
    enabled,
  });
}

/**
 * Get freeze balance.
 */
export function useFreezeBalance() {
  return useQuery({
    queryKey: memberSubscriptionKeys.freezeBalance(),
    queryFn: getFreezeBalance,
  });
}

// ==========================================
// CONTRACT MUTATIONS
// ==========================================

/**
 * Sign a contract.
 */
export function useSignContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      data,
    }: {
      contractId: UUID;
      data: SignContractRequest;
    }) => signContract(contractId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.contract(),
      });
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.subscription(),
      });
    },
  });
}

// ==========================================
// PLAN CHANGE MUTATIONS
// ==========================================

/**
 * Upgrade plan.
 */
export function useUpgradePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PlanChangeRequest) => upgradePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.subscription(),
      });
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.contract(),
      });
    },
  });
}

/**
 * Downgrade plan.
 */
export function useDowngradePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PlanChangeRequest) => downgradePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.subscription(),
      });
    },
  });
}

/**
 * Cancel scheduled plan change.
 */
export function useCancelScheduledChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ changeId, reason }: { changeId: UUID; reason?: string }) =>
      cancelScheduledChange(changeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.subscription(),
      });
    },
  });
}

// ==========================================
// CANCELLATION MUTATIONS
// ==========================================

/**
 * Request cancellation.
 */
export function useRequestCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CancellationRequest) => requestCancellation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.subscription(),
      });
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.cancellationPreview(),
      });
    },
  });
}

/**
 * Accept retention offer.
 */
export function useAcceptRetentionOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: UUID) => acceptRetentionOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.subscription(),
      });
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.cancellationPreview(),
      });
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.freezeBalance(),
      });
    },
  });
}

/**
 * Withdraw cancellation.
 */
export function useWithdrawCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string) => withdrawCancellation(reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.subscription(),
      });
      queryClient.invalidateQueries({
        queryKey: memberSubscriptionKeys.cancellationPreview(),
      });
    },
  });
}

/**
 * Submit exit survey.
 */
export function useSubmitExitSurvey() {
  return useMutation({
    mutationFn: (data: ExitSurveyRequest) => submitExitSurvey(data),
  });
}
