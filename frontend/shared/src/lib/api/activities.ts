import { apiClient } from "./client";

const ENDPOINT = "api/members";
const ACTIVITIES_ENDPOINT = "api/activities";

// Types
export type ActivityType =
  | "STATUS_CHANGED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_FROZEN"
  | "SUBSCRIPTION_UNFROZEN"
  | "SUBSCRIPTION_CANCELLED"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_UPGRADED"
  | "SUBSCRIPTION_DOWNGRADED"
  | "PROFILE_UPDATED"
  | "PHOTO_UPDATED"
  | "HEALTH_INFO_UPDATED"
  | "PREFERENCES_UPDATED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_FAILED"
  | "REFUND_ISSUED"
  | "WALLET_CREDITED"
  | "WALLET_DEBITED"
  | "INVOICE_CREATED"
  | "CHECK_IN"
  | "CHECK_OUT"
  | "EMAIL_SENT"
  | "SMS_SENT"
  | "WHATSAPP_SENT"
  | "CALL_LOGGED"
  | "NOTE_ADDED"
  | "TASK_CREATED"
  | "TASK_COMPLETED"
  | "DOCUMENT_UPLOADED"
  | "CONTRACT_SIGNED"
  | "CONTRACT_TERMINATED"
  | "ONBOARDING_STEP_COMPLETED"
  | "ONBOARDING_COMPLETED"
  | "REFERRAL_MADE"
  | "REFERRAL_REWARD_EARNED"
  | "SYSTEM_ACTION"
  | "MEMBER_CREATED"
  | "AGREEMENT_SIGNED";

export interface MemberActivity {
  id: string;
  memberId: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  performedByUserId?: string;
  performedByName?: string;
  createdAt: string;
}

export interface ActivitySummary {
  totalActivities: number;
  recentActivities: MemberActivity[];
  activityCounts: Record<string, number>;
  lastActivity?: MemberActivity;
}

export interface CreateActivityRequest {
  activityType: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
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
 * Get activity timeline for a member
 */
export async function getActivityTimeline(
  memberId: string,
  params?: {
    types?: ActivityType[];
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }
): Promise<PageResponse<MemberActivity>> {
  const searchParams = new URLSearchParams();
  if (params?.types && params.types.length > 0) {
    params.types.forEach((type) => searchParams.append("types", type));
  }
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.page !== undefined) searchParams.set("page", params.page.toString());
  if (params?.size !== undefined) searchParams.set("size", params.size.toString());

  const query = searchParams.toString();
  return apiClient.get(`${ENDPOINT}/${memberId}/activities${query ? `?${query}` : ""}`).json();
}

/**
 * Get recent activities for a member
 */
export async function getRecentActivities(
  memberId: string,
  limit: number = 10
): Promise<MemberActivity[]> {
  return apiClient.get(`${ENDPOINT}/${memberId}/activities/recent?limit=${limit}`).json();
}

/**
 * Get activity summary for a member
 */
export async function getActivitySummary(memberId: string): Promise<ActivitySummary> {
  return apiClient.get(`${ENDPOINT}/${memberId}/activities/summary`).json();
}

/**
 * Log a manual activity
 */
export async function logActivity(
  memberId: string,
  request: CreateActivityRequest
): Promise<MemberActivity> {
  return apiClient.post(`${ENDPOINT}/${memberId}/activities`, { json: request }).json();
}

/**
 * Get available activity types
 */
export async function getActivityTypes(): Promise<ActivityType[]> {
  return apiClient.get(`${ACTIVITIES_ENDPOINT}/types`).json();
}

/**
 * Get activities performed by a specific staff member
 */
export async function getActivitiesByStaff(
  userId: string,
  params?: {
    page?: number;
    size?: number;
  }
): Promise<PageResponse<MemberActivity>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", params.page.toString());
  if (params?.size !== undefined) searchParams.set("size", params.size.toString());

  const query = searchParams.toString();
  return apiClient.get(`${ACTIVITIES_ENDPOINT}/by-staff/${userId}${query ? `?${query}` : ""}`).json();
}
