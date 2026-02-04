import { api } from "./client";
import type { PaginatedResponse } from "../../types/api";
import type {
  LeadCaptureForm,
  PublicForm,
  CreateLeadCaptureFormRequest,
  UpdateLeadCaptureFormRequest,
  SubmitFormRequest,
  FormSubmissionResponse,
  EmbedCodeResponse,
  LeadCaptureFormQueryParams,
} from "../../types/lead-capture-form";

const ENDPOINT = "api/lead-capture-forms";
const PUBLIC_ENDPOINT = "api/public/forms";

/**
 * Build query string from params
 */
function buildQueryString(params: LeadCaptureFormQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.isActive !== undefined) searchParams.set("isActive", String(params.isActive));
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  return searchParams.toString();
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * Get all lead capture forms
 */
export async function getLeadCaptureForms(
  params: LeadCaptureFormQueryParams = {}
): Promise<PaginatedResponse<LeadCaptureForm>> {
  const query = buildQueryString(params);
  const url = query ? `${ENDPOINT}?${query}` : ENDPOINT;
  return api.get(url).json();
}

/**
 * Get a lead capture form by ID
 */
export async function getLeadCaptureForm(id: string): Promise<LeadCaptureForm> {
  return api.get(`${ENDPOINT}/${id}`).json();
}

/**
 * Get a lead capture form by slug
 */
export async function getLeadCaptureFormBySlug(slug: string): Promise<LeadCaptureForm> {
  return api.get(`${ENDPOINT}/slug/${slug}`).json();
}

/**
 * Create a new lead capture form
 */
export async function createLeadCaptureForm(
  data: CreateLeadCaptureFormRequest
): Promise<LeadCaptureForm> {
  return api.post(ENDPOINT, { json: data }).json();
}

/**
 * Update a lead capture form
 */
export async function updateLeadCaptureForm(
  id: string,
  data: UpdateLeadCaptureFormRequest
): Promise<LeadCaptureForm> {
  return api.put(`${ENDPOINT}/${id}`, { json: data }).json();
}

/**
 * Activate a lead capture form
 */
export async function activateLeadCaptureForm(id: string): Promise<LeadCaptureForm> {
  return api.post(`${ENDPOINT}/${id}/activate`).json();
}

/**
 * Deactivate a lead capture form
 */
export async function deactivateLeadCaptureForm(id: string): Promise<LeadCaptureForm> {
  return api.post(`${ENDPOINT}/${id}/deactivate`).json();
}

/**
 * Delete a lead capture form
 */
export async function deleteLeadCaptureForm(id: string): Promise<void> {
  await api.delete(`${ENDPOINT}/${id}`);
}

/**
 * Get embed code for a form
 */
export async function getEmbedCode(id: string, baseUrl?: string): Promise<EmbedCodeResponse> {
  const params = baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : "";
  return api.get(`${ENDPOINT}/${id}/embed-code${params}`).json();
}

/**
 * Get top performing forms
 */
export async function getTopForms(limit: number = 5): Promise<LeadCaptureForm[]> {
  return api.get(`${ENDPOINT}/top?limit=${limit}`).json();
}

// ==================== PUBLIC ENDPOINTS ====================

/**
 * Get a public form by slug (for embedding)
 */
export async function getPublicForm(slug: string): Promise<PublicForm> {
  return api.get(`${PUBLIC_ENDPOINT}/${slug}`).json();
}

/**
 * Submit a public form
 */
export async function submitPublicForm(
  slug: string,
  data: SubmitFormRequest
): Promise<FormSubmissionResponse> {
  return api.post(`${PUBLIC_ENDPOINT}/${slug}/submit`, { json: data }).json();
}
