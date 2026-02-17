import { api } from "../client";
import type { PageResponse } from "../../../types/api";
import type {
  ImpersonationSessionResponse,
  ActiveSessionsResponse,
  StartImpersonationRequest,
  ImpersonationFilters,
} from "../../../types/platform/impersonation";

const BASE_URL = "api/v1/platform/access";

/**
 * Start impersonation session
 */
export async function startImpersonation(
  data: StartImpersonationRequest
): Promise<ImpersonationSessionResponse> {
  return api.post(`${BASE_URL}/impersonate`, { json: data }).json<ImpersonationSessionResponse>();
}

/**
 * End current impersonation session
 */
export async function endImpersonation(): Promise<void> {
  await api.post(`${BASE_URL}/end-impersonation`);
}

/**
 * Get active impersonation sessions
 */
export async function getActiveSessions(): Promise<ActiveSessionsResponse> {
  return api.get(`${BASE_URL}/sessions/active`).json<ActiveSessionsResponse>();
}

/**
 * Get impersonation session history
 */
export async function getSessionHistory(
  filters?: ImpersonationFilters
): Promise<PageResponse<ImpersonationSessionResponse>> {
  const searchParams: Record<string, string> = {};
  if (filters?.platformUserId) searchParams.platformUserId = filters.platformUserId;
  if (filters?.targetUserId) searchParams.targetUserId = filters.targetUserId;
  if (filters?.tenantId) searchParams.tenantId = filters.tenantId;
  if (filters?.status) searchParams.status = filters.status;
  if (filters?.startDate) searchParams.startDate = filters.startDate;
  if (filters?.endDate) searchParams.endDate = filters.endDate;
  if (filters?.page !== undefined) searchParams.page = String(filters.page);
  if (filters?.size !== undefined) searchParams.size = String(filters.size);

  return api
    .get(`${BASE_URL}/sessions/history`, { searchParams })
    .json<PageResponse<ImpersonationSessionResponse>>();
}

/**
 * Force end an impersonation session
 */
export async function forceEndSession(sessionId: string): Promise<void> {
  await api.post(`${BASE_URL}/sessions/${sessionId}/force-end`);
}
