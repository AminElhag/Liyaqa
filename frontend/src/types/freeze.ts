import type { UUID, LocalizedText, Money } from "./api";

// Freeze source - how freeze days were acquired
export type FreezeSource =
  | "PURCHASED"
  | "PLAN_INCLUDED"
  | "PROMOTIONAL"
  | "COMPENSATION";

// Freeze type - reason for freezing
export type FreezeType =
  | "MEDICAL"
  | "TRAVEL"
  | "PERSONAL"
  | "MILITARY"
  | "OTHER";

// Freeze package entity (configurable freeze options)
export interface FreezePackage {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText;
  freezeDays: number;
  price: Money;
  isActive: boolean;
  extendsContract: boolean;
  requiresDocumentation: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Member's freeze day balance
export interface FreezeBalance {
  id: UUID;
  memberId: UUID;
  subscriptionId: UUID;
  totalFreezeDays: number;
  usedFreezeDays: number;
  availableDays: number;
  source: FreezeSource;
  createdAt: string;
  updatedAt: string;
}

// Freeze history record (audit trail)
export interface FreezeHistory {
  id: UUID;
  subscriptionId: UUID;
  freezeStartDate: string;
  freezeEndDate?: string;
  freezeDays: number;
  freezeType: FreezeType;
  reason?: string;
  documentPath?: string;
  freezePackageId?: UUID;
  createdByUserId?: UUID;
  contractExtended: boolean;
  originalEndDate?: string;
  newEndDate?: string;
  isActive: boolean;
  createdAt: string;
}

// Result of a freeze operation
export interface FreezeResult {
  subscriptionId: UUID;
  status: string;
  freezeHistory: FreezeHistory;
  daysUsedFromBalance: number;
  originalEndDate?: string;
  newEndDate?: string;
}

// Request DTOs
export interface CreateFreezePackageRequest {
  name: { en: string; ar?: string };
  description?: { en: string; ar?: string };
  freezeDays: number;
  priceAmount: number;
  priceCurrency?: string;
  extendsContract?: boolean;
  requiresDocumentation?: boolean;
  sortOrder?: number;
}

export interface UpdateFreezePackageRequest {
  name?: { en: string; ar?: string };
  description?: { en: string; ar?: string };
  freezeDays?: number;
  priceAmount?: number;
  priceCurrency?: string;
  extendsContract?: boolean;
  requiresDocumentation?: boolean;
  sortOrder?: number;
}

export interface FreezeSubscriptionRequest {
  freezeDays: number;
  freezeType?: FreezeType;
  reason?: string;
  documentPath?: string;
}

export interface PurchaseFreezeDaysRequest {
  freezePackageId: UUID;
}

export interface GrantFreezeDaysRequest {
  days: number;
  source?: FreezeSource;
}

// Query parameters
export interface FreezePackageQueryParams {
  active?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface FreezeHistoryQueryParams {
  page?: number;
  size?: number;
}
