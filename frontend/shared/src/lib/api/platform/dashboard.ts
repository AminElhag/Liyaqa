import { api } from "../client";
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
} from "../../../types/platform";

const BASE_URL = "api/platform/dashboard";

export interface DateRangeParams {
  startDate?: string; // ISO format: yyyy-MM-dd
  endDate?: string;   // ISO format: yyyy-MM-dd
}

/**
 * Get complete platform dashboard
 */
export async function getPlatformDashboard(
  timezone: string = "Asia/Riyadh",
  dateRange?: DateRangeParams
): Promise<PlatformDashboard> {
  const searchParams: Record<string, string> = { timezone };
  if (dateRange?.startDate) searchParams.startDate = dateRange.startDate;
  if (dateRange?.endDate) searchParams.endDate = dateRange.endDate;

  return api.get(BASE_URL, { searchParams }).json<PlatformDashboard>();
}

/**
 * Get platform summary statistics
 */
export async function getPlatformSummary(): Promise<PlatformSummary> {
  return api.get(`${BASE_URL}/summary`).json<PlatformSummary>();
}

/**
 * Get platform revenue metrics (PLATFORM_ADMIN only)
 */
export async function getPlatformRevenue(
  timezone: string = "Asia/Riyadh",
  dateRange?: DateRangeParams
): Promise<PlatformRevenue> {
  const searchParams: Record<string, string> = { timezone };
  if (dateRange?.startDate) searchParams.startDate = dateRange.startDate;
  if (dateRange?.endDate) searchParams.endDate = dateRange.endDate;

  return api.get(`${BASE_URL}/revenue`, { searchParams }).json<PlatformRevenue>();
}

/**
 * Get monthly revenue breakdown
 */
export async function getMonthlyRevenue(months: number = 12): Promise<MonthlyRevenue[]> {
  return api
    .get(`${BASE_URL}/revenue/monthly`, { searchParams: { months: String(months) } })
    .json<MonthlyRevenue[]>();
}

/**
 * Get client growth metrics
 */
export async function getClientGrowth(): Promise<ClientGrowth> {
  return api.get(`${BASE_URL}/growth`).json<ClientGrowth>();
}

/**
 * Get deal pipeline overview
 */
export async function getDealPipeline(): Promise<DealPipelineOverview> {
  return api.get(`${BASE_URL}/deal-pipeline`).json<DealPipelineOverview>();
}

/**
 * Get expiring subscriptions
 */
export async function getExpiringSubscriptions(
  daysAhead: number = 30
): Promise<ExpiringClientSubscription[]> {
  return api
    .get(`${BASE_URL}/expiring-subscriptions`, {
      searchParams: { daysAhead: String(daysAhead) },
    })
    .json<ExpiringClientSubscription[]>();
}

/**
 * Get top clients by revenue
 */
export async function getTopClients(limit: number = 10): Promise<TopClient[]> {
  return api
    .get(`${BASE_URL}/top-clients`, { searchParams: { limit: String(limit) } })
    .json<TopClient[]>();
}

/**
 * Get recent platform activity
 */
export async function getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
  return api
    .get(`${BASE_URL}/recent-activity`, { searchParams: { limit: String(limit) } })
    .json<RecentActivity[]>();
}

/**
 * Get platform health indicators
 */
export async function getPlatformHealth(): Promise<PlatformHealth> {
  return api.get(`${BASE_URL}/health`).json<PlatformHealth>();
}

/**
 * Get support ticket statistics
 */
export async function getSupportStats(): Promise<SupportTicketStats> {
  return api.get(`${BASE_URL}/support-stats`).json<SupportTicketStats>();
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export summary statistics to CSV
 */
export async function exportSummaryToCsv(): Promise<Blob> {
  const response = await api.get(`${BASE_URL}/export/summary-csv`);
  return response.blob();
}

/**
 * Export revenue metrics to CSV
 */
export async function exportRevenueToCsv(timezone: string = "Asia/Riyadh"): Promise<Blob> {
  const response = await api.get(`${BASE_URL}/export/revenue-csv`, {
    searchParams: { timezone },
  });
  return response.blob();
}

/**
 * Export monthly revenue breakdown to CSV
 */
export async function exportMonthlyRevenueToCsv(months: number = 12): Promise<Blob> {
  const response = await api.get(`${BASE_URL}/export/monthly-csv`, {
    searchParams: { months: String(months) },
  });
  return response.blob();
}

/**
 * Export top clients by revenue to CSV
 */
export async function exportTopClientsToCsv(limit: number = 10): Promise<Blob> {
  const response = await api.get(`${BASE_URL}/export/clients-csv`, {
    searchParams: { limit: String(limit) },
  });
  return response.blob();
}

/**
 * Export complete dashboard report to PDF
 */
export async function exportDashboardToPdf(timezone: string = "Asia/Riyadh"): Promise<Blob> {
  const response = await api.get(`${BASE_URL}/export/pdf`, {
    searchParams: { timezone },
  });
  return response.blob();
}

/**
 * Helper function to download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
