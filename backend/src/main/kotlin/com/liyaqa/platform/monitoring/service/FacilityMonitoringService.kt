package com.liyaqa.platform.monitoring.service

import com.liyaqa.platform.application.services.HealthScoreService
import com.liyaqa.platform.domain.model.HealthTrend
import com.liyaqa.platform.domain.model.RiskLevel
import com.liyaqa.platform.monitoring.dto.AtRiskFacilityResponse
import com.liyaqa.platform.monitoring.dto.FacilityActivityResponse
import com.liyaqa.platform.monitoring.dto.FacilityHealthResponse
import com.liyaqa.platform.monitoring.repository.FacilityMetricsRepository
import com.liyaqa.platform.tenant.repository.TenantRepository
import com.liyaqa.shared.infrastructure.audit.AuditLogRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.util.UUID

@Service
@Transactional(readOnly = true)
class FacilityMonitoringService(
    private val tenantRepository: TenantRepository,
    private val facilityMetricsRepository: FacilityMetricsRepository,
    private val auditLogRepository: AuditLogRepository,
    private val healthScoreService: HealthScoreService
) {

    fun getAllFacilitiesHealth(pageable: Pageable): Page<FacilityHealthResponse> {
        val tenantsPage = tenantRepository.findAll(pageable)

        if (tenantsPage.isEmpty) {
            return Page.empty(pageable)
        }

        val memberCounts = facilityMetricsRepository.getActiveMemberCountsByTenant()
        val staffCounts = facilityMetricsRepository.getStaffCountsByTenant()
        val openTickets = facilityMetricsRepository.getOpenTicketCountsByOrganization()
        val overdueInvoices = facilityMetricsRepository.getOverdueInvoiceCountsByOrganization()
        val lastLogins = facilityMetricsRepository.getLastLoginByTenant()
        val lastActivities = facilityMetricsRepository.getLastActivityByTenant()
        val healthScores = facilityMetricsRepository.getLatestHealthScoresByOrganization()

        val responses = tenantsPage.content.map { tenant ->
            val orgId = tenant.organizationId
            val healthScore = orgId?.let { healthScores[it] }

            FacilityHealthResponse(
                tenantId = tenant.id,
                facilityName = tenant.facilityName,
                status = tenant.status,
                activeMembersCount = memberCounts[tenant.id] ?: 0,
                staffCount = staffCounts[tenant.id] ?: 0,
                lastAdminLoginAt = lastLogins[tenant.id],
                lastMemberActivityAt = lastActivities[tenant.id],
                storageUsedMb = null,
                storageQuotaMb = null,
                apiCallsToday = null,
                apiCallsThisMonth = null,
                openTickets = orgId?.let { openTickets[it] } ?: 0,
                overdueInvoices = orgId?.let { overdueInvoices[it] } ?: 0,
                healthScore = healthScore?.overallScore ?: 0,
                riskLevel = healthScore?.riskLevel ?: RiskLevel.LOW,
                healthTrend = healthScore?.trend ?: HealthTrend.STABLE
            )
        }

        return PageImpl(responses, pageable, tenantsPage.totalElements)
    }

    fun getFacilityActivity(tenantId: UUID, pageable: Pageable): Page<FacilityActivityResponse> {
        val tenant = tenantRepository.findById(tenantId)
            .orElseThrow { NoSuchElementException("Tenant not found: $tenantId") }

        val orgId = tenant.organizationId
            ?: return Page.empty(pageable)

        return auditLogRepository.findByOrganizationId(orgId, pageable).map { log ->
            FacilityActivityResponse(
                id = log.id,
                action = log.action.name,
                entityType = log.entityType,
                description = log.description,
                userId = log.userId,
                userEmail = log.userEmail,
                createdAt = log.createdAt
            )
        }
    }

    fun getAtRiskFacilities(pageable: Pageable): Page<AtRiskFacilityResponse> {
        val atRiskScores = healthScoreService.getAtRiskClients(Pageable.unpaged()).content
        val decliningScores = healthScoreService.getDecliningClients(Pageable.unpaged()).content

        val allOrgIds = (atRiskScores.map { it.organizationId } + decliningScores.map { it.organizationId }).toSet()

        if (allOrgIds.isEmpty()) {
            return Page.empty(pageable)
        }

        val openTickets = facilityMetricsRepository.getOpenTicketCountsByOrganization()
        val overdueInvoices = facilityMetricsRepository.getOverdueInvoiceCountsByOrganization()
        val lastLogins = facilityMetricsRepository.getLastLoginByTenant()

        val scoresByOrg = (atRiskScores + decliningScores)
            .associateBy { it.organizationId }

        val allTenants = tenantRepository.findAll(Pageable.unpaged()).content
        val tenantsByOrg = allTenants.filter { it.organizationId in allOrgIds }
            .associateBy { it.organizationId }

        val responses = allOrgIds.mapNotNull { orgId ->
            val score = scoresByOrg[orgId] ?: return@mapNotNull null
            val tenant = tenantsByOrg[orgId] ?: return@mapNotNull null

            val daysSinceLogin = lastLogins[tenant.id]?.let {
                Duration.between(it, Instant.now()).toDays()
            }

            val weakestArea = score.getWeakestArea()

            val recommendations = buildRecommendations(score.usageScore, score.engagementScore, score.paymentScore, score.supportScore, daysSinceLogin)

            AtRiskFacilityResponse(
                tenantId = tenant.id,
                facilityName = tenant.facilityName,
                status = tenant.status,
                healthScore = score.overallScore,
                riskLevel = score.riskLevel,
                trend = score.trend,
                scoreChange = score.scoreChange,
                weakestArea = weakestArea.first,
                overdueInvoices = overdueInvoices[orgId] ?: 0,
                openTickets = openTickets[orgId] ?: 0,
                daysSinceLastLogin = daysSinceLogin,
                recommendations = recommendations
            )
        }.sortedBy { it.healthScore }

        val start = (pageable.pageNumber * pageable.pageSize).coerceAtMost(responses.size)
        val end = (start + pageable.pageSize).coerceAtMost(responses.size)
        val pageContent = responses.subList(start, end)

        return PageImpl(pageContent, pageable, responses.size.toLong())
    }

    private fun buildRecommendations(
        usageScore: Int,
        engagementScore: Int,
        paymentScore: Int,
        supportScore: Int,
        daysSinceLogin: Long?
    ): List<String> {
        val recommendations = mutableListOf<String>()

        if (usageScore < 50) {
            recommendations.add("Low admin activity detected. Consider scheduling a check-in call.")
        }
        if (engagementScore < 50) {
            recommendations.add("Member engagement is below average. Review class schedules and promotions.")
        }
        if (paymentScore < 50) {
            recommendations.add("Payment issues detected. Review dunning status and reach out proactively.")
        }
        if (supportScore < 50) {
            recommendations.add("High support ticket volume. Consider dedicated CSM assignment.")
        }
        if (daysSinceLogin != null && daysSinceLogin > 14) {
            recommendations.add("No admin login in ${daysSinceLogin} days. Reach out to verify engagement.")
        }

        return recommendations
    }
}
