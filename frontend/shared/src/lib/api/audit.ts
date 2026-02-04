import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type { AuditLog, AuditLogQueryParams } from "../../types/audit";

// Backend controller now exists at /api/audit
const USE_MOCK = false;
const BASE_URL = "api/audit";

// Mock data for development
const mockAuditLogs: AuditLog[] = [
  {
    id: "mock-1",
    action: "LOGIN",
    entityType: "User",
    entityId: "user-1",
    userEmail: "admin@demo.com",
    description: "User logged in successfully",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-2",
    action: "CREATE",
    entityType: "Member",
    entityId: "member-1",
    userEmail: "admin@demo.com",
    description: "New member created: John Doe",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "mock-3",
    action: "SUBSCRIPTION_ACTIVATE",
    entityType: "Subscription",
    entityId: "sub-1",
    userEmail: "admin@demo.com",
    description: "Subscription activated for member John Doe",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "mock-4",
    action: "CHECK_IN",
    entityType: "Attendance",
    entityId: "att-1",
    userEmail: "staff@demo.com",
    description: "Member checked in: Jane Smith",
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "mock-5",
    action: "INVOICE_ISSUE",
    entityType: "Invoice",
    entityId: "inv-1",
    userEmail: "admin@demo.com",
    description: "Invoice #INV-2024-001 issued",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "mock-6",
    action: "PAYMENT",
    entityType: "Invoice",
    entityId: "inv-1",
    userEmail: "admin@demo.com",
    description: "Payment received for Invoice #INV-2024-001",
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: "mock-7",
    action: "BOOKING_CREATE",
    entityType: "Booking",
    entityId: "booking-1",
    userEmail: "member@demo.com",
    description: "New booking created for Yoga Class",
    createdAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: "mock-8",
    action: "UPDATE",
    entityType: "Member",
    entityId: "member-2",
    userEmail: "admin@demo.com",
    description: "Member profile updated: Jane Smith",
    createdAt: new Date(Date.now() - 25200000).toISOString(),
  },
  {
    id: "mock-9",
    action: "SUBSCRIPTION_FREEZE",
    entityType: "Subscription",
    entityId: "sub-2",
    userEmail: "admin@demo.com",
    description: "Subscription frozen for member Jane Smith",
    createdAt: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    id: "mock-10",
    action: "CHECK_OUT",
    entityType: "Attendance",
    entityId: "att-2",
    userEmail: "staff@demo.com",
    description: "Member checked out: John Doe",
    createdAt: new Date(Date.now() - 32400000).toISOString(),
  },
];

function getMockResponse(
  params: AuditLogQueryParams
): PaginatedResponse<AuditLog> {
  let filtered = [...mockAuditLogs];

  if (params.action) {
    filtered = filtered.filter((log) => log.action === params.action);
  }
  if (params.entityType) {
    filtered = filtered.filter((log) => log.entityType === params.entityType);
  }

  const page = params.page ?? 0;
  const size = params.size ?? 20;
  const start = page * size;
  const content = filtered.slice(start, start + size);

  return {
    content,
    pageable: {
      pageNumber: page,
      pageSize: size,
      sort: {
        sorted: false,
        unsorted: true,
        empty: true,
      },
      offset: start,
      paged: true,
      unpaged: false,
    },
    totalPages: Math.ceil(filtered.length / size),
    totalElements: filtered.length,
    size,
    number: page,
    numberOfElements: content.length,
    first: page === 0,
    last: start + size >= filtered.length,
    empty: content.length === 0,
  };
}

export async function getAuditLogs(
  params: AuditLogQueryParams = {}
): Promise<PaginatedResponse<AuditLog>> {
  if (USE_MOCK) {
    return getMockResponse(params);
  }

  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.action) searchParams.set("action", params.action);
  if (params.entityType) searchParams.set("entityType", params.entityType);
  if (params.entityId) searchParams.set("entityId", params.entityId);
  if (params.userId) searchParams.set("userId", params.userId);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const query = searchParams.toString();
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;
  return api.get(url).json();
}

export async function getAuditLogById(id: UUID): Promise<AuditLog> {
  if (USE_MOCK) {
    const log = mockAuditLogs.find((l) => l.id === id);
    if (!log) throw new Error("Audit log not found");
    return log;
  }
  return api.get(`${BASE_URL}/${id}`).json();
}

export async function getEntityHistory(
  entityType: string,
  entityId: UUID
): Promise<AuditLog[]> {
  if (USE_MOCK) {
    return mockAuditLogs.filter(
      (log) => log.entityType === entityType && log.entityId === entityId
    );
  }
  return api.get(`${BASE_URL}/entity/${entityType}/${entityId}`).json();
}

export async function getUserActivity(
  userId: UUID,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<AuditLog>> {
  if (USE_MOCK) {
    return getMockResponse({ ...params, userId });
  }

  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query
    ? `${BASE_URL}/user/${userId}?${query}`
    : `${BASE_URL}/user/${userId}`;
  return api.get(url).json();
}
