package com.liyaqa.platform.subscription.service

import com.liyaqa.platform.subscription.dto.CancelSubscriptionCommand
import com.liyaqa.platform.subscription.dto.ChangePlanCommand
import com.liyaqa.platform.subscription.dto.CreateSubscriptionCommand
import com.liyaqa.platform.subscription.exception.ActiveSubscriptionExistsException
import com.liyaqa.platform.subscription.exception.InvalidSubscriptionStateException
import com.liyaqa.platform.subscription.exception.TenantSubscriptionNotFoundException
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionBillingCycle
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.model.TenantSubscription
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.argThat
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.context.ApplicationEventPublisher
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TenantSubscriptionServiceTest {

    @Mock private lateinit var tenantSubscriptionRepository: TenantSubscriptionRepository
    @Mock private lateinit var subscriptionPlanRepository: SubscriptionPlanRepository
    @Mock private lateinit var subscriptionInvoiceService: SubscriptionInvoiceService
    @Mock private lateinit var tenantRepository: TenantRepository
    @Mock private lateinit var eventPublisher: ApplicationEventPublisher

    private lateinit var service: TenantSubscriptionService

    private val tenantId = UUID.randomUUID()
    private val planId = UUID.randomUUID()
    private val plan = SubscriptionPlan.create("Pro", PlanTier.PROFESSIONAL, BigDecimal("299"), BigDecimal("2990"))

    @BeforeEach
    fun setUp() {
        service = TenantSubscriptionService(
            tenantSubscriptionRepository,
            subscriptionPlanRepository,
            subscriptionInvoiceService,
            tenantRepository,
            eventPublisher
        )
        whenever(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.of(plan))
        whenever(tenantSubscriptionRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(tenantRepository.findById(tenantId)).thenReturn(Optional.of(
            Tenant.create(facilityName = "Test Gym", contactEmail = "test@test.com")
        ))
    }

    @Test
    fun `creates trial subscription successfully`() {
        whenever(tenantSubscriptionRepository.existsByTenantIdAndStatusIn(any(), any())).thenReturn(false)

        val cmd = CreateSubscriptionCommand(tenantId, planId, SubscriptionBillingCycle.MONTHLY)
        val result = service.subscribe(cmd)

        assertEquals(SubscriptionStatus.TRIAL, result.status)
        assertEquals(tenantId, result.tenantId)
        assertEquals(planId, result.planId)
        assertNotNull(result.trialEndsAt)
        verify(tenantSubscriptionRepository).save(any())
    }

    @Test
    fun `creates active subscription when trial disabled`() {
        whenever(tenantSubscriptionRepository.existsByTenantIdAndStatusIn(any(), any())).thenReturn(false)

        val cmd = CreateSubscriptionCommand(tenantId, planId, SubscriptionBillingCycle.MONTHLY, startTrial = false)
        val result = service.subscribe(cmd)

        assertEquals(SubscriptionStatus.ACTIVE, result.status)
    }

    @Test
    fun `rejects subscription when active one exists`() {
        whenever(tenantSubscriptionRepository.existsByTenantIdAndStatusIn(any(), any())).thenReturn(true)

        val cmd = CreateSubscriptionCommand(tenantId, planId, SubscriptionBillingCycle.MONTHLY)
        assertThrows(ActiveSubscriptionExistsException::class.java) {
            service.subscribe(cmd)
        }
    }

    @Test
    fun `activates trial subscription`() {
        val sub = TenantSubscription.createTrial(tenantId, planId, SubscriptionBillingCycle.MONTHLY)
        sub.activate()

        assertEquals(SubscriptionStatus.ACTIVE, sub.status)
    }

    @Test
    fun `cancels subscription with reason`() {
        val sub = TenantSubscription.createActive(tenantId, planId, SubscriptionBillingCycle.MONTHLY)
        whenever(tenantSubscriptionRepository.findByTenantId(tenantId)).thenReturn(Optional.of(sub))

        val result = service.cancel(tenantId, CancelSubscriptionCommand("Too expensive"))

        assertEquals(SubscriptionStatus.CANCELLED, result.status)
        assertEquals("Too expensive", result.cancellationReason)
        assertNotNull(result.cancelledAt)
    }

    @Test
    fun `expires subscription`() {
        val sub = TenantSubscription.createActive(tenantId, planId, SubscriptionBillingCycle.MONTHLY)
        sub.expire()

        assertEquals(SubscriptionStatus.EXPIRED, sub.status)
    }

    @Test
    fun `renews subscription and extends period`() {
        val sub = TenantSubscription.createActive(tenantId, planId, SubscriptionBillingCycle.MONTHLY)
        val originalEnd = sub.currentPeriodEnd
        whenever(tenantSubscriptionRepository.findByTenantId(tenantId)).thenReturn(Optional.of(sub))

        val result = service.renew(tenantId)

        assertEquals(SubscriptionStatus.ACTIVE, result.status)
        assertEquals(originalEnd, result.currentPeriodStart)
        assertEquals(originalEnd.plusMonths(1), result.currentPeriodEnd)
    }

    @Test
    fun `upgrades plan immediately with prorated invoice`() {
        val currentPlanId = UUID.randomUUID()
        val newPlanId = UUID.randomUUID()
        val currentPlan = SubscriptionPlan.create("Starter", PlanTier.STARTER, BigDecimal("299"), BigDecimal("2990"))
        val newPlan = SubscriptionPlan.create("Pro", PlanTier.PROFESSIONAL, BigDecimal("599"), BigDecimal("5990"))

        val sub = TenantSubscription.createActive(tenantId, currentPlanId, SubscriptionBillingCycle.MONTHLY)
        whenever(tenantSubscriptionRepository.findByTenantId(tenantId)).thenReturn(Optional.of(sub))
        whenever(subscriptionPlanRepository.findById(currentPlanId)).thenReturn(Optional.of(currentPlan))
        whenever(subscriptionPlanRepository.findById(newPlanId)).thenReturn(Optional.of(newPlan))

        val result = service.changePlan(tenantId, ChangePlanCommand(newPlanId))

        assertEquals(newPlanId, result.planId)
        verify(subscriptionInvoiceService).generateProratedInvoice(
            any(), any(), any(), any()
        )
    }

    @Test
    fun `downgrades plan`() {
        val currentPlanId = UUID.randomUUID()
        val newPlanId = UUID.randomUUID()
        val currentPlan = SubscriptionPlan.create("Pro", PlanTier.PROFESSIONAL, BigDecimal("599"), BigDecimal("5990"))
        val newPlan = SubscriptionPlan.create("Starter", PlanTier.STARTER, BigDecimal("299"), BigDecimal("2990"))

        val sub = TenantSubscription.createActive(tenantId, currentPlanId, SubscriptionBillingCycle.MONTHLY)
        whenever(tenantSubscriptionRepository.findByTenantId(tenantId)).thenReturn(Optional.of(sub))
        whenever(subscriptionPlanRepository.findById(currentPlanId)).thenReturn(Optional.of(currentPlan))
        whenever(subscriptionPlanRepository.findById(newPlanId)).thenReturn(Optional.of(newPlan))

        val result = service.changePlan(tenantId, ChangePlanCommand(newPlanId))

        assertEquals(newPlanId, result.planId)
    }

    @Test
    fun `changePlan rejects when not active`() {
        val sub = TenantSubscription.createTrial(tenantId, planId, SubscriptionBillingCycle.MONTHLY)
        whenever(tenantSubscriptionRepository.findByTenantId(tenantId)).thenReturn(Optional.of(sub))

        assertThrows(InvalidSubscriptionStateException::class.java) {
            service.changePlan(tenantId, ChangePlanCommand(UUID.randomUUID()))
        }
    }

    @Test
    fun `getExpiringSubscriptions returns correct results`() {
        val sub = TenantSubscription.createActive(tenantId, planId, SubscriptionBillingCycle.MONTHLY)
        whenever(tenantSubscriptionRepository.findByStatusAndCurrentPeriodEndBefore(
            any(), any()
        )).thenReturn(listOf(sub))

        val result = service.getExpiringSubscriptions(30)

        assertEquals(1, result.size)
        assertEquals(tenantId, result[0].tenantId)
    }

    @Test
    fun `getSubscription throws when not found`() {
        whenever(tenantSubscriptionRepository.findByTenantId(tenantId)).thenReturn(Optional.empty())

        assertThrows(TenantSubscriptionNotFoundException::class.java) {
            service.getSubscription(tenantId)
        }
    }
}
