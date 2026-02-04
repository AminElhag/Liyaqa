import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  SecurityPolicy,
  PolicyAcknowledgement,
  PolicyParams,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  AcknowledgePolicyRequest,
  PolicyType,
} from "../../types/policy";

const BASE_URL = "api/policies";

// ===== Policies =====

export async function getPolicies(
  params: PolicyParams = {}
): Promise<PaginatedResponse<SecurityPolicy>> {
  const searchParams = new URLSearchParams();
  if (params.policyType) searchParams.set("policyType", params.policyType);
  if (params.status) searchParams.set("status", params.status);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;
  return api.get(url).json();
}

export async function getPolicy(id: UUID): Promise<SecurityPolicy> {
  return api.get(`${BASE_URL}/${id}`).json();
}

export async function getPoliciesByType(type: PolicyType): Promise<SecurityPolicy[]> {
  return api.get(`${BASE_URL}/type/${type}`).json();
}

export async function getPublishedPolicy(type: PolicyType): Promise<SecurityPolicy | null> {
  return api.get(`${BASE_URL}/type/${type}/published`).json();
}

export async function getPoliciesRequiringAcknowledgement(): Promise<SecurityPolicy[]> {
  return api.get(`${BASE_URL}/requiring-acknowledgement`).json();
}

export async function getPoliciesDueForReview(): Promise<SecurityPolicy[]> {
  return api.get(`${BASE_URL}/review-due`).json();
}

export async function getPendingAcknowledgements(): Promise<SecurityPolicy[]> {
  return api.get(`${BASE_URL}/pending-acknowledgement`).json();
}

export async function createPolicy(request: CreatePolicyRequest): Promise<SecurityPolicy> {
  return api.post(BASE_URL, { json: request }).json();
}

export async function updatePolicy(
  id: UUID,
  request: UpdatePolicyRequest
): Promise<SecurityPolicy> {
  return api.put(`${BASE_URL}/${id}`, { json: request }).json();
}

export async function createNewVersion(id: UUID): Promise<SecurityPolicy> {
  return api.post(`${BASE_URL}/${id}/new-version`).json();
}

export async function submitForReview(id: UUID): Promise<SecurityPolicy> {
  return api.post(`${BASE_URL}/${id}/submit-for-review`).json();
}

export async function approvePolicy(id: UUID): Promise<SecurityPolicy> {
  return api.post(`${BASE_URL}/${id}/approve`).json();
}

export async function publishPolicy(
  id: UUID,
  effectiveDate?: string
): Promise<SecurityPolicy> {
  const searchParams = new URLSearchParams();
  if (effectiveDate) searchParams.set("effectiveDate", effectiveDate);
  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/${id}/publish?${query}` : `${BASE_URL}/${id}/publish`;
  return api.post(url).json();
}

export async function returnToDraft(id: UUID): Promise<SecurityPolicy> {
  return api.post(`${BASE_URL}/${id}/return-to-draft`).json();
}

export async function archivePolicy(id: UUID): Promise<SecurityPolicy> {
  return api.post(`${BASE_URL}/${id}/archive`).json();
}

export async function completeReview(
  id: UUID,
  nextReviewDate: string
): Promise<SecurityPolicy> {
  return api.post(`${BASE_URL}/${id}/complete-review?nextReviewDate=${nextReviewDate}`).json();
}

// ===== Acknowledgements =====

export async function getPolicyAcknowledgements(policyId: UUID): Promise<PolicyAcknowledgement[]> {
  return api.get(`${BASE_URL}/${policyId}/acknowledgements`).json();
}

export async function getAcknowledgementCount(policyId: UUID): Promise<number> {
  return api.get(`${BASE_URL}/${policyId}/acknowledgements/count`).json();
}

export async function hasAcknowledged(policyId: UUID): Promise<boolean> {
  return api.get(`${BASE_URL}/${policyId}/acknowledged`).json();
}

export async function acknowledgePolicy(
  policyId: UUID,
  request: AcknowledgePolicyRequest
): Promise<PolicyAcknowledgement> {
  return api.post(`${BASE_URL}/${policyId}/acknowledge`, { json: request }).json();
}

export async function getMyAcknowledgements(): Promise<PolicyAcknowledgement[]> {
  return api.get(`${BASE_URL}/my-acknowledgements`).json();
}
