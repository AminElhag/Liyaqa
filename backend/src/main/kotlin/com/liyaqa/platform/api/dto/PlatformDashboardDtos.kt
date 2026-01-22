package com.liyaqa.platform.api.dto

import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

// ============================================
// Platform Dashboard DTOs
// ============================================

/**
 * Summary statistics for the platform dashboard.
 */
data class PlatformSummaryResponse(
    val totalClients: Long,
    val activeClients: Long,
    val pendingClients: Long,
    val suspendedClients: Long,
    val totalSubscriptions: Long,
    val activeSubscriptions: Long,
    val trialSubscriptions: Long,
    val expiringSubscriptions: Long,
    val totalDeals: Long,
    val openDeals: Long,
    val wonDealsThisMonth: Long,
    val lostDealsThisMonth: Long,
    val totalInvoices: Long,
    val unpaidInvoices: Long,
    val overdueInvoices: Long
)

/**
 * Revenue metrics for the platform.
 */
data class PlatformRevenueResponse(
    val totalRevenue: BigDecimal,
    val revenueThisMonth: BigDecimal,
    val revenueLastMonth: BigDecimal,
    val revenueThisYear: BigDecimal,
    val monthlyRecurringRevenue: BigDecimal,
    val averageRevenuePerClient: BigDecimal,
    val outstandingAmount: BigDecimal,
    val overdueAmount: BigDecimal,
    val collectionRate: BigDecimal,
    val currency: String
)

/**
 * Revenue breakdown by month.
 */
data class MonthlyRevenueResponse(
    val year: Int,
    val month: Int,
    val monthName: String,
    val revenue: BigDecimal,
    val invoiceCount: Long,
    val currency: String
)

/**
 * Client growth metrics.
 */
data class ClientGrowthResponse(
    val newClientsThisMonth: Long,
    val newClientsLastMonth: Long,
    val churnedClientsThisMonth: Long,
    val netGrowthThisMonth: Long,
    val growthRate: BigDecimal
)

/**
 * Expiring subscription info for dashboard.
 */
data class ExpiringClientSubscriptionResponse(
    val subscriptionId: UUID,
    val organizationId: UUID,
    val organizationNameEn: String,
    val organizationNameAr: String?,
    val planNameEn: String,
    val planNameAr: String?,
    val endDate: LocalDate,
    val daysUntilExpiry: Long,
    val agreedPrice: BigDecimal,
    val currency: String,
    val autoRenew: Boolean,
    val salesRepId: UUID?
)

/**
 * Top client by revenue.
 */
data class TopClientResponse(
    val organizationId: UUID,
    val organizationNameEn: String,
    val organizationNameAr: String?,
    val totalRevenue: BigDecimal,
    val invoiceCount: Long,
    val subscriptionStatus: String,
    val currency: String
)

/**
 * Recent activity for dashboard.
 */
data class RecentActivityResponse(
    val activityType: String,
    val description: String,
    val entityId: UUID,
    val entityType: String,
    val timestamp: java.time.Instant,
    val userId: UUID?,
    val userEmail: String?
)

/**
 * Deal pipeline overview.
 */
data class DealPipelineOverviewResponse(
    val leads: Long,
    val qualified: Long,
    val proposal: Long,
    val negotiation: Long,
    val totalValue: BigDecimal,
    val weightedValue: BigDecimal,
    val currency: String
)

/**
 * Platform health indicators.
 */
data class PlatformHealthResponse(
    val clientHealthScore: BigDecimal,
    val paymentHealthScore: BigDecimal,
    val subscriptionHealthScore: BigDecimal,
    val overallHealthScore: BigDecimal,
    val alerts: List<HealthAlertResponse>
)

/**
 * Health alert.
 */
data class HealthAlertResponse(
    val severity: String,
    val title: String,
    val description: String,
    val count: Long,
    val actionUrl: String?
)

/**
 * Combined dashboard response.
 */
data class PlatformDashboardResponse(
    val summary: PlatformSummaryResponse,
    val revenue: PlatformRevenueResponse,
    val growth: ClientGrowthResponse,
    val dealPipeline: DealPipelineOverviewResponse,
    val expiringSubscriptions: List<ExpiringClientSubscriptionResponse>,
    val topClients: List<TopClientResponse>,
    val recentActivity: List<RecentActivityResponse>
)
