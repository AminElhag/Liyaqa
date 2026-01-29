"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as activitiesApi from "@/lib/api/activities";

// Query keys
export const activityKeys = {
  all: ["activities"] as const,
  timeline: () => [...activityKeys.all, "timeline"] as const,
  memberTimeline: (memberId: string) => [...activityKeys.timeline(), memberId] as const,
  recent: (memberId: string) => [...activityKeys.all, "recent", memberId] as const,
  summary: (memberId: string) => [...activityKeys.all, "summary", memberId] as const,
  types: () => [...activityKeys.all, "types"] as const,
  byStaff: (userId: string) => [...activityKeys.all, "by-staff", userId] as const,
};

// Queries

export function useActivityTimeline(
  memberId: string,
  params?: {
    types?: activitiesApi.ActivityType[];
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...activityKeys.memberTimeline(memberId), params],
    queryFn: () => activitiesApi.getActivityTimeline(memberId, params),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useRecentActivities(
  memberId: string,
  limit: number = 10,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...activityKeys.recent(memberId), limit],
    queryFn: () => activitiesApi.getRecentActivities(memberId, limit),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useActivitySummary(memberId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: activityKeys.summary(memberId),
    queryFn: () => activitiesApi.getActivitySummary(memberId),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useActivityTypes(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: activityKeys.types(),
    queryFn: () => activitiesApi.getActivityTypes(),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

export function useActivitiesByStaff(
  userId: string,
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...activityKeys.byStaff(userId), params],
    queryFn: () => activitiesApi.getActivitiesByStaff(userId, params),
    enabled: options?.enabled !== false && !!userId,
  });
}

// Mutations

export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      request,
    }: {
      memberId: string;
      request: activitiesApi.CreateActivityRequest;
    }) => activitiesApi.logActivity(memberId, request),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: activityKeys.memberTimeline(variables.memberId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.recent(variables.memberId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.summary(variables.memberId) });
    },
  });
}
