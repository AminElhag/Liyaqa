import api from '@/api/client'
import type { UUID } from '@/types'

const BASE_URL = 'api/platform/health'

/**
 * Risk level type.
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/**
 * Health trend type.
 */
export type HealthTrend = 'IMPROVING' | 'STABLE' | 'DECLINING'

/**
 * Client health score detail.
 */
export interface ClientHealthScore {
  organizationId: UUID
  organizationNameEn: string
  organizationNameAr?: string
  overallScore: number
  riskLevel: RiskLevel
  trend: HealthTrend
  usageScore: number
  engagementScore: number
  paymentScore: number
  supportScore: number
  scoreChange: number
  lastCalculatedAt: string
}

/**
 * Health history data point.
 */
export interface HealthHistoryPoint {
  date: string
  overallScore: number
  usageScore: number
  engagementScore: number
  paymentScore: number
  supportScore: number
  events?: HealthEvent[]
}

/**
 * Health event.
 */
export interface HealthEvent {
  type: string
  description: string
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  timestamp: string
}

/**
 * Platform health overview.
 */
export interface PlatformHealthOverview {
  totalClients: number
  averageScore: number
  healthyCount: number
  monitorCount: number
  atRiskCount: number
  criticalCount: number
  improvingCount: number
  decliningCount: number
}

/**
 * Health intervention recommendation.
 */
export interface HealthIntervention {
  type: string
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  actionUrl?: string
}

/**
 * Health signal.
 */
export interface HealthSignal {
  type: string
  titleEn: string
  titleAr: string
  value: string
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  weight: number
}

/**
 * Client health detail with interventions.
 */
export interface ClientHealthDetail extends ClientHealthScore {
  interventions: HealthIntervention[]
  signals: HealthSignal[]
}

/**
 * Get platform health overview.
 */
export async function getPlatformHealthOverview(): Promise<PlatformHealthOverview> {
  return api
    .get<PlatformHealthOverview>(`${BASE_URL}/overview`)
    .then((r) => r.data)
}

/**
 * Get client health score.
 */
export async function getClientHealthScore(
  organizationId: string,
): Promise<ClientHealthScore> {
  return api
    .get<ClientHealthScore>(`${BASE_URL}/${organizationId}`)
    .then((r) => r.data)
}

/**
 * Get client health detail with interventions.
 */
export async function getClientHealthDetail(
  organizationId: string,
): Promise<ClientHealthDetail> {
  return api
    .get<ClientHealthDetail>(`${BASE_URL}/${organizationId}/detail`)
    .then((r) => r.data)
}

/**
 * Get client health history.
 */
export async function getClientHealthHistory(
  organizationId: string,
  days: number = 30,
): Promise<HealthHistoryPoint[]> {
  return api
    .get<HealthHistoryPoint[]>(`${BASE_URL}/${organizationId}/history`, {
      params: { days },
    })
    .then((r) => r.data)
}

/**
 * Get at-risk clients.
 */
export async function getAtRiskClients(
  riskLevel?: RiskLevel,
  limit: number = 50,
): Promise<ClientHealthScore[]> {
  const params: Record<string, string | number> = { limit }
  if (riskLevel) params.riskLevel = riskLevel

  return api
    .get<ClientHealthScore[]>(`${BASE_URL}/at-risk`, { params })
    .then((r) => r.data)
}

/**
 * Get clients by health trend.
 */
export async function getClientsByTrend(
  trend: HealthTrend,
  limit: number = 50,
): Promise<ClientHealthScore[]> {
  return api
    .get<ClientHealthScore[]>(`${BASE_URL}/by-trend`, {
      params: { trend, limit },
    })
    .then((r) => r.data)
}

/**
 * Recalculate client health score.
 */
export async function recalculateHealthScore(
  organizationId: string,
): Promise<ClientHealthScore> {
  return api
    .post<ClientHealthScore>(`${BASE_URL}/${organizationId}/recalculate`)
    .then((r) => r.data)
}

/**
 * Export at-risk clients to CSV.
 */
export async function exportAtRiskClientsToCsv(riskLevel?: RiskLevel): Promise<Blob> {
  const params: Record<string, string> = {}
  if (riskLevel) params.riskLevel = riskLevel

  return api
    .get<Blob>(`${BASE_URL}/export/at-risk-csv`, { params, responseType: 'blob' })
    .then((r) => r.data)
}
