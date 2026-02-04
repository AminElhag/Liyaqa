"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  getClientOnboarding,
  getOnboardingOverview,
  getActiveOnboarding,
  getStalledOnboarding,
  completeOnboardingStep,
  skipOnboardingStep,
  resetOnboarding,
  sendOnboardingReminder,
} from "../../lib/api/platform/onboarding";
import type {
  ClientOnboarding,
  OnboardingOverview,
  OnboardingSummary,
} from "../../types/platform/onboarding";

// Query keys
export const onboardingKeys = {
  all: ["platform", "onboarding"] as const,
  overview: () => [...onboardingKeys.all, "overview"] as const,
  active: (limit: number) => [...onboardingKeys.all, "active", limit] as const,
  stalled: (days: number) => [...onboardingKeys.all, "stalled", days] as const,
  client: (organizationId: string) =>
    [...onboardingKeys.all, "client", organizationId] as const,
};

/**
 * Hook to fetch onboarding overview statistics
 */
export function useOnboardingOverview(
  options?: Omit<UseQueryOptions<OnboardingOverview>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: onboardingKeys.overview(),
    queryFn: () => getOnboardingOverview(),
    ...options,
  });
}

/**
 * Hook to fetch active onboarding clients
 */
export function useActiveOnboarding(
  limit: number = 20,
  options?: Omit<UseQueryOptions<OnboardingSummary[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: onboardingKeys.active(limit),
    queryFn: () => getActiveOnboarding(limit),
    ...options,
  });
}

/**
 * Hook to fetch stalled onboarding clients
 */
export function useStalledOnboarding(
  stalledDays: number = 7,
  options?: Omit<UseQueryOptions<OnboardingSummary[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: onboardingKeys.stalled(stalledDays),
    queryFn: () => getStalledOnboarding(stalledDays),
    ...options,
  });
}

/**
 * Hook to fetch client onboarding progress
 */
export function useClientOnboarding(
  organizationId: string,
  options?: Omit<UseQueryOptions<ClientOnboarding>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: onboardingKeys.client(organizationId),
    queryFn: () => getClientOnboarding(organizationId),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to complete an onboarding step
 */
export function useCompleteOnboardingStep(
  options?: UseMutationOptions<
    ClientOnboarding,
    Error,
    { organizationId: string; stepKey: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, stepKey }) =>
      completeOnboardingStep(organizationId, stepKey),
    onSuccess: (data, { organizationId }) => {
      queryClient.setQueryData(onboardingKeys.client(organizationId), data);
      queryClient.invalidateQueries({ queryKey: onboardingKeys.overview() });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to skip an onboarding step
 */
export function useSkipOnboardingStep(
  options?: UseMutationOptions<
    ClientOnboarding,
    Error,
    { organizationId: string; stepKey: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, stepKey }) =>
      skipOnboardingStep(organizationId, stepKey),
    onSuccess: (data, { organizationId }) => {
      queryClient.setQueryData(onboardingKeys.client(organizationId), data);
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to reset client onboarding
 */
export function useResetOnboarding(
  options?: UseMutationOptions<ClientOnboarding, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId) => resetOnboarding(organizationId),
    onSuccess: (data, organizationId) => {
      queryClient.setQueryData(onboardingKeys.client(organizationId), data);
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to send onboarding reminder
 */
export function useSendOnboardingReminder(
  options?: UseMutationOptions<
    { success: boolean; message: string },
    Error,
    string
  >
) {
  return useMutation({
    mutationFn: (organizationId) => sendOnboardingReminder(organizationId),
    ...options,
  });
}
