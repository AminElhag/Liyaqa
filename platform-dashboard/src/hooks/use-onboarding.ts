import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClientOnboarding,
  getOnboardingOverview,
  getActiveOnboarding,
  getStalledOnboarding,
  completeOnboardingStep,
  skipOnboardingStep,
  resetOnboarding,
  sendOnboardingReminder,
} from '@/api/endpoints/onboarding'

// Query key factory
export const onboardingKeys = {
  all: ['onboarding'] as const,
  overview: () => [...onboardingKeys.all, 'overview'] as const,
  active: (limit: number) => [...onboardingKeys.all, 'active', limit] as const,
  stalled: (stalledDays: number) =>
    [...onboardingKeys.all, 'stalled', stalledDays] as const,
  details: () => [...onboardingKeys.all, 'detail'] as const,
  detail: (organizationId: string) =>
    [...onboardingKeys.details(), organizationId] as const,
}

// ============================================
// Query hooks
// ============================================

export function useOnboardingOverview() {
  return useQuery({
    queryKey: onboardingKeys.overview(),
    queryFn: getOnboardingOverview,
    staleTime: 300_000,
  })
}

export function useActiveOnboarding(limit: number = 20) {
  return useQuery({
    queryKey: onboardingKeys.active(limit),
    queryFn: () => getActiveOnboarding(limit),
    staleTime: 120_000,
  })
}

export function useStalledOnboarding(stalledDays: number = 7) {
  return useQuery({
    queryKey: onboardingKeys.stalled(stalledDays),
    queryFn: () => getStalledOnboarding(stalledDays),
    staleTime: 120_000,
  })
}

export function useClientOnboarding(organizationId: string) {
  return useQuery({
    queryKey: onboardingKeys.detail(organizationId),
    queryFn: () => getClientOnboarding(organizationId),
    staleTime: 60_000,
    enabled: !!organizationId,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useCompleteOnboardingStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      stepKey,
    }: {
      organizationId: string
      stepKey: string
    }) => completeOnboardingStep(organizationId, stepKey),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.detail(variables.organizationId),
      })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.overview() })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all })
    },
  })
}

export function useSkipOnboardingStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      stepKey,
    }: {
      organizationId: string
      stepKey: string
    }) => skipOnboardingStep(organizationId, stepKey),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.detail(variables.organizationId),
      })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.overview() })
    },
  })
}

export function useResetOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (organizationId: string) => resetOnboarding(organizationId),
    onSuccess: (_data, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.detail(organizationId),
      })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.overview() })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all })
    },
  })
}

export function useSendOnboardingReminder() {
  return useMutation({
    mutationFn: (organizationId: string) => sendOnboardingReminder(organizationId),
  })
}
