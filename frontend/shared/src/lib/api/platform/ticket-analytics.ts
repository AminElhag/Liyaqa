import { api } from "../client";
import type {
  TicketOverviewResponse,
  AgentPerformanceResponse,
  TicketTrendResponse,
  TrendPeriod,
} from "../../../types/platform/ticket-analytics";

const BASE_URL = "api/v1/platform/tickets/analytics";

/**
 * Get ticket overview statistics
 */
export async function getTicketOverview(): Promise<TicketOverviewResponse> {
  return api.get(`${BASE_URL}/overview`).json<TicketOverviewResponse>();
}

/**
 * Get agent performance metrics
 */
export async function getAgentPerformance(): Promise<AgentPerformanceResponse[]> {
  return api.get(`${BASE_URL}/agents`).json<AgentPerformanceResponse[]>();
}

/**
 * Get ticket trends
 */
export async function getTicketTrends(
  period: TrendPeriod = "DAILY"
): Promise<TicketTrendResponse> {
  return api
    .get(`${BASE_URL}/trends`, { searchParams: { period } })
    .json<TicketTrendResponse>();
}
