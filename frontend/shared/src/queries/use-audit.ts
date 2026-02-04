"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAuditLogs,
  getAuditLogById,
  getEntityHistory,
  getUserActivity,
} from "../lib/api/audit";
import type { UUID } from "../types/api";
import type { AuditLogQueryParams } from "../types/audit";

export const auditKeys = {
  all: ["audit"] as const,
  lists: () => [...auditKeys.all, "list"] as const,
  list: (params: AuditLogQueryParams) => [...auditKeys.lists(), params] as const,
  detail: (id: UUID) => [...auditKeys.all, "detail", id] as const,
  entityHistory: (entityType: string, entityId: UUID) =>
    [...auditKeys.all, "entity", entityType, entityId] as const,
  userActivity: (userId: UUID) => [...auditKeys.all, "user", userId] as const,
};

export function useAuditLogs(params: AuditLogQueryParams = {}) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => getAuditLogs(params),
  });
}

export function useAuditLog(id: UUID) {
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: () => getAuditLogById(id),
    enabled: !!id,
  });
}

export function useEntityHistory(entityType: string, entityId: UUID) {
  return useQuery({
    queryKey: auditKeys.entityHistory(entityType, entityId),
    queryFn: () => getEntityHistory(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useUserActivity(
  userId: UUID,
  params: { page?: number; size?: number } = {}
) {
  return useQuery({
    queryKey: [...auditKeys.userActivity(userId), params],
    queryFn: () => getUserActivity(userId, params),
    enabled: !!userId,
  });
}
