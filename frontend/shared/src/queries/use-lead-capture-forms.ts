"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getLeadCaptureForms,
  getLeadCaptureForm,
  getLeadCaptureFormBySlug,
  createLeadCaptureForm,
  updateLeadCaptureForm,
  activateLeadCaptureForm,
  deactivateLeadCaptureForm,
  deleteLeadCaptureForm,
  getEmbedCode,
  getTopForms,
  getPublicForm,
  submitPublicForm,
} from "../lib/api/lead-capture-forms";
import type { PaginatedResponse } from "../types/api";
import type {
  LeadCaptureForm,
  PublicForm,
  CreateLeadCaptureFormRequest,
  UpdateLeadCaptureFormRequest,
  SubmitFormRequest,
  FormSubmissionResponse,
  EmbedCodeResponse,
  LeadCaptureFormQueryParams,
} from "../types/lead-capture-form";

// ==================== QUERY KEYS ====================

export const leadCaptureFormKeys = {
  all: ["lead-capture-forms"] as const,
  lists: () => [...leadCaptureFormKeys.all, "list"] as const,
  list: (params: LeadCaptureFormQueryParams) =>
    [...leadCaptureFormKeys.lists(), params] as const,
  details: () => [...leadCaptureFormKeys.all, "detail"] as const,
  detail: (id: string) => [...leadCaptureFormKeys.details(), id] as const,
  slug: (slug: string) => [...leadCaptureFormKeys.all, "slug", slug] as const,
  embedCode: (id: string) => [...leadCaptureFormKeys.all, "embed", id] as const,
  top: (limit: number) => [...leadCaptureFormKeys.all, "top", limit] as const,
  public: (slug: string) => ["public-form", slug] as const,
};

// ==================== QUERY HOOKS ====================

/**
 * Fetch paginated lead capture forms
 */
export function useLeadCaptureForms(
  params: LeadCaptureFormQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<LeadCaptureForm>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: leadCaptureFormKeys.list(params),
    queryFn: () => getLeadCaptureForms(params),
    ...options,
  });
}

/**
 * Fetch a single lead capture form by ID
 */
export function useLeadCaptureForm(
  id: string,
  options?: Omit<UseQueryOptions<LeadCaptureForm>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadCaptureFormKeys.detail(id),
    queryFn: () => getLeadCaptureForm(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Fetch a lead capture form by slug
 */
export function useLeadCaptureFormBySlug(
  slug: string,
  options?: Omit<UseQueryOptions<LeadCaptureForm>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadCaptureFormKeys.slug(slug),
    queryFn: () => getLeadCaptureFormBySlug(slug),
    enabled: !!slug,
    ...options,
  });
}

/**
 * Fetch embed code for a form
 */
export function useEmbedCode(
  id: string,
  baseUrl?: string,
  options?: Omit<UseQueryOptions<EmbedCodeResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadCaptureFormKeys.embedCode(id),
    queryFn: () => getEmbedCode(id, baseUrl),
    enabled: !!id,
    ...options,
  });
}

/**
 * Fetch top performing forms
 */
export function useTopForms(
  limit: number = 5,
  options?: Omit<UseQueryOptions<LeadCaptureForm[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadCaptureFormKeys.top(limit),
    queryFn: () => getTopForms(limit),
    ...options,
  });
}

/**
 * Fetch a public form by slug (for embedding)
 */
export function usePublicForm(
  slug: string,
  options?: Omit<UseQueryOptions<PublicForm>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: leadCaptureFormKeys.public(slug),
    queryFn: () => getPublicForm(slug),
    enabled: !!slug,
    ...options,
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Create a new lead capture form
 */
export function useCreateLeadCaptureForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeadCaptureFormRequest) => createLeadCaptureForm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadCaptureFormKeys.lists() });
    },
  });
}

/**
 * Update a lead capture form
 */
export function useUpdateLeadCaptureForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadCaptureFormRequest }) =>
      updateLeadCaptureForm(id, data),
    onSuccess: (updatedForm) => {
      queryClient.setQueryData(leadCaptureFormKeys.detail(updatedForm.id), updatedForm);
      queryClient.invalidateQueries({ queryKey: leadCaptureFormKeys.lists() });
    },
  });
}

/**
 * Activate a lead capture form
 */
export function useActivateLeadCaptureForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateLeadCaptureForm(id),
    onSuccess: (updatedForm) => {
      queryClient.setQueryData(leadCaptureFormKeys.detail(updatedForm.id), updatedForm);
      queryClient.invalidateQueries({ queryKey: leadCaptureFormKeys.lists() });
    },
  });
}

/**
 * Deactivate a lead capture form
 */
export function useDeactivateLeadCaptureForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateLeadCaptureForm(id),
    onSuccess: (updatedForm) => {
      queryClient.setQueryData(leadCaptureFormKeys.detail(updatedForm.id), updatedForm);
      queryClient.invalidateQueries({ queryKey: leadCaptureFormKeys.lists() });
    },
  });
}

/**
 * Delete a lead capture form
 */
export function useDeleteLeadCaptureForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLeadCaptureForm(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: leadCaptureFormKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadCaptureFormKeys.lists() });
    },
  });
}

/**
 * Submit a public form
 */
export function useSubmitPublicForm() {
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: SubmitFormRequest }) =>
      submitPublicForm(slug, data),
  });
}
