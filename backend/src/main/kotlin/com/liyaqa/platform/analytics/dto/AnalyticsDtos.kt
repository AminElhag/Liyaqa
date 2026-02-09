package com.liyaqa.platform.analytics.dto

import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

// ==================== Dashboard DTOs ====================

data class AnalyticsDashboardResponse(
    val overview: DashboardOverview,
    val tenantGrowth: List<TenantGrowthMonth>,
    val revenueBreakdown: List<RevenueBreakdown>,
    val geographicDistribution: List<GeographicEntry>,
    val topTenants: List<TopTenantEntry>
)

data class DashboardOverview(
    val totalTenants: Long,
    val activeTenants: Long,
    val trialTenants: Long,
    val churnedTenants: Long,
    val totalEndUsers: Long,
    val totalRevenueSAR: BigDecimal,
    val mrr: BigDecimal,
    val arr: BigDecimal,
    val averageRevenuePerTenant: BigDecimal,
    val revenueGrowthPercent: BigDecimal
)

data class TenantGrowthMonth(
    val month: LocalDate,
    val newTenants: Long,
    val churnedTenants: Long,
    val netGrowth: Long
)

data class RevenueBreakdown(
    val planName: String,
    val tenantCount: Long,
    val revenueSAR: BigDecimal
)

data class GeographicEntry(
    val city: String,
    val tenantCount: Long
)

data class TopTenantEntry(
    val tenantId: UUID,
    val name: String,
    val memberCount: Int,
    val revenueSAR: BigDecimal
)

// ==================== Churn DTOs ====================

data class ChurnAnalysisResponse(
    val churnRate30d: BigDecimal,
    val churnRate90d: BigDecimal,
    val churnRateYTD: BigDecimal,
    val atRiskTenants: List<AtRiskTenant>,
    val churnReasons: List<ChurnReasonEntry>,
    val churnByPlan: List<ChurnByPlanEntry>
)

data class AtRiskTenant(
    val tenantId: UUID,
    val name: String,
    val riskScore: Int,
    val riskFactors: List<String>
)

data class ChurnReasonEntry(
    val reason: String,
    val count: Long,
    val percentage: BigDecimal
)

data class ChurnByPlanEntry(
    val planName: String,
    val churnRate: BigDecimal
)

// ==================== Feature Adoption DTOs ====================

data class FeatureAdoptionResponse(
    val features: List<FeatureAdoptionEntry>
)

data class FeatureAdoptionEntry(
    val featureKey: String,
    val name: String,
    val adoptionRate: BigDecimal,
    val activeTenantsUsing: Long,
    val totalAvailable: Long,
    val trend: String
)

// ==================== Comparative DTOs ====================

data class ComparativeResponse(
    val averageMembersPerFacility: Double,
    val medianMembersPerFacility: Double,
    val averageMonthlyRevenue: BigDecimal,
    val averageStaffCount: Double,
    val topFeaturesByUsage: List<FeatureAdoptionEntry>,
    val averageLoginFrequency: Double
)
