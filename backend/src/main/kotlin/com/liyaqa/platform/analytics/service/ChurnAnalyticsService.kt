package com.liyaqa.platform.analytics.service

import com.liyaqa.platform.analytics.dto.AtRiskTenant
import com.liyaqa.platform.analytics.dto.ChurnAnalysisResponse
import com.liyaqa.platform.analytics.dto.ChurnByPlanEntry
import com.liyaqa.platform.analytics.dto.ChurnReasonEntry
import com.liyaqa.platform.analytics.repository.AnalyticsQueryRepository
import com.liyaqa.platform.domain.ports.ClientHealthScoreRepository
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

@Service
@Transactional(readOnly = true)
class ChurnAnalyticsService(
    private val analyticsQueryRepository: AnalyticsQueryRepository,
    private val clientHealthScoreRepository: ClientHealthScoreRepository,
    private val tenantRepository: TenantRepository
) {
    private val logger = LoggerFactory.getLogger(ChurnAnalyticsService::class.java)

    @Cacheable(
        value = ["platformDashboard"],
        key = "'analytics-churn'",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getChurnAnalysis(): ChurnAnalysisResponse {
        logger.info("Building churn analysis")

        val now = Instant.now()
        val today = LocalDate.now()

        val churnRate30d = analyticsQueryRepository.getChurnRateForPeriod(
            today.minusDays(30).atStartOfDay().toInstant(ZoneOffset.UTC), now
        )
        val churnRate90d = analyticsQueryRepository.getChurnRateForPeriod(
            today.minusDays(90).atStartOfDay().toInstant(ZoneOffset.UTC), now
        )
        val churnRateYTD = analyticsQueryRepository.getChurnRateForPeriod(
            today.withDayOfYear(1).atStartOfDay().toInstant(ZoneOffset.UTC), now
        )

        val atRiskPage = clientHealthScoreRepository.findAtRisk(Pageable.ofSize(20))
        val atRiskTenants = atRiskPage.content.mapNotNull { score ->
            val tenant = tenantRepository.findById(score.organizationId).orElse(null) ?: return@mapNotNull null
            val riskFactors = buildList {
                if (score.usageScore < 40) add("Low usage")
                if (score.engagementScore < 40) add("Low engagement")
                if (score.paymentScore < 40) add("Payment issues")
                if (score.supportScore < 40) add("Support concerns")
            }
            AtRiskTenant(
                tenantId = score.organizationId,
                name = tenant.facilityName,
                riskScore = score.overallScore,
                riskFactors = riskFactors
            )
        }

        val churnReasons = analyticsQueryRepository.getChurnReasonBreakdown().map {
            ChurnReasonEntry(it.reason, it.count, it.percentage)
        }

        val churnByPlan = analyticsQueryRepository.getChurnByPlan().map {
            ChurnByPlanEntry(it.planName, it.churnRate)
        }

        return ChurnAnalysisResponse(
            churnRate30d = churnRate30d.rate,
            churnRate90d = churnRate90d.rate,
            churnRateYTD = churnRateYTD.rate,
            atRiskTenants = atRiskTenants,
            churnReasons = churnReasons,
            churnByPlan = churnByPlan
        )
    }
}
