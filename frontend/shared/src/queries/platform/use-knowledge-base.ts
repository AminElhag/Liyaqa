"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { PageResponse } from "../../types/api";
import type {
  KBArticle,
  KBArticleSummary,
  KBCategoryCount,
  KBArticleCreateRequest,
  KBArticleUpdateRequest,
  KBArticleQueryParams,
} from "../../types/platform/knowledge-base";
import {
  getKBCategories,
  getKBArticles,
  getKBArticle,
  searchKBArticles,
  createKBArticle,
  updateKBArticle,
  deleteKBArticle,
} from "../../lib/api/platform/knowledge-base";

export const kbKeys = {
  all: ["platform", "knowledge-base"] as const,
  categories: () => [...kbKeys.all, "categories"] as const,
  articles: (params?: KBArticleQueryParams) => [...kbKeys.all, "articles", params] as const,
  article: (id: string) => [...kbKeys.all, "article", id] as const,
  search: (q: string, page?: number) => [...kbKeys.all, "search", q, page] as const,
};

export function useKBCategories(
  options?: Omit<UseQueryOptions<KBCategoryCount[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kbKeys.categories(),
    queryFn: getKBCategories,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useKBArticles(
  params: KBArticleQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<KBArticleSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kbKeys.articles(params),
    queryFn: () => getKBArticles(params),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useKBArticle(
  id: string,
  options?: Omit<UseQueryOptions<KBArticle>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kbKeys.article(id),
    queryFn: () => getKBArticle(id),
    enabled: !!id,
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useSearchKBArticles(
  q: string,
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PageResponse<KBArticleSummary>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kbKeys.search(q, page),
    queryFn: () => searchKBArticles(q, page, size),
    enabled: q.trim().length > 0,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useCreateKBArticle(
  options?: UseMutationOptions<KBArticle, Error, KBArticleCreateRequest>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKBArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kbKeys.all });
    },
    ...options,
  });
}

export function useUpdateKBArticle(
  options?: UseMutationOptions<KBArticle, Error, { id: string; data: KBArticleUpdateRequest }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateKBArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kbKeys.all });
    },
    ...options,
  });
}

export function useDeleteKBArticle(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKBArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kbKeys.all });
    },
    ...options,
  });
}
