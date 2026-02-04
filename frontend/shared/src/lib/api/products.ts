import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  Product,
  ProductCategory,
  CategoryStats,
  ProductStats,
  BundleItem,
  CreateProductCategoryRequest,
  UpdateProductCategoryRequest,
  CreateProductRequest,
  UpdateProductRequest,
  AdjustStockRequest,
  ProductCategoryQueryParams,
  ProductQueryParams,
} from "../../types/product";

const PRODUCTS_ENDPOINT = "api/products";
const CATEGORIES_ENDPOINT = "api/product-categories";

// ===========================
// PRODUCT CATEGORIES
// ===========================

export async function getProductCategories(
  params: ProductCategoryQueryParams = {}
): Promise<PaginatedResponse<ProductCategory>> {
  const searchParams = new URLSearchParams();
  if (params.department) searchParams.set("department", params.department);
  if (params.active !== undefined) searchParams.set("active", String(params.active));
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${CATEGORIES_ENDPOINT}?${query}` : CATEGORIES_ENDPOINT;
  return api.get(url).json();
}

export async function getProductCategory(id: UUID): Promise<ProductCategory> {
  return api.get(`${CATEGORIES_ENDPOINT}/${id}`).json();
}

export async function getCategoryStats(): Promise<CategoryStats> {
  return api.get(`${CATEGORIES_ENDPOINT}/stats`).json();
}

export async function createProductCategory(
  data: CreateProductCategoryRequest
): Promise<ProductCategory> {
  const backendData = {
    name: {
      en: data.name.en,
      ar: data.name.ar || null,
    },
    description: data.description
      ? {
          en: data.description.en || null,
          ar: data.description.ar || null,
        }
      : null,
    icon: data.icon || null,
    department: data.department,
    customDepartment: data.customDepartment || null,
    sortOrder: data.sortOrder ?? 0,
  };
  return api.post(CATEGORIES_ENDPOINT, { json: backendData }).json();
}

export async function updateProductCategory(
  id: UUID,
  data: UpdateProductCategoryRequest
): Promise<ProductCategory> {
  const backendData: Record<string, unknown> = {};

  if (data.name) {
    backendData.name = {
      en: data.name.en,
      ar: data.name.ar || null,
    };
  }
  if (data.description !== undefined) {
    backendData.description = data.description
      ? {
          en: data.description.en || null,
          ar: data.description.ar || null,
        }
      : null;
  }
  if (data.icon !== undefined) backendData.icon = data.icon;
  if (data.department !== undefined) backendData.department = data.department;
  if (data.customDepartment !== undefined) backendData.customDepartment = data.customDepartment;
  if (data.sortOrder !== undefined) backendData.sortOrder = data.sortOrder;

  return api.put(`${CATEGORIES_ENDPOINT}/${id}`, { json: backendData }).json();
}

export async function activateProductCategory(id: UUID): Promise<ProductCategory> {
  return api.post(`${CATEGORIES_ENDPOINT}/${id}/activate`).json();
}

export async function deactivateProductCategory(id: UUID): Promise<ProductCategory> {
  return api.post(`${CATEGORIES_ENDPOINT}/${id}/deactivate`).json();
}

export async function deleteProductCategory(id: UUID): Promise<void> {
  await api.delete(`${CATEGORIES_ENDPOINT}/${id}`);
}

// ===========================
// PRODUCTS
// ===========================

export async function getProducts(
  params: ProductQueryParams = {}
): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.type) searchParams.set("type", params.type);
  if (params.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params.search) searchParams.set("search", params.search);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${PRODUCTS_ENDPOINT}?${query}` : PRODUCTS_ENDPOINT;
  return api.get(url).json();
}

export async function getProduct(id: UUID): Promise<Product> {
  return api.get(`${PRODUCTS_ENDPOINT}/${id}`).json();
}

export async function getProductStats(): Promise<ProductStats> {
  return api.get(`${PRODUCTS_ENDPOINT}/stats`).json();
}

