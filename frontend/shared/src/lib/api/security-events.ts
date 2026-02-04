import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  SecurityEvent,
  SecurityStats,
  SecurityEventParams,
  InvestigateEventRequest,
  SecurityEventType,
  SecuritySeverity,
} from "../../types/security-event";

const BASE_URL = "api/security-events";

export async function getSecurityEvents(
  params: SecurityEventParams = {}
): Promise<PaginatedResponse<SecurityEvent>> {
  const searchParams = new URLSearchParams();
  if (params.eventType) searchParams.set("eventType", params.eventType);
  if (params.severity) searchParams.set("severity", params.severity);
  if (params.userId) searchParams.set("userId", params.userId);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.investigated !== undefined) searchParams.set("investigated", String(params.investigated));
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;
  return api.get(url).json();
}

export async function getSecurityEventsByType(
  eventType: SecurityEventType,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<SecurityEvent>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/type/${eventType}?${query}` : `${BASE_URL}/type/${eventType}`;
  return api.get(url).json();
}

export async function getSecurityEventsBySeverity(
  severity: SecuritySeverity,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<SecurityEvent>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/severity/${severity}?${query}` : `${BASE_URL}/severity/${severity}`;
  return api.get(url).json();
}

export async function getUninvestigatedEvents(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<SecurityEvent>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/uninvestigated?${query}` : `${BASE_URL}/uninvestigated`;
  return api.get(url).json();
}

export async function getSecurityEventsByUser(
  userId: UUID,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<SecurityEvent>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/user/${userId}?${query}` : `${BASE_URL}/user/${userId}`;
  return api.get(url).json();
}

export async function getSecurityEventsByDateRange(
  startDate: string,
  endDate: string,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<SecurityEvent>> {
  const searchParams = new URLSearchParams();
  searchParams.set("startDate", startDate);
  searchParams.set("endDate", endDate);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  return api.get(`${BASE_URL}/range?${query}`).json();
}

export async function investigateEvent(
  id: UUID,
  request: InvestigateEventRequest
): Promise<SecurityEvent> {
  return api.post(`${BASE_URL}/${id}/investigate`, { json: request }).json();
}

export async function getSecurityStats(): Promise<SecurityStats> {
  return api.get(`${BASE_URL}/stats`).json();
}

export async function getRecentHighSeverityEvents(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<SecurityEvent>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}/recent-high-severity?${query}` : `${BASE_URL}/recent-high-severity`;
  return api.get(url).json();
}
