package com.liyaqa.platform.monitoring.dto

import com.liyaqa.platform.domain.model.HealthTrend
import com.liyaqa.platform.domain.model.RiskLevel
import com.liyaqa.platform.tenant.model.TenantStatus
import java.time.Instant
import java.util.UUID

data class FacilityHealthResponse(
    val tenantId: UUID,
    val facilityName: String,
    val status: TenantStatus,
    val activeMembersCount: Long,
    val staffCount: Long,
    val lastAdminLoginAt: Instant?,
    val lastMemberActivityAt: Instant?,
    val storageUsedMb: Double?,
    val storageQuotaMb: Double?,
    val apiCallsToday: Long?,
    val apiCallsThisMonth: Long?,
    val openTickets: Long,
    val overdueInvoices: Long,
    val healthScore: Int,
    val riskLevel: RiskLevel,
    val healthTrend: HealthTrend
)

data class FacilityActivityResponse(
    val id: UUID,
    val action: String,
    val entityType: String,
    val description: String?,
    val userId: UUID?,
    val userEmail: String?,
    val createdAt: Instant
)

data class AtRiskFacilityResponse(
    val tenantId: UUID,
    val facilityName: String,
    val status: TenantStatus,
    val healthScore: Int,
    val riskLevel: RiskLevel,
    val trend: HealthTrend,
    val scoreChange: Int?,
    val weakestArea: String,
    val overdueInvoices: Long,
    val openTickets: Long,
    val daysSinceLastLogin: Long?,
    val recommendations: List<String>
)
