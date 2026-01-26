import { api } from "./client";
import type { UUID, PaginatedResponse } from "@/types/api";
import type {
  ChurnModel,
  MemberChurnPrediction,
  ChurnIntervention,
  InterventionTemplate,
  RiskDistribution,
  RiskLevel,
  GeneratePredictionsRequest,
  CreateInterventionRequest,
  RecordOutcomeRequest,
  RecordInterventionOutcomeRequest,
  CreateInterventionTemplateRequest,
} from "@/types/churn";

const ENDPOINT = "api/churn";

// ========== Churn Models ==========

export async function getChurnModels(
  page = 0,
  size = 20
): Promise<PaginatedResponse<ChurnModel>> {
  return api.get(`${ENDPOINT}/models?page=${page}&size=${size}`).json();
}

export async function getChurnModel(id: UUID): Promise<ChurnModel> {
  return api.get(`${ENDPOINT}/models/${id}`).json();
}

export async function getActiveChurnModel(): Promise<ChurnModel> {
  return api.get(`${ENDPOINT}/models/active`).json();
}

export async function activateChurnModel(id: UUID): Promise<ChurnModel> {
  return api.post(`${ENDPOINT}/models/${id}/activate`).json();
}

// ========== Predictions ==========

export async function generatePredictions(
  data: GeneratePredictionsRequest
): Promise<MemberChurnPrediction[]> {
  return api.post(`${ENDPOINT}/predictions/generate`, { json: data }).json();
}

export async function getPredictions(
  page = 0,
  size = 20
): Promise<PaginatedResponse<MemberChurnPrediction>> {
  return api.get(`${ENDPOINT}/predictions?page=${page}&size=${size}`).json();
}

export async function getPrediction(id: UUID): Promise<MemberChurnPrediction> {
  return api.get(`${ENDPOINT}/predictions/${id}`).json();
}

export async function getAtRiskMembers(
  page = 0,
  size = 20
): Promise<PaginatedResponse<MemberChurnPrediction>> {
  return api.get(`${ENDPOINT}/predictions/at-risk?page=${page}&size=${size}`).json();
}

export async function getPredictionsByRiskLevel(
  riskLevel: RiskLevel,
  page = 0,
  size = 20
): Promise<PaginatedResponse<MemberChurnPrediction>> {
  return api
    .get(`${ENDPOINT}/predictions/by-risk/${riskLevel}?page=${page}&size=${size}`)
    .json();
}

export async function getRiskDistribution(): Promise<RiskDistribution> {
  return api.get(`${ENDPOINT}/predictions/distribution`).json();
}

export async function recordPredictionOutcome(
  id: UUID,
  data: RecordOutcomeRequest
): Promise<MemberChurnPrediction> {
  return api.post(`${ENDPOINT}/predictions/${id}/outcome`, { json: data }).json();
}

// ========== Interventions ==========

export async function createIntervention(
  data: CreateInterventionRequest
): Promise<ChurnIntervention> {
  return api.post(`${ENDPOINT}/interventions`, { json: data }).json();
}

export async function getInterventions(
  page = 0,
  size = 20
): Promise<PaginatedResponse<ChurnIntervention>> {
  return api.get(`${ENDPOINT}/interventions?page=${page}&size=${size}`).json();
}

export async function getIntervention(id: UUID): Promise<ChurnIntervention> {
  return api.get(`${ENDPOINT}/interventions/${id}`).json();
}

export async function assignIntervention(
  id: UUID,
  assignedTo: UUID
): Promise<ChurnIntervention> {
  return api.post(`${ENDPOINT}/interventions/${id}/assign`, { json: { assignedTo } }).json();
}

export async function executeIntervention(id: UUID): Promise<ChurnIntervention> {
  return api.post(`${ENDPOINT}/interventions/${id}/execute`).json();
}

export async function recordInterventionOutcome(
  id: UUID,
  data: RecordInterventionOutcomeRequest
): Promise<ChurnIntervention> {
  return api.post(`${ENDPOINT}/interventions/${id}/outcome`, { json: data }).json();
}

export async function deleteIntervention(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/interventions/${id}`);
}

// ========== Templates ==========

export async function createInterventionTemplate(
  data: CreateInterventionTemplateRequest
): Promise<InterventionTemplate> {
  return api.post(`${ENDPOINT}/templates`, { json: data }).json();
}

export async function getInterventionTemplates(): Promise<InterventionTemplate[]> {
  return api.get(`${ENDPOINT}/templates`).json();
}

export async function getActiveInterventionTemplates(): Promise<InterventionTemplate[]> {
  return api.get(`${ENDPOINT}/templates/active`).json();
}

export async function getInterventionTemplate(id: UUID): Promise<InterventionTemplate> {
  return api.get(`${ENDPOINT}/templates/${id}`).json();
}

export async function deleteInterventionTemplate(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/templates/${id}`);
}
