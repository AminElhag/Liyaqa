package com.liyaqa.platform.analytics.service

import com.liyaqa.platform.analytics.dto.ComparativeResponse
import com.liyaqa.platform.analytics.dto.FeatureAdoptionEntry
import com.liyaqa.platform.analytics.repository.AnalyticsQueryRepository
import com.liyaqa.platform.subscription.service.BillingAnalyticsService
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode

@Service
@Transactional(readOnly = true)
class ComparativeAnalyticsService(
    private val analyticsQueryRepository: AnalyticsQueryRepository,
    private val billingAnalyticsService: BillingAnalyticsService,
    private val tenantRepository: TenantRepository,
    private val featureAdoptionService: FeatureAdoptionService
) {
    private val logger = LoggerFactory.getLogger(ComparativeAnalyticsService::class.java)

    @Cacheable(
        value = ["platformDashboard"],
        key = "'analytics-comparative'",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getComparativeAnalytics(): ComparativeResponse {
        logger.info("Building comparative analytics")

        val avgMembers = analyticsQueryRepository.getAverageMembersPerTenant()
        val medianMembers = analyticsQueryRepository.getMedianMembersPerTenant()
        val avgStaff = analyticsQueryRepository.getAverageStaffPerTenant()
        val avgLogins = analyticsQueryRepository.getAverageLoginFrequency()

        val activeTenants = tenantRepository.findByStatus(TenantStatus.ACTIVE, Pageable.unpaged()).totalElements
        val mrr = billingAnalyticsService.getRevenueMetrics().mrr
        val avgMonthlyRevenue = if (activeTenants > 0) {
            mrr.divide(BigDecimal(activeTenants), 2, RoundingMode.HALF_UP)
        } else {
            BigDecimal.ZERO
        }

        val topFeatures = featureAdoptionService.getFeatureAdoption().features.take(5)

        return ComparativeResponse(
            averageMembersPerFacility = avgMembers,
            medianMembersPerFacility = medianMembers,
            averageMonthlyRevenue = avgMonthlyRevenue,
            averageStaffCount = avgStaff,
            topFeaturesByUsage = topFeatures,
            averageLoginFrequency = avgLogins
        )
    }
}
