package com.liyaqa.platform.communication.service

import com.liyaqa.platform.communication.model.CommunicationChannel
import com.liyaqa.platform.communication.model.NotificationDispatchEvent
import com.liyaqa.platform.communication.model.NotificationLog
import com.liyaqa.platform.communication.repository.NotificationLogRepository
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionBillingCycle
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.model.TenantSubscription
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PlatformNotificationServiceTest {

    @Mock
    private lateinit var notificationLogRepository: NotificationLogRepository

    @Mock
    private lateinit var tenantRepository: TenantRepository

    @Mock
    private lateinit var tenantSubscriptionRepository: TenantSubscriptionRepository

    @Mock
    private lateinit var subscriptionPlanRepository: SubscriptionPlanRepository

    @Mock
    private lateinit var eventPublisher: ApplicationEventPublisher

    private lateinit var service: PlatformNotificationService

    private val tenantId = UUID.randomUUID()
    private lateinit var testTenant: Tenant

    @BeforeEach
    fun setUp() {
        service = PlatformNotificationService(
            notificationLogRepository,
            tenantRepository,
            tenantSubscriptionRepository,
            subscriptionPlanRepository,
            eventPublisher
        )
        testTenant = Tenant.create(facilityName = "Test Gym", contactEmail = "test@gym.com")
    }

    @Test
    fun `sendToTenant should create log and dispatch event`() {
        whenever(tenantRepository.findById(tenantId)) doReturn Optional.of(testTenant)
        whenever(notificationLogRepository.save(any<NotificationLog>())) doReturn NotificationLog(
            tenantId = tenantId,
            channel = CommunicationChannel.EMAIL,
            templateCode = "WELCOME"
        )

        service.sendToTenant(tenantId, "WELCOME", mapOf("name" to "Test"), CommunicationChannel.EMAIL)

        verify(notificationLogRepository).save(any<NotificationLog>())
        verify(eventPublisher).publishEvent(any<NotificationDispatchEvent>())
    }

    @Test
    fun `broadcastToAll should iterate all active tenants`() {
        val tenant1 = Tenant.create(facilityName = "Gym 1", contactEmail = "gym1@test.com")
        val tenant2 = Tenant.create(facilityName = "Gym 2", contactEmail = "gym2@test.com")

        whenever(tenantRepository.findByStatus(any<TenantStatus>(), any<Pageable>())) doReturn
            PageImpl(listOf(tenant1, tenant2))
        whenever(tenantRepository.findById(any<UUID>())) doReturn Optional.of(tenant1)
        whenever(notificationLogRepository.save(any<NotificationLog>())) doReturn NotificationLog(
            tenantId = UUID.randomUUID(),
            channel = CommunicationChannel.EMAIL,
            templateCode = "WELCOME"
        )

        service.broadcastToAll("WELCOME", mapOf("msg" to "Hello"), CommunicationChannel.EMAIL)

        verify(notificationLogRepository, times(2)).save(any<NotificationLog>())
        verify(eventPublisher, times(2)).publishEvent(any<NotificationDispatchEvent>())
    }

    @Test
    fun `sendToSegment should filter by plan tier`() {
        val planId = UUID.randomUUID()
        val plan = SubscriptionPlan.create(
            name = "Pro",
            tier = PlanTier.PROFESSIONAL,
            monthlyPriceAmount = BigDecimal("199"),
            annualPriceAmount = BigDecimal("1999")
        )
        val sub = TenantSubscription.createActive(
            tenantId = tenantId,
            planId = planId,
            billingCycle = SubscriptionBillingCycle.MONTHLY
        )

        whenever(subscriptionPlanRepository.findByTier(PlanTier.PROFESSIONAL)) doReturn Optional.of(plan)
        whenever(tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)) doReturn listOf(sub)
        // planId won't match plan.id since they are different UUIDs,
        // so no notifications should be sent
        service.sendToSegment(PlanTier.PROFESSIONAL, "UPDATE", emptyMap(), CommunicationChannel.EMAIL)

        // No tenant matches since planId != plan.id
        verify(notificationLogRepository, never()).save(any<NotificationLog>())
    }

    @Test
    fun `sendToTenant should handle missing tenant gracefully`() {
        whenever(tenantRepository.findById(tenantId)) doReturn Optional.empty()

        service.sendToTenant(tenantId, "WELCOME", emptyMap(), CommunicationChannel.EMAIL)

        verify(notificationLogRepository, never()).save(any<NotificationLog>())
        verify(eventPublisher, never()).publishEvent(any<NotificationDispatchEvent>())
    }
}
