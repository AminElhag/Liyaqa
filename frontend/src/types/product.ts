import type { UUID, LocalizedText, Money } from "./api";

// ===========================
// ENUMS
// ===========================

export type ProductType = "GOODS" | "SERVICE" | "BUNDLE";

export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "DISCONTINUED";

export type Department =
  | "FOOD_AND_BEVERAGE"
  | "MERCHANDISE"
  | "EQUIPMENT"
  | "SERVICES"
  | "SUPPLEMENTS"
  | "RENTALS"
  | "OTHER";

export type ZoneAccessType =
  | "LOCKER_ROOM"
  | "SAUNA"
  | "POOL"
  | "SPA"
  | "VIP_AREA"
  | "STUDIO"
  | "OTHER";

// ===========================
// CATEGORY TYPES
// ===========================

export interface ProductCategory {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText;
  icon?: string;
  department: Department;
  customDepartment?: string;
  effectiveDepartment: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
}

// ===========================
// STOCK PRICING TYPES
// ===========================

export interface StockPricing {
  lowStockThreshold: number;
  lowStockPrice?: Money;
  outOfStockPrice?: Money;
}

// ===========================
// BUNDLE ITEM TYPES
// ===========================

export interface BundleItem {
  id: UUID;
  product: ProductSummary;
  quantity: number;
  lineValue: Money;
  sortOrder: number;
}

export interface ProductSummary {
  id: UUID;
  name: LocalizedText;
  productType: ProductType;
  status: ProductStatus;
  listPrice: Money;
  isAvailable: boolean;
}

// ===========================
// PRODUCT TYPES
// ===========================

export interface Product {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText;
  sku?: string;
  productType: ProductType;
  category?: ProductCategory;
  status: ProductStatus;

  // Pricing
  listPrice: Money;
  effectivePrice: Money;
  grossPrice: Money;
  taxRate: number;
  stockPricing?: StockPricing;

  // Inventory
  stockQuantity?: number;
  trackInventory: boolean;
  isAvailable: boolean;

  // Expiration
  hasExpiration: boolean;
  expirationDays?: number;

  // Zone access
  zoneAccess: ZoneAccessType[];
  accessDurationDays?: number;
  grantsAccess: boolean;

  // Restrictions
  isSingleUse: boolean;
  maxQuantityPerOrder?: number;

  // Display
  sortOrder: number;
  imageUrl?: string;

  // Bundle (only for BUNDLE type)
  bundleItems?: BundleItem[];
  bundleValue?: Money;

  createdAt: string;
  updatedAt: string;
}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  discontinued: number;
  goods: number;
  services: number;
  bundles: number;
}

// ===========================
// REQUEST TYPES
// ===========================

export interface CreateProductCategoryRequest {
  name: LocalizedText;
  description?: LocalizedText;
  icon?: string;
  department: Department;
  customDepartment?: string;
  sortOrder?: number;
}

export interface UpdateProductCategoryRequest {
  name?: LocalizedText;
  description?: LocalizedText;
  icon?: string;
  department?: Department;
  customDepartment?: string;
  sortOrder?: number;
}

export interface StockPricingRequest {
  lowStockThreshold?: number;
  lowStockPrice?: number;
  outOfStockPrice?: number;
}

export interface BundleItemRequest {
  productId: UUID;
  quantity: number;
}

export interface CreateProductRequest {
  name: LocalizedText;
  description?: LocalizedText;
  sku?: string;
  productType: ProductType;
  categoryId?: UUID;
  listPrice: number;
  currency?: string;
  taxRate?: number;
  stockPricing?: StockPricingRequest;
  stockQuantity?: number;
  trackInventory?: boolean;
  hasExpiration?: boolean;
  expirationDays?: number;
  zoneAccess?: ZoneAccessType[];
  accessDurationDays?: number;
  isSingleUse?: boolean;
  maxQuantityPerOrder?: number;
  sortOrder?: number;
  imageUrl?: string;
  bundleItems?: BundleItemRequest[];
}

export interface UpdateProductRequest {
  name?: LocalizedText;
  description?: LocalizedText;
  sku?: string;
  categoryId?: UUID;
  listPrice?: number;
  currency?: string;
  taxRate?: number;
  stockPricing?: StockPricingRequest;
  stockQuantity?: number;
  trackInventory?: boolean;
  hasExpiration?: boolean;
  expirationDays?: number;
  zoneAccess?: ZoneAccessType[];
  accessDurationDays?: number;
  isSingleUse?: boolean;
  maxQuantityPerOrder?: number;
  sortOrder?: number;
  imageUrl?: string;
  bundleItems?: BundleItemRequest[];
}

export interface AdjustStockRequest {
  quantity: number;
  reason?: string;
}

// ===========================
// QUERY PARAMS
// ===========================

export interface ProductCategoryQueryParams {
  department?: Department;
  active?: boolean;
  page?: number;
  size?: number;
}

export interface ProductQueryParams {
  status?: ProductStatus;
  type?: ProductType;
  categoryId?: UUID;
  search?: string;
  page?: number;
  size?: number;
}

// ===========================
// HELPER CONSTANTS
// ===========================

export const DEPARTMENT_LABELS: Record<Department, { en: string; ar: string }> = {
  FOOD_AND_BEVERAGE: { en: "Food & Beverage", ar: "الأطعمة والمشروبات" },
  MERCHANDISE: { en: "Merchandise", ar: "البضائع" },
  EQUIPMENT: { en: "Equipment", ar: "المعدات" },
  SERVICES: { en: "Services", ar: "الخدمات" },
  SUPPLEMENTS: { en: "Supplements", ar: "المكملات" },
  RENTALS: { en: "Rentals", ar: "الإيجارات" },
  OTHER: { en: "Other", ar: "أخرى" },
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, { en: string; ar: string }> = {
  GOODS: { en: "Goods", ar: "سلع" },
  SERVICE: { en: "Service", ar: "خدمة" },
  BUNDLE: { en: "Bundle", ar: "حزمة" },
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, { en: string; ar: string }> = {
  DRAFT: { en: "Draft", ar: "مسودة" },
  ACTIVE: { en: "Active", ar: "نشط" },
  INACTIVE: { en: "Inactive", ar: "غير نشط" },
  DISCONTINUED: { en: "Discontinued", ar: "متوقف" },
};

export const ZONE_ACCESS_LABELS: Record<ZoneAccessType, { en: string; ar: string }> = {
  LOCKER_ROOM: { en: "Locker Room", ar: "غرفة الخزائن" },
  SAUNA: { en: "Sauna", ar: "الساونا" },
  POOL: { en: "Pool", ar: "المسبح" },
  SPA: { en: "Spa", ar: "السبا" },
  VIP_AREA: { en: "VIP Area", ar: "منطقة كبار الشخصيات" },
  STUDIO: { en: "Studio", ar: "الاستوديو" },
  OTHER: { en: "Other", ar: "أخرى" },
};
