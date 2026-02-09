package com.liyaqa.platform.analytics.service

import com.liyaqa.platform.analytics.model.ChurnByPlanRow
import com.liyaqa.platform.analytics.model.ChurnRateData
import com.liyaqa.platform.analytics.model.ChurnReasonRow
import com.liyaqa.platform.analytics.repository.AnalyticsQueryRepository
import com.liyaqa.platform.domain.model.ClientHealthScore
import com.liyaqa.platform.domain.model.RiskLevel
import com.liyaqa.platform.domain.ports.ClientHealthScoreRepository
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import java.math.BigDecimal
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChurnAnalyticsServiceTest {

    @Mock private lateinit var analyticsQueryRepository: AnalyticsQueryRepository
    @Mock private lateinit var clientHealthScoreRepository: ClientHealthScoreRepository
    @Mock private lateinit var tenantRepository: TenantRepository

    private lateinit var service: ChurnAnalyticsService

    @BeforeEach
    fun setUp() {
        service = ChurnAnalyticsService(
            analyticsQueryRepository, clientHealthScoreRepository, tenantRepository
        )

        whenever(clientHealthScoreRepository.findAtRisk(any<Pageable>()))
            .thenReturn(PageImpl(emptyList()))
        whenever(analyticsQueryRepository.getChurnReasonBreakdown()).thenReturn(emptyList())
        whenever(analyticsQueryRepository.getChurnByPlan()).thenReturn(emptyList())
    }

    @Test
    fun `churn rate calculated correctly`() {
        // 5 churned out of (100 active at start + 10 new) = 5/110 * 100 = 4.55%
        whenever(analyticsQueryRepository.getChurnRateForPeriod(any(), any()))
            .thenReturn(ChurnRateData(totalStart = 100, churned = 5, rate = BigDecimal("4.55")))

        val result = service.getChurnAnalysis()
        assertEquals(BigDecimal("4.55"), result.churnRate30d)
    }

    @Test
    fun `churn rate with zero churned returns zero`() {
        whenever(analyticsQueryRepository.getChurnRateForPeriod(any(), any()))
            .thenReturn(ChurnRateData(totalStart = 100, churned = 0, rate = BigDecimal.ZERO))

        val result = service.getChurnAnalysis()
        assertEquals(BigDecimal.ZERO, result.churnRate30d)
    }

    @Test
    fun `churn rate with zero starting tenants returns zero`() {
        whenever(analyticsQueryRepository.getChurnRateForPeriod(any(), any()))
            .thenReturn(ChurnRateData(totalStart = 0, churned = 0, rate = BigDecimal.ZERO))

        val result = service.getChurnAnalysis()
        assertEquals(BigDecimal.ZERO, result.churnRate30d)
    }

    @Test
    fun `at-risk tenants maps health scores correctly`() {
        val orgId = UUID.randomUUID()
        val healthScore = ClientHealthScore(
            organizationId = orgId,
            overallScore = 35,
            usageScore = 20,
            engagementScore = 30,
            paymentScore = 50,
            supportScore = 60,
            riskLevel = RiskLevel.CRITICAL
        )

        val tenant = Tenant(
            id = orgId,
            facilityName = "At Risk Gym",
            contactEmail = "risk@test.com"
        )

        whenever(clientHealthScoreRepository.findAtRisk(any<Pageable>()))
            .thenReturn(PageImpl(listOf(healthScore)))
        whenever(tenantRepository.findById(orgId)).thenReturn(Optional.of(tenant))
        whenever(analyticsQueryRepository.getChurnRateForPeriod(any(), any()))
            .thenReturn(ChurnRateData(totalStart = 100, churned = 0, rate = BigDecimal.ZERO))

        val result = service.getChurnAnalysis()
        assertEquals(1, result.atRiskTenants.size)
        assertEquals("At Risk Gym", result.atRiskTenants[0].name)
        assertEquals(35, result.atRiskTenants[0].riskScore)
        assertTrue(result.atRiskTenants[0].riskFactors.contains("Low usage"))
        assertTrue(result.atRiskTenants[0].riskFactors.contains("Low engagement"))
    }

    @Test
    fun `churn reasons aggregated correctly`() {
        whenever(analyticsQueryRepository.getChurnReasonBreakdown()).thenReturn(
            listOf(
                ChurnReasonRow("NON_PAYMENT", 5, BigDecimal("50.00")),
                ChurnReasonRow("CLIENT_REQUEST", 3, BigDecimal("30.00")),
                ChurnReasonRow("OTHER", 2, BigDecimal("20.00"))
            )
        )
        whenever(analyticsQueryRepository.getChurnRateForPeriod(any(), any()))
            .thenReturn(ChurnRateData(totalStart = 100, churned = 10, rate = BigDecimal("10.00")))

        val result = service.getChurnAnalysis()
        assertEquals(3, result.churnReasons.size)
        assertEquals("NON_PAYMENT", result.churnReasons[0].reason)
        assertEquals(5, result.churnReasons[0].count)
        assertEquals(BigDecimal("50.00"), result.churnReasons[0].percentage)
    }
}
