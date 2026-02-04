import { apiClient } from "./client";

const ENDPOINT = "api/onboardings";
const MEMBERS_ENDPOINT = "api/members";

// Types
export type OnboardingStep =
  | "WELCOME_EMAIL"
  | "FACILITY_TOUR"
  | "FITNESS_ASSESSMENT"
  | "FIRST_WORKOUT"
  | "APP_SETUP"
  | "PROFILE_PHOTO"
  | "DAY7_CHECKIN"
  | "DAY14_PROGRESS"
  | "DAY30_REVIEW";

export type StepCompletionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

export interface StepStatus {
  status: StepCompletionStatus;
  completedAt?: string;
  completedByUserId?: string;
  notes?: string;
}

export interface MemberOnboarding {
  id: string;
  memberId: string;
  memberName?: string;
  steps: Record<OnboardingStep, StepStatus>;
  currentStep?: OnboardingStep;
  startedAt: string;
  completedAt?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  notes?: string;
  isComplete: boolean;
  completionPercentage: number;
  daysSinceStart: number;
  isOverdue: boolean;
  pendingSteps: OnboardingStep[];
  completedSteps: OnboardingStep[];
}

export interface OnboardingChecklistItem {
  step: OnboardingStep;
  title: string;
  description: string;
  dayRange: string;
  status: StepCompletionStatus;
  completedAt?: string;
}

export interface OnboardingChecklist {
  memberId: string;
  memberName?: string;
  startedAt: string;
  completionPercentage: number;
  items: OnboardingChecklistItem[];
}

export interface OnboardingStats {
  totalIncomplete: number;
  totalOverdue: number;
  myIncomplete: number;
  averageCompletionDays: number;
}

export interface CreateOnboardingRequest {
  memberId: string;
  assignedToUserId?: string;
}

export interface CompleteStepRequest {
  step: OnboardingStep;
  notes?: string;
}

export interface SkipStepRequest {
  step: OnboardingStep;
  reason?: string;
}

export interface AssignOnboardingRequest {
  assigneeUserId: string;
}

export interface UpdateNotesRequest {
  notes: string;
}

export interface OnboardingStatusResponse {
  isInOnboarding: boolean;
  hasOnboarding: boolean;
  isComplete: boolean;
  completionPercentage: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// API Functions

/**
 * Create an onboarding for a member
 */
export async function createOnboarding(
  request: CreateOnboardingRequest
): Promise<MemberOnboarding> {
  return apiClient.post(ENDPOINT, { json: request }).json();
}

/**
 * Get onboarding for a member
 */
export async function getMemberOnboarding(memberId: string): Promise<MemberOnboarding | null> {
  return apiClient.get(`${MEMBERS_ENDPOINT}/${memberId}/onboarding`).json();
}

/**
 * Get onboarding checklist for a member
 */
export async function getMemberOnboardingChecklist(
  memberId: string
): Promise<OnboardingChecklist | null> {
  return apiClient.get(`${MEMBERS_ENDPOINT}/${memberId}/onboarding/checklist`).json();
}

/**
 * Check if a member is in onboarding
 */
export async function getOnboardingStatus(memberId: string): Promise<OnboardingStatusResponse> {
  return apiClient.get(`${MEMBERS_ENDPOINT}/${memberId}/onboarding/status`).json();
}

/**
 * Complete an onboarding step
 */
export async function completeOnboardingStep(
  memberId: string,
  request: CompleteStepRequest
): Promise<MemberOnboarding> {
  return apiClient
    .post(`${MEMBERS_ENDPOINT}/${memberId}/onboarding/steps/complete`, { json: request })
    .json();
}

/**
 * Skip an onboarding step
 */
export async function skipOnboardingStep(
  memberId: string,
  request: SkipStepRequest
): Promise<MemberOnboarding> {
  return apiClient
    .post(`${MEMBERS_ENDPOINT}/${memberId}/onboarding/steps/skip`, { json: request })
    .json();
}

/**
 * Assign onboarding to a staff member
 */
export async function assignOnboarding(
  memberId: string,
  request: AssignOnboardingRequest
): Promise<MemberOnboarding> {
  return apiClient
    .post(`${MEMBERS_ENDPOINT}/${memberId}/onboarding/assign`, { json: request })
    .json();
}

/**
 * Update onboarding notes
 */
export async function updateOnboardingNotes(
  memberId: string,
  request: UpdateNotesRequest
): Promise<MemberOnboarding> {
  return apiClient
    .put(`${MEMBERS_ENDPOINT}/${memberId}/onboarding/notes`, { json: request })
    .json();
}

/**
 * Get incomplete onboardings
 */
export async function getIncompleteOnboardings(params?: {
  page?: number;
  size?: number;
}): Promise<PageResponse<MemberOnboarding>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", params.page.toString());
  if (params?.size !== undefined) searchParams.set("size", params.size.toString());

  const query = searchParams.toString();
  return apiClient.get(`${ENDPOINT}/incomplete${query ? `?${query}` : ""}`).json();
}

/**
 * Get my incomplete onboardings (assigned to me)
 */
export async function getMyIncompleteOnboardings(params?: {
  page?: number;
  size?: number;
}): Promise<PageResponse<MemberOnboarding>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", params.page.toString());
  if (params?.size !== undefined) searchParams.set("size", params.size.toString());

  const query = searchParams.toString();
  return apiClient.get(`${ENDPOINT}/my-incomplete${query ? `?${query}` : ""}`).json();
}

/**
 * Get overdue onboardings
 */
export async function getOverdueOnboardings(params?: {
  page?: number;
  size?: number;
}): Promise<PageResponse<MemberOnboarding>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", params.page.toString());
  if (params?.size !== undefined) searchParams.set("size", params.size.toString());

  const query = searchParams.toString();
  return apiClient.get(`${ENDPOINT}/overdue${query ? `?${query}` : ""}`).json();
}

/**
 * Get recently started onboardings
 */
export async function getRecentOnboardings(params?: {
  days?: number;
  page?: number;
  size?: number;
}): Promise<PageResponse<MemberOnboarding>> {
  const searchParams = new URLSearchParams();
  if (params?.days !== undefined) searchParams.set("days", params.days.toString());
  if (params?.page !== undefined) searchParams.set("page", params.page.toString());
  if (params?.size !== undefined) searchParams.set("size", params.size.toString());

  const query = searchParams.toString();
  return apiClient.get(`${ENDPOINT}/recent${query ? `?${query}` : ""}`).json();
}

/**
 * Get onboarding statistics
 */
export async function getOnboardingStats(): Promise<OnboardingStats> {
  return apiClient.get(`${ENDPOINT}/stats`).json();
}

/**
 * Get available onboarding steps
 */
export async function getOnboardingSteps(): Promise<OnboardingStep[]> {
  return apiClient.get(`${ENDPOINT}/steps`).json();
}
