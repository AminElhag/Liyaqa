import { api } from "./client";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  Lead,
  LeadActivity,
  LeadStatus,
  LeadSource,
  CreateLeadRequest,
  UpdateLeadRequest,
  TransitionStatusRequest,
  AssignLeadRequest,
  BulkAssignRequest,
  ConvertLeadRequest,
  LogActivityRequest,
  CompleteFollowUpRequest,
  PipelineStats,
  SourceStats,
  ActivityStats,
} from "../types/lead";

export interface LeadQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedToUserId?: string;
  createdAfter?: string;
  createdBefore?: string;
}

// ============ CRUD ============

/**
 * Create a new lead
 */
export async function createLead(data: CreateLeadRequest): Promise<Lead> {
  return api.post("api/leads", { json: data }).json();
}

/**
 * Get paginated leads with filters
 */
export async function getLeads(
  params: LeadQueryParams = {}
): Promise<PaginatedResponse<Lead>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDir) searchParams.set("sortDir", params.sortDir);
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.source) searchParams.set("source", params.source);
  if (params.assignedToUserId) searchParams.set("assignedToUserId", params.assignedToUserId);
  if (params.createdAfter) searchParams.set("createdAfter", params.createdAfter);
  if (params.createdBefore) searchParams.set("createdBefore", params.createdBefore);

  const queryString = searchParams.toString();
  const url = queryString ? `api/leads?${queryString}` : "api/leads";

  return api.get(url).json();
}

/**
 * Get a single lead by ID
 */
export async function getLead(id: UUID): Promise<Lead> {
  return api.get(`api/leads/${id}`).json();
}

/**
 * Update a lead
 */
export async function updateLead(id: UUID, data: UpdateLeadRequest): Promise<Lead> {
  return api.put(`api/leads/${id}`, { json: data }).json();
}

/**
 * Delete a lead
 */
export async function deleteLead(id: UUID): Promise<void> {
  await api.delete(`api/leads/${id}`);
}

// ============ Filtering ============

/**
 * Get active (non-terminal) leads
 */
export async function getActiveLeads(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<Lead>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString ? `api/leads/active?${queryString}` : "api/leads/active";

  return api.get(url).json();
}

/**
 * Get unassigned leads
 */
export async function getUnassignedLeads(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<Lead>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString ? `api/leads/unassigned?${queryString}` : "api/leads/unassigned";

  return api.get(url).json();
}

/**
 * Get leads assigned to current user
 */
export async function getMyLeads(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<Lead>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString ? `api/leads/my?${queryString}` : "api/leads/my";

  return api.get(url).json();
}

// ============ Status Transitions ============

/**
 * Transition lead status
 */
export async function transitionLeadStatus(
  id: UUID,
  data: TransitionStatusRequest
): Promise<Lead> {
  return api.post(`api/leads/${id}/transition`, { json: data }).json();
}

/**
 * Mark lead as contacted
 */
export async function markLeadContacted(id: UUID): Promise<Lead> {
  return api.post(`api/leads/${id}/contact`).json();
}

/**
 * Schedule tour for lead
 */
export async function scheduleLeadTour(id: UUID): Promise<Lead> {
  return api.post(`api/leads/${id}/schedule-tour`).json();
}

/**
 * Start trial for lead
 */
export async function startLeadTrial(id: UUID): Promise<Lead> {
  return api.post(`api/leads/${id}/start-trial`).json();
}

/**
 * Convert lead to member
 */
export async function convertLead(id: UUID, data: ConvertLeadRequest): Promise<Lead> {
  return api.post(`api/leads/${id}/convert`, { json: data }).json();
}

/**
 * Mark lead as lost
 */
export async function markLeadLost(id: UUID, reason?: string): Promise<Lead> {
  const searchParams = new URLSearchParams();
  if (reason) searchParams.set("reason", reason);

  const queryString = searchParams.toString();
  const url = queryString ? `api/leads/${id}/mark-lost?${queryString}` : `api/leads/${id}/mark-lost`;

  return api.post(url).json();
}

/**
 * Reopen a lost lead
 */
export async function reopenLead(id: UUID): Promise<Lead> {
  return api.post(`api/leads/${id}/reopen`).json();
}

// ============ Assignment ============

/**
 * Assign lead to a user
 */
export async function assignLead(id: UUID, data: AssignLeadRequest): Promise<Lead> {
  return api.post(`api/leads/${id}/assign`, { json: data }).json();
}

/**
 * Bulk assign leads to a user
 */
export async function bulkAssignLeads(data: BulkAssignRequest): Promise<Lead[]> {
  return api.post("api/leads/bulk-assign", { json: data }).json();
}

// ============ Activities ============

/**
 * Log an activity for a lead
 */
export async function logLeadActivity(
  leadId: UUID,
  data: LogActivityRequest
): Promise<LeadActivity> {
  return api.post(`api/leads/${leadId}/activities`, { json: data }).json();
}

/**
 * Get activities for a lead
 */
export async function getLeadActivities(
  leadId: UUID,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<LeadActivity>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/leads/${leadId}/activities?${queryString}`
    : `api/leads/${leadId}/activities`;

  return api.get(url).json();
}

/**
 * Complete a follow-up activity
 */
export async function completeFollowUp(
  activityId: UUID,
  data: CompleteFollowUpRequest
): Promise<LeadActivity> {
  return api.post(`api/leads/activities/${activityId}/complete`, { json: data }).json();
}

/**
 * Delete an activity
 */
export async function deleteLeadActivity(activityId: UUID): Promise<void> {
  await api.delete(`api/leads/activities/${activityId}`);
}

// ============ Follow-ups ============

/**
 * Get pending follow-ups
 */
export async function getPendingFollowUps(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<LeadActivity>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/leads/follow-ups/pending?${queryString}`
    : "api/leads/follow-ups/pending";

  return api.get(url).json();
}

/**
 * Get overdue follow-ups
 */
export async function getOverdueFollowUps(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<LeadActivity>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/leads/follow-ups/overdue?${queryString}`
    : "api/leads/follow-ups/overdue";

  return api.get(url).json();
}

// ============ Statistics ============

/**
 * Get pipeline statistics
 */
export async function getPipelineStats(): Promise<PipelineStats> {
  return api.get("api/leads/stats/pipeline").json();
}

/**
 * Get source statistics
 */
export async function getSourceStats(): Promise<SourceStats> {
  return api.get("api/leads/stats/sources").json();
}

/**
 * Get activity statistics
 */
export async function getActivityStats(): Promise<ActivityStats> {
  return api.get("api/leads/stats/activities").json();
}
