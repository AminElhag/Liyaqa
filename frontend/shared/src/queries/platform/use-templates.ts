"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../../lib/api/platform/templates";
import type { PageResponse } from "../../types/api";
import type {
  DocumentTemplate,
  TemplateCreateRequest,
  TemplateUpdateRequest,
  TemplateQueryParams,
} from "../../types/platform/templates";

export const templateKeys = {
  all: ["platform", "templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: (params: TemplateQueryParams) => [...templateKeys.lists(), params] as const,
  detail: (id: string) => [...templateKeys.all, "detail", id] as const,
};

export function useTemplates(
  params: TemplateQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<DocumentTemplate>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => getTemplates(params),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useTemplate(
  id: string,
  options?: Omit<UseQueryOptions<DocumentTemplate>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => getTemplate(id),
    enabled: !!id,
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useCreateTemplate(
  options?: UseMutationOptions<DocumentTemplate, Error, TemplateCreateRequest>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
    ...options,
  });
}

export function useUpdateTemplate(
  options?: UseMutationOptions<DocumentTemplate, Error, { id: string; data: TemplateUpdateRequest }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
    ...options,
  });
}

export function useDeleteTemplate(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
    ...options,
  });
}

export type { DocumentTemplate, TemplateCreateRequest, TemplateUpdateRequest };
