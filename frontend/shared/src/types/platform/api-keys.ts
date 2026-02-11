import type { UUID } from "../api";

export interface ApiKey {
  id: UUID;
  name: string;
  keyMasked: string;
  tenantId: UUID;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  revokedAt?: string;
}

export interface ApiKeyCreateRequest {
  name: string;
  permissions: string[];
  rateLimit?: number;
  expiresInDays?: number;
}

export interface ApiKeyCreateResponse {
  id: UUID;
  name: string;
  key: string;
  keyPrefix: string;
  tenantId: UUID;
  permissions: string[];
  rateLimit: number;
  expiresAt?: string;
  createdAt: string;
}
