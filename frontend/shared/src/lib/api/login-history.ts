import { apiClient } from "./client";

export enum LoginAttemptType {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  LOCKED = "LOCKED",
  MFA_REQUIRED = "MFA_REQUIRED",
  MFA_SUCCESS = "MFA_SUCCESS",
  MFA_FAILED = "MFA_FAILED",
}

export interface LoginAttempt {
  id: string;
  userId: string | null;
  email: string;
  ipAddress: string;
  deviceDescription: string;
  locationDescription: string;
  attemptType: LoginAttemptType;
  failureReason: string | null;
  timestamp: string;
  flaggedAsSuspicious: boolean;
  acknowledgedAt: string | null;
  browser: string | null;
  os: string | null;
  deviceName: string | null;
}

export interface LoginHistoryPage {
  content: LoginAttempt[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface LoginStats {
  successfulLogins30Days: number;
  failedLogins30Days: number;
  suspiciousLogins: number;
  uniqueDevices: number;
}

/**
 * Fetches login history for the authenticated user.
 */
export async function getLoginHistory(
  page: number = 0,
  size: number = 20
): Promise<LoginHistoryPage> {
  return apiClient.get(
    `/api/auth/login-history?page=${page}&size=${size}`
  ).json<LoginHistoryPage>();
}

/**
 * Fetches suspicious login attempts.
 */
export async function getSuspiciousAttempts(
  page: number = 0,
  size: number = 20
): Promise<LoginHistoryPage> {
  return apiClient.get(
    `/api/auth/login-history/suspicious?page=${page}&size=${size}`
  ).json<LoginHistoryPage>();
}

/**
 * Acknowledges a suspicious login attempt.
 */
export async function acknowledgeSuspiciousLogin(
  attemptId: string
): Promise<void> {
  await apiClient.post(`/api/auth/login-history/${attemptId}/acknowledge`);
}

/**
 * Fetches login statistics for the authenticated user.
 */
export async function getLoginStats(): Promise<LoginStats> {
  return apiClient.get(
    "/api/auth/login-history/stats"
  ).json<LoginStats>();
}
