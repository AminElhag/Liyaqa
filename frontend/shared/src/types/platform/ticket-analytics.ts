import type { UUID } from "../api";

/**
 * Trend period for analytics
 */
export type TrendPeriod = "DAILY" | "WEEKLY" | "MONTHLY";

/**
 * Ticket overview response
 */
export interface TicketOverviewResponse {
  totalOpen: number;
  totalClosed: number;
  totalPending: number;
  averageResolutionHours: number;
  slaComplianceRate: number;
  firstResponseTimeHours: number;
  customerSatisfactionScore: number;
  openByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

/**
 * Agent performance response
 */
export interface AgentPerformanceResponse {
  agentId: UUID;
  agentName: string;
  agentEmail: string;
  assignedTickets: number;
  resolvedTickets: number;
  averageResolutionHours: number;
  slaComplianceRate: number;
  customerSatisfactionScore: number;
  responseRate: number;
}

/**
 * Ticket trend data point
 */
export interface TicketTrendPoint {
  date: string;
  opened: number;
  closed: number;
  pending: number;
}

/**
 * Ticket trend response
 */
export interface TicketTrendResponse {
  period: TrendPeriod;
  data: TicketTrendPoint[];
}
