package com.liyaqa.platform.analytics.service

import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.platform.analytics.model.GeoDistributionRow
import com.liyaqa.platform.analytics.model.RevenueByPlanRow
import com.liyaqa.platform.analytics.model.TenantGrowthRow
import com.liyaqa.platform.analytics.model.TopTenantRow
import com.liyaqa.platform.analytics.repository.AnalyticsQueryRepository
import com.liyaqa.platform.subscription.dto.RevenueMetricsResponse
import com.liyaqa.platform.subscription.model.InvoiceStatus
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.repository.SubscriptionInvoiceRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.subscription.service.BillingAnalyticsService
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PlatformAnalyticsServiceTest {

    @Mock private lateinit var tenantRepository: TenantRepository
    @Mock private lateinit var tenantSubscriptionRepository: TenantSubscriptionRepository
    @Mock private lateinit var invoiceRepository: SubscriptionInvoiceRepository
    @Mock private lateinit var memberRepository: MemberRepository
    @Mock private lateinit var billingAnalyticsService: BillingAnalyticsService
    @Mock private lateinit var analyticsQueryRepository: AnalyticsQueryRepository

    private lateinit var service: PlatformAnalyticsService

    @BeforeEach
    fun setUp() {
        service = PlatformAnalyticsService(
            tenantRepository, tenantSubscriptionRepository, invoiceRepository,
            memberRepository, billingAnalyticsService, analyticsQueryRepository
        )

        // Default stubs
        whenever(tenantRepository.count()).thenReturn(50)
        whenever(tenantRepository.findByStatus(eq(TenantStatus.ACTIVE), any<Pageable>()))
            .thenReturn(PageImpl(List(30) { mockTenant() }))
        whenever(tenantRepository.findByStatus(eq(TenantStatus.DEACTIVATED), any<Pageable>()))
            .thenReturn(PageImpl(List(5) { mockTenant() }))
        whenever(tenantSubscriptionRepository.findByStatus(SubscriptionStatus.TRIAL))
            .thenReturn(List(10) { mockSubscription() })
        whenever(memberRepository.count()).thenReturn(5000)
        whenever(invoiceRepository.sumTotalByStatusAndIssuedAtBetween(any(), any(), any()))
            .thenReturn(BigDecimal("150000"))
        whenever(billingAnalyticsService.getRevenueMetrics()).thenReturn(
            RevenueMetricsResponse(
                mrr = BigDecimal("50000"),
                arr = BigDecimal("600000"),
                mrrGrowthPercent = BigDecimal("5.50"),
                totalOutstanding = BigDecimal("10000")
            )
        )
        whenever(analyticsQueryRepository.getTenantGrowthMonthly()).thenReturn(emptyList())
        whenever(analyticsQueryRepository.getRevenueByPlan()).thenReturn(emptyList())
        whenever(analyticsQueryRepository.getGeographicDistribution()).thenReturn(emptyList())
        whenever(analyticsQueryRepository.getTopTenantsByRevenue(any())).thenReturn(emptyList())
    }

    @Test
    fun `dashboard returns correct overview counts`() {
        val result = service.getDashboard()
        assertEquals(50, result.overview.totalTenants)
        assertEquals(30, result.overview.activeTenants)
        assertEquals(10, result.overview.trialTenants)
        assertEquals(5, result.overview.churnedTenants)
        assertEquals(5000, result.overview.totalEndUsers)
    }

    @Test
    fun `dashboard returns MRR and ARR from billing service`() {
        val result = service.getDashboard()
        assertEquals(BigDecimal("50000"), result.overview.mrr)
        assertEquals(BigDecimal("600000"), result.overview.arr)
    }

    @Test
    fun `dashboard ARR equals MRR times 12`() {
        val result = service.getDashboard()
        assertEquals(result.overview.mrr.multiply(BigDecimal("12")), result.overview.arr)
    }

    @Test
    fun `dashboard calculates average revenue per tenant correctly`() {
        val result = service.getDashboard()
        // 150000 / 30 active tenants = 5000
        assertEquals(BigDecimal("5000.00"), result.overview.averageRevenuePerTenant)
    }

    @Test
    fun `dashboard returns revenue growth from billing service`() {
        val result = service.getDashboard()
        assertEquals(BigDecimal("5.50"), result.overview.revenueGrowthPercent)
    }

    @Test
    fun `dashboard handles zero active tenants gracefully`() {
        whenever(tenantRepository.findByStatus(eq(TenantStatus.ACTIVE), any<Pageable>()))
            .thenReturn(PageImpl(emptyList()))

        val result = service.getDashboard()
        assertEquals(BigDecimal.ZERO, result.overview.averageRevenuePerTenant)
        assertEquals(0, result.overview.activeTenants)
    }

    // Helpers to create mock return objects (not full entities, just for Page content)
    private fun mockTenant(): com.liyaqa.platform.tenant.model.Tenant {
        return com.liyaqa.platform.tenant.model.Tenant(
            facilityName = "Test Facility",
            contactEmail = "test@example.com"
        )
    }

    private fun mockSubscription(): com.liyaqa.platform.subscription.model.TenantSubscription {
        return com.liyaqa.platform.subscription.model.TenantSubscription(
            tenantId = UUID.randomUUID(),
            planId = UUID.randomUUID(),
            billingCycle = com.liyaqa.platform.subscription.model.SubscriptionBillingCycle.MONTHLY,
            currentPeriodEnd = LocalDate.now().plusMonths(1)
        )
    }
}