export async function createProduct(data: CreateProductRequest): Promise<Product> {
  const backendData = {
    name: {
      en: data.name.en,
      ar: data.name.ar || null,
    },
    description: data.description
      ? {
          en: data.description.en || null,
          ar: data.description.ar || null,
        }
      : null,
    sku: data.sku || null,
    productType: data.productType,
    categoryId: data.categoryId || null,
    listPrice: data.listPrice,
    currency: data.currency || "SAR",
    taxRate: data.taxRate ?? 15,
    stockPricing: data.stockPricing
      ? {
          lowStockThreshold: data.stockPricing.lowStockThreshold ?? 10,
          lowStockPrice: data.stockPricing.lowStockPrice ?? null,
          outOfStockPrice: data.stockPricing.outOfStockPrice ?? null,
        }
      : null,
    stockQuantity: data.stockQuantity ?? null,
    trackInventory: data.trackInventory ?? false,
    hasExpiration: data.hasExpiration ?? false,
    expirationDays: data.expirationDays ?? null,
    zoneAccess: data.zoneAccess || [],
    accessDurationDays: data.accessDurationDays ?? null,
    isSingleUse: data.isSingleUse ?? false,
    maxQuantityPerOrder: data.maxQuantityPerOrder ?? null,
    sortOrder: data.sortOrder ?? 0,
    imageUrl: data.imageUrl || null,
    bundleItems: data.bundleItems || null,
  };
  return api.post(PRODUCTS_ENDPOINT, { json: backendData }).json();
}

export async function updateProduct(
  id: UUID,
  data: UpdateProductRequest
): Promise<Product> {
  const backendData: Record<string, unknown> = {};

  if (data.name) {
    backendData.name = {
      en: data.name.en,
      ar: data.name.ar || null,
    };
  }
  if (data.description !== undefined) {
    backendData.description = data.description
      ? {
          en: data.description.en || null,
          ar: data.description.ar || null,
        }
      : null;
  }
  if (data.sku !== undefined) backendData.sku = data.sku;
  if (data.categoryId !== undefined) backendData.categoryId = data.categoryId;
  if (data.listPrice !== undefined) backendData.listPrice = data.listPrice;
  if (data.currency !== undefined) backendData.currency = data.currency;
  if (data.taxRate !== undefined) backendData.taxRate = data.taxRate;
  if (data.stockPricing !== undefined) {
    backendData.stockPricing = data.stockPricing
      ? {
          lowStockThreshold: data.stockPricing.lowStockThreshold ?? 10,
          lowStockPrice: data.stockPricing.lowStockPrice ?? null,
          outOfStockPrice: data.stockPricing.outOfStockPrice ?? null,
        }
      : null;
  }
  if (data.stockQuantity !== undefined) backendData.stockQuantity = data.stockQuantity;
  if (data.trackInventory !== undefined) backendData.trackInventory = data.trackInventory;
  if (data.hasExpiration !== undefined) backendData.hasExpiration = data.hasExpiration;
  if (data.expirationDays !== undefined) backendData.expirationDays = data.expirationDays;
  if (data.zoneAccess !== undefined) backendData.zoneAccess = data.zoneAccess;
  if (data.accessDurationDays !== undefined) backendData.accessDurationDays = data.accessDurationDays;
  if (data.isSingleUse !== undefined) backendData.isSingleUse = data.isSingleUse;
  if (data.maxQuantityPerOrder !== undefined) backendData.maxQuantityPerOrder = data.maxQuantityPerOrder;
  if (data.sortOrder !== undefined) backendData.sortOrder = data.sortOrder;
  if (data.imageUrl !== undefined) backendData.imageUrl = data.imageUrl;
  if (data.bundleItems !== undefined) backendData.bundleItems = data.bundleItems;

  return api.put(`${PRODUCTS_ENDPOINT}/${id}`, { json: backendData }).json();
}

export async function deleteProduct(id: UUID): Promise<void> {
  await api.delete(`${PRODUCTS_ENDPOINT}/${id}`);
}

// Status transitions
export async function publishProduct(id: UUID): Promise<Product> {
  return api.post(`${PRODUCTS_ENDPOINT}/${id}/publish`).json();
}

export async function activateProduct(id: UUID): Promise<Product> {
  return api.post(`${PRODUCTS_ENDPOINT}/${id}/activate`).json();
}

export async function deactivateProduct(id: UUID): Promise<Product> {
  return api.post(`${PRODUCTS_ENDPOINT}/${id}/deactivate`).json();
}

export async function discontinueProduct(id: UUID): Promise<Product> {
  return api.post(`${PRODUCTS_ENDPOINT}/${id}/discontinue`).json();
}

// Inventory
export async function addStock(id: UUID, data: AdjustStockRequest): Promise<Product> {
  return api.post(`${PRODUCTS_ENDPOINT}/${id}/add-stock`, { json: data }).json();
}

export async function deductStock(id: UUID, data: AdjustStockRequest): Promise<Product> {
  return api.post(`${PRODUCTS_ENDPOINT}/${id}/deduct-stock`, { json: data }).json();
}

// Bundle items
export async function getBundleItems(bundleId: UUID): Promise<BundleItem[]> {
  return api.get(`${PRODUCTS_ENDPOINT}/${bundleId}/bundle-items`).json();
}
