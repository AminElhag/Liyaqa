"use client";

import {
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getTicketOverview,
  getAgentPerformance,
  getTicketTrends,
} from "../../lib/api/platform/ticket-analytics";
import type {
  TicketOverviewResponse,
  AgentPerformanceResponse,
  TicketTrendResponse,
  TrendPeriod,
} from "../../types/platform/ticket-analytics";

export const ticketAnalyticsKeys = {
  all: ["platform", "ticket-analytics"] as const,
  overview: () => [...ticketAnalyticsKeys.all, "overview"] as const,
  agents: () => [...ticketAnalyticsKeys.all, "agents"] as const,
  trends: (period: TrendPeriod) => [...ticketAnalyticsKeys.all, "trends", period] as const,
};

export function useTicketOverview(
  options?: Omit<UseQueryOptions<TicketOverviewResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ticketAnalyticsKeys.overview(),
    queryFn: getTicketOverview,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useAgentPerformance(
  options?: Omit<UseQueryOptions<AgentPerformanceResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ticketAnalyticsKeys.agents(),
    queryFn: getAgentPerformance,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useTicketTrends(
  period: TrendPeriod = "DAILY",
  options?: Omit<UseQueryOptions<TicketTrendResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ticketAnalyticsKeys.trends(period),
    queryFn: () => getTicketTrends(period),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
