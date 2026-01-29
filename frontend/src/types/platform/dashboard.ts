import type { UUID } from "../api";

/**
 * Summary statistics for the platform dashboard.
 */
export interface PlatformSummary {
  totalClients: number;
  activeClients: number;
  pendingClients: number;
  suspendedClients: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiringSubscriptions: number;
  totalDeals: number;
  openDeals: number;
  wonDealsThisMonth: number;
  lostDealsThisMonth: number;
  totalInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
}

/**
 * Revenue metrics for the platform.
 */
export interface PlatformRevenue {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueThisYear: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerClient: number;
  outstandingAmount: number;
  overdueAmount: number;
  collectionRate: number;
  currency: string;
}

/**
 * Revenue breakdown by month.
 */
export interface MonthlyRevenue {
  year: number;
  month: number;
  monthName: string;
  revenue: number;
  invoiceCount: number;
  currency: string;
}

/**
 * Client growth metrics.
 */
export interface ClientGrowth {
  newClientsThisMonth: number;
  newClientsLastMonth: number;
  churnedClientsThisMonth: number;
  netGrowthThisMonth: number;
  growthRate: number;
}

/**
 * Expiring subscription info for dashboard.
 */
export interface ExpiringClientSubscription {
  subscriptionId: UUID;
  organizationId: UUID;
  organizationNameEn: string;
  organizationNameAr?: string;
  planNameEn: string;
  planNameAr?: string;
  endDate: string;
  daysUntilExpiry: number;
  agreedPrice: number;
  currency: string;
  autoRenew: boolean;
  salesRepId?: UUID;
}

/**
 * Top client by revenue.
 */
export interface TopClient {
  organizationId: UUID;
  organizationNameEn: string;
  organizationNameAr?: string;
  totalRevenue: number;
  invoiceCount: number;
  subscriptionStatus: string;
  currency: string;
}

/**
 * Recent activity for dashboard.
 */
export interface RecentActivity {
  activityType: string;
  description: string;
  entityId: UUID;
  entityType: string;
  timestamp: string;
  userId?: UUID;
  userEmail?: string;
}

/**
 * Deal pipeline overview.
 */
export interface DealPipelineOverview {
  leads: number;
  qualified: number;
  proposal: number;
  negotiation: number;
  totalValue: number;
  weightedValue: number;
  currency: string;
}

/**
 * Health alert.
 */
export interface HealthAlert {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  count: number;
  actionUrl?: string;
}

/**
 * Platform health indicators.
 */
export interface PlatformHealth {
  clientHealthScore: number;
  paymentHealthScore: number;
  subscriptionHealthScore: number;
  overallHealthScore: number;
  totalClients?: number;
  alerts: HealthAlert[];
}

/**
 * Support ticket statistics for support dashboard.
 */
export interface SupportTicketStats {
  openTickets: number;
  inProgressTickets: number;
  waitingOnClientTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResponseTime: number; // in hours
}

/**
 * Combined dashboard response.
 */
export interface PlatformDashboard {
  summary: PlatformSummary;
  revenue: PlatformRevenue;
  growth: ClientGrowth;
  dealPipeline: DealPipelineOverview;
  expiringSubscriptions: ExpiringClientSubscription[];
  topClients: TopClient[];
  recentActivity: RecentActivity[];
}
