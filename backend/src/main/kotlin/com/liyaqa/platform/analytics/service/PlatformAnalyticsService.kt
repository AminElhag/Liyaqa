package com.liyaqa.platform.analytics.service

import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.platform.analytics.dto.AnalyticsDashboardResponse
import com.liyaqa.platform.analytics.dto.DashboardOverview
import com.liyaqa.platform.analytics.dto.GeographicEntry
import com.liyaqa.platform.analytics.dto.RevenueBreakdown
import com.liyaqa.platform.analytics.dto.TenantGrowthMonth
import com.liyaqa.platform.analytics.dto.TopTenantEntry
import com.liyaqa.platform.analytics.repository.AnalyticsQueryRepository
import com.liyaqa.platform.subscription.model.InvoiceStatus
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.repository.SubscriptionInvoiceRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
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
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class PlatformAnalyticsService(
    private val tenantRepository: TenantRepository,
    private val tenantSubscriptionRepository: TenantSubscriptionRepository,
    private val invoiceRepository: SubscriptionInvoiceRepository,
    private val memberRepository: MemberRepository,
    private val billingAnalyticsService: BillingAnalyticsService,
    private val analyticsQueryRepository: AnalyticsQueryRepository
) {
    private val logger = LoggerFactory.getLogger(PlatformAnalyticsService::class.java)

    @Cacheable(
        value = ["platformDashboard"],
        key = "'analytics-dashboard'",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getDashboard(): AnalyticsDashboardResponse {
        logger.info("Building analytics dashboard")

        val totalTenants = tenantRepository.count()
        val activeTenants = tenantRepository.findByStatus(TenantStatus.ACTIVE, Pageable.unpaged()).totalElements
        val trialTenants = tenantSubscriptionRepository.findByStatus(SubscriptionStatus.TRIAL).size.toLong()
        val churnedTenants = tenantRepository.findByStatus(TenantStatus.DEACTIVATED, Pageable.unpaged()).totalElements
        val totalEndUsers = memberRepository.count()

        val yearStart = LocalDate.now().withDayOfYear(1)
        val totalRevenueSAR = invoiceRepository.sumTotalByStatusAndIssuedAtBetween(
            InvoiceStatus.PAID, yearStart, LocalDate.now()
        )

        val revenueMetrics = billingAnalyticsService.getRevenueMetrics()
        val mrr = revenueMetrics.mrr
        val arr = revenueMetrics.arr

        val averageRevenuePerTenant = if (activeTenants > 0) {
            totalRevenueSAR.divide(BigDecimal(activeTenants), 2, RoundingMode.HALF_UP)
        } else {
            BigDecimal.ZERO
        }

        val overview = DashboardOverview(
            totalTenants = totalTenants,
            activeTenants = activeTenants,
            trialTenants = trialTenants,
            churnedTenants = churnedTenants,
            totalEndUsers = totalEndUsers,
            totalRevenueSAR = totalRevenueSAR,
            mrr = mrr,
            arr = arr,
            averageRevenuePerTenant = averageRevenuePerTenant,
            revenueGrowthPercent = revenueMetrics.mrrGrowthPercent
        )

        val tenantGrowth = analyticsQueryRepository.getTenantGrowthMonthly().map {
            TenantGrowthMonth(it.month, it.newTenants, it.churnedTenants, it.netGrowth)
        }

        val revenueBreakdown = analyticsQueryRepository.getRevenueByPlan().map {
            RevenueBreakdown(it.planName, it.tenantCount, it.revenueSAR)
        }

        val geographicDistribution = analyticsQueryRepository.getGeographicDistribution().map {
            GeographicEntry(it.city, it.tenantCount)
        }

        val topTenants = analyticsQueryRepository.getTopTenantsByRevenue(10).map {
            TopTenantEntry(it.tenantId, it.name, it.memberCount, it.revenueSAR)
        }

        return AnalyticsDashboardResponse(
            overview = overview,
            tenantGrowth = tenantGrowth,
            revenueBreakdown = revenueBreakdown,
            geographicDistribution = geographicDistribution,
            topTenants = topTenants
        )
    }
}
