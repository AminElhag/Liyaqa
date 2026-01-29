import { api } from "../client";
import type {
  ClientOnboarding,
  OnboardingOverview,
  OnboardingSummary,
} from "@/types/platform/onboarding";

const BASE_URL = "api/platform/onboarding";

/**
 * Get client onboarding progress
 */
export async function getClientOnboarding(
  organizationId: string
): Promise<ClientOnboarding> {
  return api.get(`${BASE_URL}/${organizationId}`).json<ClientOnboarding>();
}

/**
 * Get onboarding overview statistics
 */
export async function getOnboardingOverview(): Promise<OnboardingOverview> {
  return api.get(`${BASE_URL}/overview`).json<OnboardingOverview>();
}

/**
 * Get all clients currently in onboarding
 */
export async function getActiveOnboarding(
  limit: number = 20
): Promise<OnboardingSummary[]> {
  return api
    .get(`${BASE_URL}/active`, { searchParams: { limit: String(limit) } })
    .json<OnboardingSummary[]>();
}

/**
 * Get stalled onboarding clients
 */
export async function getStalledOnboarding(
  stalledDays: number = 7
): Promise<OnboardingSummary[]> {
  return api
    .get(`${BASE_URL}/stalled`, {
      searchParams: { stalledDays: String(stalledDays) },
    })
    .json<OnboardingSummary[]>();
}

/**
 * Complete an onboarding step
 */
export async function completeOnboardingStep(
  organizationId: string,
  stepKey: string
): Promise<ClientOnboarding> {
  return api
    .post(`${BASE_URL}/${organizationId}/complete-step`, {
      json: { stepKey },
    })
    .json<ClientOnboarding>();
}

/**
 * Skip an onboarding step
 */
export async function skipOnboardingStep(
  organizationId: string,
  stepKey: string
): Promise<ClientOnboarding> {
  return api
    .post(`${BASE_URL}/${organizationId}/skip-step`, {
      json: { stepKey },
    })
    .json<ClientOnboarding>();
}

/**
 * Reset client onboarding progress
 */
export async function resetOnboarding(
  organizationId: string
): Promise<ClientOnboarding> {
  return api.post(`${BASE_URL}/${organizationId}/reset`).json<ClientOnboarding>();
}

/**
 * Send onboarding reminder to client
 */
export async function sendOnboardingReminder(
  organizationId: string
): Promise<{ success: boolean; message: string }> {
  return api
    .post(`${BASE_URL}/${organizationId}/send-reminder`)
    .json<{ success: boolean; message: string }>();
}
