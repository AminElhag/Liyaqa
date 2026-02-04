"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSecurityEvents,
  getSecurityEventsByType,
  getSecurityEventsBySeverity,
  getUninvestigatedEvents,
  getSecurityEventsByUser,
  getSecurityEventsByDateRange,
  investigateEvent,
  getSecurityStats,
  getRecentHighSeverityEvents,
} from "../lib/api/security-events";
import type { UUID } from "../types/api";
import type {
  SecurityEventParams,
  InvestigateEventRequest,
  SecurityEventType,
  SecuritySeverity,
} from "../types/security-event";

// ===== Query Keys =====

export const securityEventKeys = {
  all: ["securityEvents"] as const,
  lists: () => [...securityEventKeys.all, "list"] as const,
  list: (params: SecurityEventParams) =>
    [...securityEventKeys.lists(), params] as const,
  byType: (type: SecurityEventType) =>
    [...securityEventKeys.all, "type", type] as const,
  bySeverity: (severity: SecuritySeverity) =>
    [...securityEventKeys.all, "severity", severity] as const,
  byUser: (userId: UUID) =>
    [...securityEventKeys.all, "user", userId] as const,
  byDateRange: (startDate: string, endDate: string) =>
    [...securityEventKeys.all, "range", startDate, endDate] as const,
  uninvestigated: () =>
    [...securityEventKeys.all, "uninvestigated"] as const,
  highSeverity: () =>
    [...securityEventKeys.all, "highSeverity"] as const,
  stats: () => [...securityEventKeys.all, "stats"] as const,
};

// ===== Query Hooks =====

export function useSecurityEvents(params: SecurityEventParams = {}) {
  return useQuery({
    queryKey: securityEventKeys.list(params),
    queryFn: () => getSecurityEvents(params),
  });
}

export function useSecurityEventsByType(
  eventType: SecurityEventType,
  params: { page?: number; size?: number } = {}
) {
  return useQuery({
    queryKey: [...securityEventKeys.byType(eventType), params],
    queryFn: () => getSecurityEventsByType(eventType, params),
    enabled: !!eventType,
  });
}

export function useSecurityEventsBySeverity(
  severity: SecuritySeverity,
  params: { page?: number; size?: number } = {}
) {
  return useQuery({
    queryKey: [...securityEventKeys.bySeverity(severity), params],
    queryFn: () => getSecurityEventsBySeverity(severity, params),
    enabled: !!severity,
  });
}

export function useUninvestigatedEvents(params: { page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: [...securityEventKeys.uninvestigated(), params],
    queryFn: () => getUninvestigatedEvents(params),
  });
}

export function useSecurityEventsByUser(
  userId: UUID,
  params: { page?: number; size?: number } = {}
) {
  return useQuery({
    queryKey: [...securityEventKeys.byUser(userId), params],
    queryFn: () => getSecurityEventsByUser(userId, params),
    enabled: !!userId,
  });
}

export function useSecurityEventsByDateRange(
  startDate: string,
  endDate: string,
  params: { page?: number; size?: number } = {}
) {
  return useQuery({
    queryKey: [...securityEventKeys.byDateRange(startDate, endDate), params],
    queryFn: () => getSecurityEventsByDateRange(startDate, endDate, params),
    enabled: !!startDate && !!endDate,
  });
}

export function useRecentHighSeverityEvents(params: { page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: [...securityEventKeys.highSeverity(), params],
    queryFn: () => getRecentHighSeverityEvents(params),
  });
}

export function useSecurityStats() {
  return useQuery({
    queryKey: securityEventKeys.stats(),
    queryFn: () => getSecurityStats(),
  });
}

// ===== Mutation Hooks =====

export function useInvestigateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: UUID; request: InvestigateEventRequest }) =>
      investigateEvent(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityEventKeys.all });
    },
  });
}
