import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  ClassCategory,
  CreateClassCategoryRequest,
  UpdateClassCategoryRequest,
} from "../../types/scheduling";

export async function getClassCategories(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<ClassCategory>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api.get(`api/class-categories?${searchParams}`).json();
}

export async function getActiveClassCategories(): Promise<ClassCategory[]> {
  return api.get("api/class-categories/active").json();
}

export async function getClassCategory(id: UUID): Promise<ClassCategory> {
  return api.get(`api/class-categories/${id}`).json();
}

export async function createClassCategory(
  data: CreateClassCategoryRequest
): Promise<ClassCategory> {
  return api.post("api/class-categories", { json: data }).json();
}

export async function updateClassCategory(
  id: UUID,
  data: UpdateClassCategoryRequest
): Promise<ClassCategory> {
  return api.put(`api/class-categories/${id}`, { json: data }).json();
}

export async function activateClassCategory(id: UUID): Promise<ClassCategory> {
  return api.post(`api/class-categories/${id}/activate`).json();
}

export async function deactivateClassCategory(id: UUID): Promise<ClassCategory> {
  return api.post(`api/class-categories/${id}/deactivate`).json();
}

export async function deleteClassCategory(id: UUID): Promise<void> {
  await api.delete(`api/class-categories/${id}`);
}
