import api from '@/api/client'
import type {
  PlatformDashboard,
  PlatformSummary,
  PlatformRevenue,
  MonthlyRevenue,
  ClientGrowth,
  DealPipelineOverview,
  ExpiringClientSubscription,
  TopClient,
  RecentActivity,
  PlatformHealth,
  SupportTicketStats,
} from '@/types'

const BASE_URL = 'api/platform/dashboard'

export interface DateRangeParams {
  startDate?: string
  endDate?: string
}

/**
 * Get complete platform dashboard.
 */
export async function getPlatformDashboard(
  timezone: string = 'Asia/Riyadh',
  dateRange?: DateRangeParams,
): Promise<PlatformDashboard> {
  const params: Record<string, string> = { timezone }
  if (dateRange?.startDate) params.startDate = dateRange.startDate
  if (dateRange?.endDate) params.endDate = dateRange.endDate

  return api.get<PlatformDashboard>(BASE_URL, { params }).then((r) => r.data)
}

/**
 * Get platform summary statistics.
 */
export async function getPlatformSummary(): Promise<PlatformSummary> {
  return api.get<PlatformSummary>(`${BASE_URL}/summary`).then((r) => r.data)
}

/**
 * Get platform revenue metrics (PLATFORM_ADMIN only).
 */
export async function getPlatformRevenue(
  timezone: string = 'Asia/Riyadh',
  dateRange?: DateRangeParams,
): Promise<PlatformRevenue> {
  const params: Record<string, string> = { timezone }
  if (dateRange?.startDate) params.startDate = dateRange.startDate
  if (dateRange?.endDate) params.endDate = dateRange.endDate

  return api.get<PlatformRevenue>(`${BASE_URL}/revenue`, { params }).then((r) => r.data)
}

/**
 * Get monthly revenue breakdown.
 */
export async function getMonthlyRevenue(months: number = 12): Promise<MonthlyRevenue[]> {
  return api
    .get<MonthlyRevenue[]>(`${BASE_URL}/revenue/monthly`, { params: { months } })
    .then((r) => r.data)
}

/**
 * Get client growth metrics.
 */
export async function getClientGrowth(): Promise<ClientGrowth> {
  return api.get<ClientGrowth>(`${BASE_URL}/growth`).then((r) => r.data)
}

/**
 * Get deal pipeline overview.
 */
export async function getDealPipeline(): Promise<DealPipelineOverview> {
  return api.get<DealPipelineOverview>(`${BASE_URL}/deal-pipeline`).then((r) => r.data)
}

/**
 * Get expiring subscriptions.
 */
export async function getExpiringSubscriptions(
  daysAhead: number = 30,
): Promise<ExpiringClientSubscription[]> {
  return api
    .get<ExpiringClientSubscription[]>(`${BASE_URL}/expiring-subscriptions`, {
      params: { daysAhead },
    })
    .then((r) => r.data)
}

/**
 * Get top clients by revenue.
 */
export async function getTopClients(limit: number = 10): Promise<TopClient[]> {
  return api
    .get<TopClient[]>(`${BASE_URL}/top-clients`, { params: { limit } })
    .then((r) => r.data)
}

/**
 * Get recent platform activity.
 */
export async function getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
  return api
    .get<RecentActivity[]>(`${BASE_URL}/recent-activity`, { params: { limit } })
    .then((r) => r.data)
}

/**
 * Get platform health indicators.
 */
export async function getPlatformHealth(): Promise<PlatformHealth> {
  return api.get<PlatformHealth>(`${BASE_URL}/health`).then((r) => r.data)
}

/**
 * Get support ticket statistics.
 */
export async function getSupportStats(): Promise<SupportTicketStats> {
  return api.get<SupportTicketStats>(`${BASE_URL}/support-stats`).then((r) => r.data)
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export summary statistics to CSV.
 */
export async function exportSummaryToCsv(): Promise<Blob> {
  return api
    .get<Blob>(`${BASE_URL}/export/summary-csv`, { responseType: 'blob' })
    .then((r) => r.data)
}

/**
 * Export revenue metrics to CSV.
 */
export async function exportRevenueToCsv(timezone: string = 'Asia/Riyadh'): Promise<Blob> {
  return api
    .get<Blob>(`${BASE_URL}/export/revenue-csv`, {
      params: { timezone },
      responseType: 'blob',
    })
    .then((r) => r.data)
}

/**
 * Export monthly revenue breakdown to CSV.
 */
export async function exportMonthlyRevenueToCsv(months: number = 12): Promise<Blob> {
  return api
    .get<Blob>(`${BASE_URL}/export/monthly-csv`, {
      params: { months },
      responseType: 'blob',
    })
    .then((r) => r.data)
}

/**
 * Export top clients by revenue to CSV.
 */
export async function exportTopClientsToCsv(limit: number = 10): Promise<Blob> {
  return api
    .get<Blob>(`${BASE_URL}/export/clients-csv`, {
      params: { limit },
      responseType: 'blob',
    })
    .then((r) => r.data)
}

/**
 * Export complete dashboard report to PDF.
 */
export async function exportDashboardToPdf(timezone: string = 'Asia/Riyadh'): Promise<Blob> {
  return api
    .get<Blob>(`${BASE_URL}/export/pdf`, {
      params: { timezone },
      responseType: 'blob',
    })
    .then((r) => r.data)
}

/**
 * Helper function to download blob as file.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
