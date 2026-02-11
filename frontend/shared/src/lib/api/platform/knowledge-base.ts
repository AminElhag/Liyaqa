import { api } from "../client";
import type { PageResponse } from "../../../types/api";
import type {
  KBArticle,
  KBArticleSummary,
  KBCategoryCount,
  KBArticleCreateRequest,
  KBArticleUpdateRequest,
  KBArticleQueryParams,
} from "../../../types/platform/knowledge-base";

const BASE_URL = "api/v1/platform/knowledge-base";

export async function getKBCategories(): Promise<KBCategoryCount[]> {
  return api.get(`${BASE_URL}/categories`).json<KBCategoryCount[]>();
}

export async function getKBArticles(
  params: KBArticleQueryParams = {}
): Promise<PageResponse<KBArticleSummary>> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.status) searchParams.set("status", params.status);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);

  return api.get(BASE_URL, { searchParams }).json<PageResponse<KBArticleSummary>>();
}

export async function getKBArticle(id: string): Promise<KBArticle> {
  return api.get(`${BASE_URL}/${id}`).json<KBArticle>();
}

export async function searchKBArticles(
  q: string,
  page = 0,
  size = 20
): Promise<PageResponse<KBArticleSummary>> {
  const searchParams = new URLSearchParams({ q, page: String(page), size: String(size) });
  return api.get(`${BASE_URL}/search`, { searchParams }).json<PageResponse<KBArticleSummary>>();
}

export async function createKBArticle(data: KBArticleCreateRequest): Promise<KBArticle> {
  return api.post(BASE_URL, { json: data }).json<KBArticle>();
}

export async function updateKBArticle(id: string, data: KBArticleUpdateRequest): Promise<KBArticle> {
  return api.put(`${BASE_URL}/${id}`, { json: data }).json<KBArticle>();
}

export async function deleteKBArticle(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}
