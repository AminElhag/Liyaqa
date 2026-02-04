import { api } from "./client";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  DataProcessingActivity,
  ConsentRecord,
  DataSubjectRequest,
  DataBreach,
  DataProtectionStats,
  DSRStats,
  BreachStats,
  DataProcessingActivityParams,
  ConsentParams,
  DSRParams,
  BreachParams,
  CreateActivityRequest,
  RecordConsentRequest,
  WithdrawConsentRequest,
  CreateDSRRequest,
  VerifyIdentityRequest,
  CompleteDSRRequest,
  ExtendDSRRequest,
  ReportBreachRequest,
  ResolveBreachRequest,
  ResponseMethod,
  VerificationMethod,
} from "../types/data-protection";

const BASE_URL = "api/data-protection";

// ===== Processing Activities (PDPL Article 7) =====

export async function getActivities(
  params: DataProcessingActivityParams = {}
): Promise<PaginatedResponse<DataProcessingActivity>> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/activities?${query}` : `${BASE_URL}/activities`;
  return api.get(url).json();
}

export async function getActivity(id: UUID): Promise<DataProcessingActivity> {
  return api.get(`${BASE_URL}/activities/${id}`).json();
}

export async function createActivity(
  request: CreateActivityRequest
): Promise<DataProcessingActivity> {
  return api.post(`${BASE_URL}/activities`, { json: request }).json();
}

export async function activateActivity(id: UUID): Promise<DataProcessingActivity> {
  return api.post(`${BASE_URL}/activities/${id}/activate`).json();
}

export async function archiveActivity(id: UUID): Promise<DataProcessingActivity> {
  return api.post(`${BASE_URL}/activities/${id}/archive`).json();
}

export async function getActivityStats(): Promise<DataProtectionStats> {
  return api.get(`${BASE_URL}/activities/stats`).json();
}

// ===== Consents (PDPL Article 6) =====

export async function getConsents(
  params: ConsentParams = {}
): Promise<PaginatedResponse<ConsentRecord>> {
  const searchParams = new URLSearchParams();
  if (params.consentType) searchParams.set("consentType", params.consentType);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/consents?${query}` : `${BASE_URL}/consents`;
  return api.get(url).json();
}

export async function getMemberConsents(memberId: UUID): Promise<ConsentRecord[]> {
  return api.get(`${BASE_URL}/consents/member/${memberId}`).json();
}

export async function getActiveConsents(memberId: UUID): Promise<ConsentRecord[]> {
  return api.get(`${BASE_URL}/consents/member/${memberId}/active`).json();
}

export async function recordConsent(request: RecordConsentRequest): Promise<ConsentRecord> {
  return api.post(`${BASE_URL}/consents`, { json: request }).json();
}

export async function withdrawConsent(
  id: UUID,
  request: WithdrawConsentRequest
): Promise<ConsentRecord> {
  return api.post(`${BASE_URL}/consents/${id}/withdraw`, { json: request }).json();
}

// ===== Data Subject Requests (PDPL Articles 15-23) =====

export async function getDSRs(
  params: DSRParams = {}
): Promise<PaginatedResponse<DataSubjectRequest>> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.requestType) searchParams.set("requestType", params.requestType);
  if (params.priority) searchParams.set("priority", params.priority);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/requests?${query}` : `${BASE_URL}/requests`;
  return api.get(url).json();
}

export async function getDSR(id: UUID): Promise<DataSubjectRequest> {
  return api.get(`${BASE_URL}/requests/${id}`).json();
}

export async function getOverdueDSRs(): Promise<DataSubjectRequest[]> {
  return api.get(`${BASE_URL}/requests/overdue`).json();
}

export async function createDSR(request: CreateDSRRequest): Promise<DataSubjectRequest> {
  return api.post(`${BASE_URL}/requests`, { json: request }).json();
}

export async function verifyDSRIdentity(
  id: UUID,
  request: VerifyIdentityRequest
): Promise<DataSubjectRequest> {
  return api.post(`${BASE_URL}/requests/${id}/verify`, { json: request }).json();
}

export async function assignDSR(id: UUID, userId: UUID): Promise<DataSubjectRequest> {
  return api.post(`${BASE_URL}/requests/${id}/assign?userId=${userId}`).json();
}

export async function startDSRProcessing(id: UUID): Promise<DataSubjectRequest> {
  return api.post(`${BASE_URL}/requests/${id}/start`).json();
}

export async function completeDSR(
  id: UUID,
  request: CompleteDSRRequest
): Promise<DataSubjectRequest> {
  return api.post(`${BASE_URL}/requests/${id}/complete`, { json: request }).json();
}

export async function rejectDSR(id: UUID, reason: string): Promise<DataSubjectRequest> {
  return api.post(`${BASE_URL}/requests/${id}/reject?reason=${encodeURIComponent(reason)}`).json();
}

export async function extendDSRDeadline(
  id: UUID,
  request: ExtendDSRRequest
): Promise<DataSubjectRequest> {
  return api.post(`${BASE_URL}/requests/${id}/extend`, { json: request }).json();
}

export async function getDSRStats(): Promise<DSRStats> {
  return api.get(`${BASE_URL}/requests/stats`).json();
}

// ===== Breaches (PDPL Article 29) =====

export async function getBreaches(
  params: BreachParams = {}
): Promise<PaginatedResponse<DataBreach>> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.severity) searchParams.set("severity", params.severity);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/breaches?${query}` : `${BASE_URL}/breaches`;
  return api.get(url).json();
}

export async function getBreach(id: UUID): Promise<DataBreach> {
  return api.get(`${BASE_URL}/breaches/${id}`).json();
}

export async function reportBreach(request: ReportBreachRequest): Promise<DataBreach> {
  return api.post(`${BASE_URL}/breaches`, { json: request }).json();
}

export async function startBreachInvestigation(id: UUID): Promise<DataBreach> {
  return api.post(`${BASE_URL}/breaches/${id}/investigate`).json();
}

export async function containBreach(id: UUID): Promise<DataBreach> {
  return api.post(`${BASE_URL}/breaches/${id}/contain`).json();
}

export async function resolveBreach(
  id: UUID,
  request: ResolveBreachRequest
): Promise<DataBreach> {
  return api.post(`${BASE_URL}/breaches/${id}/resolve`, { json: request }).json();
}

export async function recordSdaiaNotification(
  id: UUID,
  reference: string
): Promise<DataBreach> {
  return api.post(`${BASE_URL}/breaches/${id}/sdaia-notification?reference=${encodeURIComponent(reference)}`).json();
}

export async function getBreachStats(): Promise<BreachStats> {
  return api.get(`${BASE_URL}/breaches/stats`).json();
}
