package com.liyaqa.platform.subscription.service

import com.liyaqa.platform.subscription.model.Invoice
import com.liyaqa.platform.subscription.model.InvoiceStatus
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionBillingCycle
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.model.TenantSubscription
import com.liyaqa.platform.subscription.repository.SubscriptionInvoiceRepository
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.math.BigDecimal
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BillingAnalyticsServiceTest {

    @Mock private lateinit var tenantSubscriptionRepository: TenantSubscriptionRepository
    @Mock private lateinit var invoiceRepository: SubscriptionInvoiceRepository
    @Mock private lateinit var subscriptionPlanRepository: SubscriptionPlanRepository

    private lateinit var service: BillingAnalyticsService

    private val plan = SubscriptionPlan.create("Pro", PlanTier.PROFESSIONAL, BigDecimal("299"), BigDecimal("2990"))
    private val planId = plan.id

    @BeforeEach
    fun setUp() {
        service = BillingAnalyticsService(
            tenantSubscriptionRepository,
            invoiceRepository,
            subscriptionPlanRepository
        )
        whenever(subscriptionPlanRepository.findAll()).thenReturn(listOf(plan))
    }

    @Test
    fun `calculates MRR from active monthly subscriptions`() {
        val sub = TenantSubscription.createActive(UUID.randomUUID(), planId, SubscriptionBillingCycle.MONTHLY)
        whenever(tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)).thenReturn(listOf(sub))
        whenever(invoiceRepository.sumTotalByStatusAndIssuedAtBetween(any(), any(), any())).thenReturn(BigDecimal.ZERO)
        whenever(invoiceRepository.findByStatusIn(any())).thenReturn(emptyList())

        val metrics = service.getRevenueMetrics()

        // Monthly sub: 299 SAR/month
        assertEquals(0, BigDecimal("299").compareTo(metrics.mrr))
    }

    @Test
    fun `calculates MRR from active annual subscriptions as annual divided by 12`() {
        val sub = TenantSubscription.createActive(UUID.randomUUID(), planId, SubscriptionBillingCycle.ANNUAL)
        whenever(tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)).thenReturn(listOf(sub))
        whenever(invoiceRepository.sumTotalByStatusAndIssuedAtBetween(any(), any(), any())).thenReturn(BigDecimal.ZERO)
        whenever(invoiceRepository.findByStatusIn(any())).thenReturn(emptyList())

        val metrics = service.getRevenueMetrics()

        // Annual sub: 2990 / 12 = 249.17
        assertEquals(0, BigDecimal("249.17").compareTo(metrics.mrr))
    }

    @Test
    fun `calculates ARR as MRR times 12`() {
        val sub = TenantSubscription.createActive(UUID.randomUUID(), planId, SubscriptionBillingCycle.MONTHLY)
        whenever(tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)).thenReturn(listOf(sub))
        whenever(invoiceRepository.sumTotalByStatusAndIssuedAtBetween(any(), any(), any())).thenReturn(BigDecimal.ZERO)
        whenever(invoiceRepository.findByStatusIn(any())).thenReturn(emptyList())

        val metrics = service.getRevenueMetrics()

        // ARR = 299 * 12 = 3588
        assertEquals(0, BigDecimal("3588").compareTo(metrics.arr))
    }

    @Test
    fun `calculates revenue by plan`() {
        val sub1 = TenantSubscription.createActive(UUID.randomUUID(), planId, SubscriptionBillingCycle.MONTHLY)
        val sub2 = TenantSubscription.createActive(UUID.randomUUID(), planId, SubscriptionBillingCycle.MONTHLY)
        whenever(tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)).thenReturn(listOf(sub1, sub2))

        val result = service.getRevenueByPlan()

        assertEquals(1, result.size)
        assertEquals(2, result[0].activeSubscriptions)
        // 299 * 2 = 598
        assertEquals(0, BigDecimal("598").compareTo(result[0].monthlyRevenue))
    }

    @Test
    fun `calculates outstanding amount`() {
        val inv1 = Invoice.create("LYQ-2026-00001", UUID.randomUUID(), null, BigDecimal("299"))
        val inv2 = Invoice.create("LYQ-2026-00002", UUID.randomUUID(), null, BigDecimal("599"))
        whenever(invoiceRepository.findByStatusIn(any())).thenReturn(listOf(inv1, inv2))

        val outstanding = service.getOutstandingAmount()

        // inv1 total: 299 + 44.85 = 343.85, inv2 total: 599 + 89.85 = 688.85
        // Total: 343.85 + 688.85 = 1032.70
        assertEquals(0, BigDecimal("1032.70").compareTo(outstanding))
    }
}
