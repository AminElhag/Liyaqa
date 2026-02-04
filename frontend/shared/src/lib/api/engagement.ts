import { apiClient } from "./client";

const ENDPOINT = "api/members";
const ENGAGEMENT_ENDPOINT = "api/engagement";

// Types
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskFactor {
  code: string;
  title: string;
  description: string;
  severity: string;
  impact: number;
}

export interface RecommendedAction {
  code: string;
  title: string;
  description: string;
  priority: number;
  actionType: string;
}

export interface EngagementScore {
  id: string;
  memberId: string;
  overallScore: number;
  visitScore: number;
  recencyScore: number;
  paymentScore: number;
  classScore: number;
  tenureScore: number;
  riskLevel: RiskLevel;
  riskFactors?: RiskFactor[];
  recommendedActions?: RecommendedAction[];
  calculatedAt: string;
  isStale: boolean;
}

export interface EngagementBadge {
  score: number;
  riskLevel: RiskLevel;
  color: string;
  label: string;
}

export interface EngagementOverview {
  averageScore: number;
  scoreDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;
  atRiskCount: number;
  criticalCount: number;
}

export interface AtRiskMember {
  memberId: string;
  memberName?: string;
  memberEmail?: string;
  overallScore: number;
  riskLevel: RiskLevel;
  riskFactors?: RiskFactor[];
  recommendedActions?: RecommendedAction[];
  calculatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// API Functions

/**
 * Get engagement score for a member
 */
export async function getEngagementScore(
  memberId: string,
  recalculate: boolean = false
): Promise<EngagementScore> {
  return apiClient.get(`${ENDPOINT}/${memberId}/engagement?recalculate=${recalculate}`).json();
}

/**
 * Get engagement badge for a member
 */
export async function getEngagementBadge(memberId: string): Promise<EngagementBadge> {
  return apiClient.get(`${ENDPOINT}/${memberId}/engagement/badge`).json();
}

/**
 * Recalculate engagement score for a member
 */
export async function recalculateEngagementScore(memberId: string): Promise<EngagementScore> {
  return apiClient.post(`${ENDPOINT}/${memberId}/engagement/recalculate`).json();
}

/**
 * Get at-risk members
 */
export async function getAtRiskMembers(params?: {
  riskLevels?: RiskLevel[];
  page?: number;
  size?: number;
}): Promise<PageResponse<AtRiskMember>> {
  const searchParams = new URLSearchParams();
  if (params?.riskLevels && params.riskLevels.length > 0) {
    params.riskLevels.forEach((level) => searchParams.append("riskLevels", level));
  }
  if (params?.page !== undefined) searchParams.set("page", params.page.toString());
  if (params?.size !== undefined) searchParams.set("size", params.size.toString());

  const query = searchParams.toString();
  return apiClient.get(`${ENDPOINT}/at-risk${query ? `?${query}` : ""}`).json();
}

/**
 * Get engagement overview statistics
 */
export async function getEngagementOverview(): Promise<EngagementOverview> {
  return apiClient.get(`${ENGAGEMENT_ENDPOINT}/overview`).json();
}

/**
 * Get available risk levels
 */
export async function getRiskLevels(): Promise<RiskLevel[]> {
  return apiClient.get(`${ENGAGEMENT_ENDPOINT}/risk-levels`).json();
}
