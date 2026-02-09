import api from '@/api/client'
import type {
  ClientOnboarding,
  OnboardingOverview,
  OnboardingSummary,
} from '@/types'

const BASE_URL = 'api/platform/onboarding'

/**
 * Get client onboarding progress.
 */
export async function getClientOnboarding(
  organizationId: string,
): Promise<ClientOnboarding> {
  return api
    .get<ClientOnboarding>(`${BASE_URL}/${organizationId}`)
    .then((r) => r.data)
}

/**
 * Get onboarding overview statistics.
 */
export async function getOnboardingOverview(): Promise<OnboardingOverview> {
  return api.get<OnboardingOverview>(`${BASE_URL}/overview`).then((r) => r.data)
}

/**
 * Get all clients currently in onboarding.
 */
export async function getActiveOnboarding(
  limit: number = 20,
): Promise<OnboardingSummary[]> {
  return api
    .get<OnboardingSummary[]>(`${BASE_URL}/active`, { params: { limit } })
    .then((r) => r.data)
}

/**
 * Get stalled onboarding clients.
 */
export async function getStalledOnboarding(
  stalledDays: number = 7,
): Promise<OnboardingSummary[]> {
  return api
    .get<OnboardingSummary[]>(`${BASE_URL}/stalled`, { params: { stalledDays } })
    .then((r) => r.data)
}

/**
 * Complete an onboarding step.
 */
export async function completeOnboardingStep(
  organizationId: string,
  stepKey: string,
): Promise<ClientOnboarding> {
  return api
    .post<ClientOnboarding>(`${BASE_URL}/${organizationId}/complete-step`, {
      stepKey,
    })
    .then((r) => r.data)
}

/**
 * Skip an onboarding step.
 */
export async function skipOnboardingStep(
  organizationId: string,
  stepKey: string,
): Promise<ClientOnboarding> {
  return api
    .post<ClientOnboarding>(`${BASE_URL}/${organizationId}/skip-step`, { stepKey })
    .then((r) => r.data)
}

/**
 * Reset client onboarding progress.
 */
export async function resetOnboarding(
  organizationId: string,
): Promise<ClientOnboarding> {
  return api
    .post<ClientOnboarding>(`${BASE_URL}/${organizationId}/reset`)
    .then((r) => r.data)
}

/**
 * Send onboarding reminder to client.
 */
export async function sendOnboardingReminder(
  organizationId: string,
): Promise<{ success: boolean; message: string }> {
  return api
    .post<{ success: boolean; message: string }>(
      `${BASE_URL}/${organizationId}/send-reminder`,
    )
    .then((r) => r.data)
}
