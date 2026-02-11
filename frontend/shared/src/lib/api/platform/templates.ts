import { api } from "../client";
import type { PageResponse } from "../../../types/api";
import type {
  DocumentTemplate,
  TemplateCreateRequest,
  TemplateUpdateRequest,
  TemplateQueryParams,
} from "../../../types/platform/templates";

const BASE_URL = "api/v1/platform/templates";

export async function getTemplates(
  params: TemplateQueryParams = {}
): Promise<PageResponse<DocumentTemplate>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.type) searchParams.set("type", params.type);

  return api.get(BASE_URL, { searchParams }).json<PageResponse<DocumentTemplate>>();
}

export async function getTemplate(id: string): Promise<DocumentTemplate> {
  return api.get(`${BASE_URL}/${id}`).json<DocumentTemplate>();
}

export async function createTemplate(data: TemplateCreateRequest): Promise<DocumentTemplate> {
  return api.post(BASE_URL, { json: data }).json<DocumentTemplate>();
}

export async function updateTemplate(id: string, data: TemplateUpdateRequest): Promise<DocumentTemplate> {
  return api.put(`${BASE_URL}/${id}`, { json: data }).json<DocumentTemplate>();
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

export type { DocumentTemplate, TemplateCreateRequest, TemplateUpdateRequest };
