import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UUID } from "../types/api";
import type {
  ProductCategoryQueryParams,
  ProductQueryParams,
  CreateProductCategoryRequest,
  UpdateProductCategoryRequest,
  CreateProductRequest,
  UpdateProductRequest,
  AdjustStockRequest,
} from "../types/product";
import * as productsApi from "../lib/api/products";

// ===========================
// QUERY KEYS
// ===========================

export const categoryKeys = {
  all: ["product-categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params: ProductCategoryQueryParams) => [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: UUID) => [...categoryKeys.details(), id] as const,
  stats: () => [...categoryKeys.all, "stats"] as const,
};

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductQueryParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: UUID) => [...productKeys.details(), id] as const,
  stats: () => [...productKeys.all, "stats"] as const,
  bundleItems: (id: UUID) => [...productKeys.detail(id), "bundle-items"] as const,
};

// ===========================
// PRODUCT CATEGORY HOOKS
// ===========================

export function useProductCategories(params: ProductCategoryQueryParams = {}) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => productsApi.getProductCategories(params),
  });
}

export function useProductCategory(id: UUID) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => productsApi.getProductCategory(id),
    enabled: !!id,
  });
}

export function useCategoryStats() {
  return useQuery({
    queryKey: categoryKeys.stats(),
    queryFn: () => productsApi.getCategoryStats(),
  });
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductCategoryRequest) =>
      productsApi.createProductCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.stats() });
    },
  });
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: UpdateProductCategoryRequest;
    }) => productsApi.updateProductCategory(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(categoryKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useActivateProductCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => productsApi.activateProductCategory(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(categoryKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.stats() });
    },
  });
}

export function useDeactivateProductCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => productsApi.deactivateProductCategory(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(categoryKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.stats() });
    },
  });
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => productsApi.deleteProductCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.stats() });
    },
  });
}

// ===========================
// PRODUCT HOOKS
// ===========================

export function useProducts(params: ProductQueryParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.getProducts(params),
  });
}

export function useProduct(id: UUID) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.getProduct(id),
    enabled: !!id,
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: productKeys.stats(),
    queryFn: () => productsApi.getProductStats(),
  });
}

export function useBundleItems(bundleId: UUID) {
  return useQuery({
    queryKey: productKeys.bundleItems(bundleId),
    queryFn: () => productsApi.getBundleItems(bundleId),
    enabled: !!bundleId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductRequest) => productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateProductRequest }) =>
      productsApi.updateProduct(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(productKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

// Status transitions
export function usePublishProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => productsApi.publishProduct(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(productKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

export function useActivateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => productsApi.activateProduct(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(productKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => productsApi.deactivateProduct(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(productKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

export function useDiscontinueProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => productsApi.discontinueProduct(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(productKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

// Inventory
export function useAddStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: AdjustStockRequest }) =>
      productsApi.addStock(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(productKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useDeductStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: AdjustStockRequest }) =>
      productsApi.deductStock(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(productKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
