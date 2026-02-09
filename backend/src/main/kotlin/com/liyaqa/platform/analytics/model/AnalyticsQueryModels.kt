package com.liyaqa.platform.analytics.model

import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

data class TenantGrowthRow(
    val month: LocalDate,
    val newTenants: Long,
    val churnedTenants: Long,
    val netGrowth: Long
)

data class RevenueByPlanRow(
    val planName: String,
    val tenantCount: Long,
    val revenueSAR: BigDecimal
)

data class GeoDistributionRow(
    val city: String,
    val tenantCount: Long
)

data class TopTenantRow(
    val tenantId: UUID,
    val name: String,
    val memberCount: Int,
    val revenueSAR: BigDecimal
)

data class ChurnRateData(
    val totalStart: Long,
    val churned: Long,
    val rate: BigDecimal
)

data class ChurnByPlanRow(
    val planName: String,
    val churnRate: BigDecimal
)

data class ChurnReasonRow(
    val reason: String,
    val count: Long,
    val percentage: BigDecimal
)

data class FeatureAdoptionRow(
    val featureKey: String,
    val name: String,
    val totalAvailable: Long,
    val activeTenantsUsing: Long,
    val adoptionRate: BigDecimal
)
