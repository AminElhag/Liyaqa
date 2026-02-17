"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getClassCategories,
  getActiveClassCategories,
  getClassCategory,
  createClassCategory,
  updateClassCategory,
  activateClassCategory,
  deactivateClassCategory,
  deleteClassCategory,
} from "../lib/api/class-categories";
import type { UUID } from "../types/api";
import type {
  CreateClassCategoryRequest,
  UpdateClassCategoryRequest,
} from "../types/scheduling";

export const classCategoryKeys = {
  all: ["class-categories"] as const,
  lists: () => [...classCategoryKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...classCategoryKeys.lists(), params] as const,
  active: () => [...classCategoryKeys.all, "active"] as const,
  details: () => [...classCategoryKeys.all, "detail"] as const,
  detail: (id: UUID) => [...classCategoryKeys.details(), id] as const,
};

export function useClassCategories(params: { page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: classCategoryKeys.list(params),
    queryFn: () => getClassCategories(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useActiveClassCategories() {
  return useQuery({
    queryKey: classCategoryKeys.active(),
    queryFn: getActiveClassCategories,
    staleTime: 2 * 60 * 1000,
  });
}

export function useClassCategory(id: UUID) {
  return useQuery({
    queryKey: classCategoryKeys.detail(id),
    queryFn: () => getClassCategory(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

export function useCreateClassCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassCategoryRequest) => createClassCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classCategoryKeys.all });
    },
  });
}

export function useUpdateClassCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateClassCategoryRequest }) =>
      updateClassCategory(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: classCategoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: classCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classCategoryKeys.active() });
    },
  });
}

export function useActivateClassCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => activateClassCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classCategoryKeys.all });
    },
  });
}

export function useDeactivateClassCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deactivateClassCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classCategoryKeys.all });
    },
  });
}

export function useDeleteClassCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteClassCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classCategoryKeys.all });
    },
  });
}
