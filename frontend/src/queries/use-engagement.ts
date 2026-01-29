"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as engagementApi from "@/lib/api/engagement";

// Query keys
export const engagementKeys = {
  all: ["engagement"] as const,
  score: (memberId: string) => [...engagementKeys.all, "score", memberId] as const,
  badge: (memberId: string) => [...engagementKeys.all, "badge", memberId] as const,
  overview: () => [...engagementKeys.all, "overview"] as const,
  atRisk: () => [...engagementKeys.all, "at-risk"] as const,
  riskLevels: () => [...engagementKeys.all, "risk-levels"] as const,
};

// Queries

export function useEngagementScore(
  memberId: string,
  recalculate: boolean = false,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...engagementKeys.score(memberId), recalculate],
    queryFn: () => engagementApi.getEngagementScore(memberId, recalculate),
    enabled: options?.enabled !== false && !!memberId,
  });
}

export function useEngagementBadge(memberId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: engagementKeys.badge(memberId),
    queryFn: () => engagementApi.getEngagementBadge(memberId),
    enabled: options?.enabled !== false && !!memberId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useEngagementOverview(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: engagementKeys.overview(),
    queryFn: () => engagementApi.getEngagementOverview(),
    enabled: options?.enabled !== false,
  });
}

export function useAtRiskMembers(
  params?: {
    riskLevels?: engagementApi.RiskLevel[];
    page?: number;
    size?: number;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...engagementKeys.atRisk(), params],
    queryFn: () => engagementApi.getAtRiskMembers(params),
    enabled: options?.enabled !== false,
  });
}

export function useRiskLevels(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: engagementKeys.riskLevels(),
    queryFn: () => engagementApi.getRiskLevels(),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Mutations

export function useRecalculateEngagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => engagementApi.recalculateEngagementScore(memberId),
    onSuccess: (data, memberId) => {
      queryClient.setQueryData(engagementKeys.score(memberId), data);
      queryClient.invalidateQueries({ queryKey: engagementKeys.badge(memberId) });
      queryClient.invalidateQueries({ queryKey: engagementKeys.atRisk() });
      queryClient.invalidateQueries({ queryKey: engagementKeys.overview() });
    },
  });
}
