import type { UUID, LocalizedText, ListQueryParams } from "./api";

/**
 * Organization type (legal structure)
 */
export type OrganizationType =
  | "LLC"
  | "SOLE_PROPRIETORSHIP"
  | "PARTNERSHIP"
  | "CORPORATION"
  | "OTHER";

/**
 * Organization status
 */
export type OrganizationStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED";

/**
 * Club status
 */
export type ClubStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED";

/**
 * Organization
 */
export interface Organization {
  id: UUID;
  name: LocalizedText;
  email: string;
  phone?: string;
  website?: string;
  address?: LocalizedText;
  logoUrl?: string;
  status: OrganizationStatus;
  zatcaSellerName?: string;
  zatcaVatNumber?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Club
 */
export interface Club {
  id: UUID;
  organizationId: UUID;
  organizationName?: LocalizedText;
  name: LocalizedText;
  email: string;
  phone?: string;
  address?: LocalizedText;
  logoUrl?: string;
  status: ClubStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Location
 */
export interface Location {
  id: UUID;
  clubId: UUID;
  clubName?: LocalizedText;
  name: LocalizedText;
  address?: LocalizedText;
  capacity?: number;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create organization request
 */
export interface CreateOrganizationRequest {
  name: LocalizedText;
  email: string;
  phone?: string;
  website?: string;
  address?: LocalizedText;
  zatcaSellerName?: string;
  zatcaVatNumber?: string;
}

/**
 * Update organization request
 */
export interface UpdateOrganizationRequest {
  name?: LocalizedText;
  email?: string;
  phone?: string;
  website?: string;
  address?: LocalizedText;
  zatcaSellerName?: string;
  zatcaVatNumber?: string;
}

/**
 * Create club request
 */
export interface CreateClubRequest {
  organizationId: UUID;
  name: LocalizedText;
  email: string;
  phone?: string;
  address?: LocalizedText;
}

/**
 * Update club request
 */
export interface UpdateClubRequest {
  name?: LocalizedText;
  email?: string;
  phone?: string;
  address?: LocalizedText;
}

/**
 * Create location request
 */
export interface CreateLocationRequest {
  clubId: UUID;
  name: LocalizedText;
  address?: LocalizedText;
  capacity?: number;
  phone?: string;
  email?: string;
}

/**
 * Update location request
 */
export interface UpdateLocationRequest {
  name?: LocalizedText;
  address?: LocalizedText;
  capacity?: number;
  phone?: string;
  email?: string;
}

/**
 * Organization query params
 */
export interface OrganizationQueryParams extends ListQueryParams {
  status?: OrganizationStatus;
  search?: string;
}

/**
 * Club query params
 */
export interface ClubQueryParams extends ListQueryParams {
  organizationId?: UUID;
  status?: ClubStatus;
  search?: string;
}

/**
 * Location query params
 */
export interface LocationQueryParams extends ListQueryParams {
  clubId?: UUID;
  isActive?: boolean;
  search?: string;
}
