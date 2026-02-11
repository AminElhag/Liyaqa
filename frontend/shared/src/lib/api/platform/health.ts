import { api } from "../client";
import type { UUID } from "../../../types/api";

const BASE_URL = "api/platform/health";

/**
 * Risk level type
 */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Health trend type
 */
export type HealthTrend = "IMPROVING" | "STABLE" | "DECLINING";

/**
 * Client health score detail
 */
export interface ClientHealthScore {
  organizationId: UUID;
  organizationNameEn: string;
  organizationNameAr?: string;
  overallScore: number;
  riskLevel: RiskLevel;
  trend: HealthTrend;
  usageScore: number;
  engagementScore: number;
  paymentScore: number;
  supportScore: number;
  scoreChange: number;
  lastCalculatedAt: string;
}

/**
 * Health history data point
 */
export interface HealthHistoryPoint {
  date: string;
  overallScore: number;
  usageScore: number;
  engagementScore: number;
  paymentScore: number;
  supportScore: number;
  events?: HealthEvent[];
}

/**
 * Health event
 */
export interface HealthEvent {
  type: string;
  description: string;
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  timestamp: string;
}

/**
 * Platform health overview
 */
export interface PlatformHealthOverview {
  totalClients: number;
  averageScore: number;
  healthyCount: number;
  monitorCount: number;
  atRiskCount: number;
  criticalCount: number;
  improvingCount: number;
  decliningCount: number;
}

/**
 * Health intervention recommendation
 */
export interface HealthIntervention {
  type: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  actionUrl?: string;
}

/**
 * Client health detail with interventions
 */
export interface ClientHealthDetail extends ClientHealthScore {
  interventions: HealthIntervention[];
  signals: HealthSignal[];
}

/**
 * Health signal
 */
export interface HealthSignal {
  type: string;
  titleEn: string;
  titleAr: string;
  value: string;
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  weight: number;
}

/**
 * Get platform health overview
 */
export async function getPlatformHealthOverview(): Promise<PlatformHealthOverview> {
  return api.get(`${BASE_URL}/overview`).json<PlatformHealthOverview>();
}

/**
 * Get client health score
 */
export async function getClientHealthScore(
  organizationId: string
): Promise<ClientHealthScore> {
  return api.get(`${BASE_URL}/${organizationId}`).json<ClientHealthScore>();
}

/**
 * Get client health detail with interventions
 */
export async function getClientHealthDetail(
  organizationId: string
): Promise<ClientHealthDetail> {
  return api.get(`${BASE_URL}/${organizationId}/detail`).json<ClientHealthDetail>();
}

/**
 * Get client health history
 */
export async function getClientHealthHistory(
  organizationId: string,
  days: number = 30
): Promise<HealthHistoryPoint[]> {
  const page = await api
    .get(`${BASE_URL}/${organizationId}/history`, {
      searchParams: { days: String(days), size: "100", page: "0" },
    })
    .json<{ content: HealthHistoryPoint[] }>();
  return page.content;
}

/**
 * Get at-risk clients
 */
export async function getAtRiskClients(
  riskLevel?: RiskLevel,
  limit: number = 50
): Promise<ClientHealthScore[]> {
  const searchParams: Record<string, string> = {
    size: String(limit),
    page: "0",
  };
  if (riskLevel) searchParams.riskLevel = riskLevel;

  const page = await api
    .get(`${BASE_URL}/at-risk`, { searchParams })
    .json<{ content: ClientHealthScore[] }>();
  return page.content;
}

/**
 * Get clients by health trend
 */
export async function getClientsByTrend(
  trend: HealthTrend,
  limit: number = 50
): Promise<ClientHealthScore[]> {
  return api
    .get(`${BASE_URL}/by-trend`, {
      searchParams: { trend, limit: String(limit) },
    })
    .json<ClientHealthScore[]>();
}

/**
 * Recalculate client health score
 */
export async function recalculateHealthScore(
  organizationId: string
): Promise<ClientHealthScore> {
  return api
    .post(`${BASE_URL}/${organizationId}/recalculate`)
    .json<ClientHealthScore>();
}

/**
 * Export at-risk clients to CSV
 */
export async function exportAtRiskClientsToCsv(
  riskLevel?: RiskLevel
): Promise<Blob> {
  const searchParams: Record<string, string> = {};
  if (riskLevel) searchParams.riskLevel = riskLevel;

  const response = await api.get(`${BASE_URL}/export/at-risk-csv`, {
    searchParams,
  });
  return response.blob();
}
