import { api } from "../client";
import type {
  ApiKey,
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
} from "../../../types/platform/api-keys";

const BASE_URL = "api/v1/platform/api-keys";

export async function getApiKeys(tenantId: string): Promise<ApiKey[]> {
  return api.get(`${BASE_URL}/tenants/${tenantId}/keys`).json<ApiKey[]>();
}

export async function createApiKey(tenantId: string, data: ApiKeyCreateRequest): Promise<ApiKeyCreateResponse> {
  return api.post(`${BASE_URL}/tenants/${tenantId}/keys`, { json: data }).json<ApiKeyCreateResponse>();
}

export async function revokeApiKey(id: string): Promise<void> {
  await api.put(`${BASE_URL}/keys/${id}/revoke`);
}

export type { ApiKey, ApiKeyCreateRequest, ApiKeyCreateResponse };
