import { api } from "./client";
import type { UUID } from "../../types/api";
import type {
  ScoringRule,
  CreateScoringRuleRequest,
  UpdateScoringRuleRequest,
  ScoringStats,
  AssignmentRule,
  CreateAssignmentRuleRequest,
  UpdateAssignmentRuleRequest,
  AssignmentStats,
  ScoringTriggerType,
} from "../../types/lead-rules";

// ===== Scoring Rules API =====

/**
 * Get all scoring rules
 */
export async function getScoringRules(params?: {
  activeOnly?: boolean;
  triggerType?: ScoringTriggerType;
}): Promise<ScoringRule[]> {
  const searchParams = new URLSearchParams();

  if (params?.activeOnly) searchParams.set("activeOnly", "true");
  if (params?.triggerType) searchParams.set("triggerType", params.triggerType);

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/leads/scoring-rules?${queryString}`
    : "api/leads/scoring-rules";

  return api.get(url).json();
}

/**
 * Get a single scoring rule by ID
 */
export async function getScoringRule(id: UUID): Promise<ScoringRule> {
  return api.get(`api/leads/scoring-rules/${id}`).json();
}

/**
 * Create a new scoring rule
 */
export async function createScoringRule(
  data: CreateScoringRuleRequest
): Promise<ScoringRule> {
  return api.post("api/leads/scoring-rules", { json: data }).json();
}

/**
 * Update a scoring rule
 */
export async function updateScoringRule(
  id: UUID,
  data: UpdateScoringRuleRequest
): Promise<ScoringRule> {
  return api.put(`api/leads/scoring-rules/${id}`, { json: data }).json();
}

/**
 * Delete a scoring rule
 */
export async function deleteScoringRule(id: UUID): Promise<void> {
  await api.delete(`api/leads/scoring-rules/${id}`);
}

/**
 * Activate a scoring rule
 */
export async function activateScoringRule(id: UUID): Promise<ScoringRule> {
  return api.post(`api/leads/scoring-rules/${id}/activate`).json();
}

/**
 * Deactivate a scoring rule
 */
export async function deactivateScoringRule(id: UUID): Promise<ScoringRule> {
  return api.post(`api/leads/scoring-rules/${id}/deactivate`).json();
}

/**
 * Get scoring rule statistics
 */
export async function getScoringStats(): Promise<ScoringStats> {
  return api.get("api/leads/scoring-rules/stats").json();
}

// ===== Assignment Rules API =====

/**
 * Get all assignment rules
 */
export async function getAssignmentRules(params?: {
  activeOnly?: boolean;
}): Promise<AssignmentRule[]> {
  const searchParams = new URLSearchParams();

  if (params?.activeOnly) searchParams.set("activeOnly", "true");

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/leads/assignment-rules?${queryString}`
    : "api/leads/assignment-rules";

  return api.get(url).json();
}

/**
 * Get a single assignment rule by ID
 */
export async function getAssignmentRule(id: UUID): Promise<AssignmentRule> {
  return api.get(`api/leads/assignment-rules/${id}`).json();
}

/**
 * Create a new assignment rule
 */
export async function createAssignmentRule(
  data: CreateAssignmentRuleRequest
): Promise<AssignmentRule> {
  return api.post("api/leads/assignment-rules", { json: data }).json();
}

/**
 * Update an assignment rule
 */
export async function updateAssignmentRule(
  id: UUID,
  data: UpdateAssignmentRuleRequest
): Promise<AssignmentRule> {
  return api.put(`api/leads/assignment-rules/${id}`, { json: data }).json();
}

/**
 * Delete an assignment rule
 */
export async function deleteAssignmentRule(id: UUID): Promise<void> {
  await api.delete(`api/leads/assignment-rules/${id}`);
}

/**
 * Activate an assignment rule
 */
export async function activateAssignmentRule(id: UUID): Promise<AssignmentRule> {
  return api.post(`api/leads/assignment-rules/${id}/activate`).json();
}

/**
 * Deactivate an assignment rule
 */
export async function deactivateAssignmentRule(id: UUID): Promise<AssignmentRule> {
  return api.post(`api/leads/assignment-rules/${id}/deactivate`).json();
}

/**
 * Get assignment rule statistics
 */
export async function getAssignmentStats(): Promise<AssignmentStats> {
  return api.get("api/leads/assignment-rules/stats").json();
}
