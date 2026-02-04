import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  RiskAssessment,
  IdentifiedRisk,
  RiskStats,
  RiskAssessmentParams,
  IdentifiedRiskParams,
  CreateAssessmentRequest,
  AddRiskRequest,
  UpdateRiskRequest,
  CompleteTreatmentRequest,
} from "../../types/risk";

const BASE_URL = "api/risks";

// ===== Risk Assessments =====

export async function getAssessments(
  params: RiskAssessmentParams = {}
): Promise<PaginatedResponse<RiskAssessment>> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/assessments?${query}` : `${BASE_URL}/assessments`;
  return api.get(url).json();
}

export async function getAssessment(id: UUID): Promise<RiskAssessment> {
  return api.get(`${BASE_URL}/assessments/${id}`).json();
}

export async function getLatestAssessment(): Promise<RiskAssessment | null> {
  return api.get(`${BASE_URL}/assessments/latest`).json();
}

export async function createAssessment(request: CreateAssessmentRequest): Promise<RiskAssessment> {
  return api.post(`${BASE_URL}/assessments`, { json: request }).json();
}

export async function startAssessment(id: UUID): Promise<RiskAssessment> {
  return api.post(`${BASE_URL}/assessments/${id}/start`).json();
}

export async function completeAssessment(id: UUID): Promise<RiskAssessment> {
  return api.post(`${BASE_URL}/assessments/${id}/complete`).json();
}

export async function approveAssessment(id: UUID): Promise<RiskAssessment> {
  return api.post(`${BASE_URL}/assessments/${id}/approve`).json();
}

export async function archiveAssessment(id: UUID): Promise<RiskAssessment> {
  return api.post(`${BASE_URL}/assessments/${id}/archive`).json();
}

// ===== Identified Risks =====

export async function getAssessmentRisks(assessmentId: UUID): Promise<IdentifiedRisk[]> {
  return api.get(`${BASE_URL}/assessments/${assessmentId}/risks`).json();
}

export async function getRisk(id: UUID): Promise<IdentifiedRisk> {
  return api.get(`${BASE_URL}/risks/${id}`).json();
}

export async function addRisk(assessmentId: UUID, request: AddRiskRequest): Promise<IdentifiedRisk> {
  return api.post(`${BASE_URL}/assessments/${assessmentId}/risks`, { json: request }).json();
}

export async function updateRisk(id: UUID, request: UpdateRiskRequest): Promise<IdentifiedRisk> {
  return api.put(`${BASE_URL}/risks/${id}`, { json: request }).json();
}

export async function startTreatment(id: UUID): Promise<IdentifiedRisk> {
  return api.post(`${BASE_URL}/risks/${id}/start-treatment`).json();
}

export async function completeTreatment(
  id: UUID,
  request: CompleteTreatmentRequest
): Promise<IdentifiedRisk> {
  return api.post(`${BASE_URL}/risks/${id}/complete-treatment`, { json: request }).json();
}

export async function getOverdueTreatments(assessmentId: UUID): Promise<IdentifiedRisk[]> {
  return api.get(`${BASE_URL}/assessments/${assessmentId}/risks/overdue`).json();
}

export async function getRiskStats(assessmentId: UUID): Promise<RiskStats> {
  return api.get(`${BASE_URL}/assessments/${assessmentId}/stats`).json();
}
