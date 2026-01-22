package com.liyaqa.membership.application.services

import com.liyaqa.membership.application.commands.CreateSubscriptionCommand
import com.liyaqa.membership.domain.model.BillingPeriod
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SubscriptionServiceTest {

    @Mock
    private lateinit var subscriptionRepository: SubscriptionRepository

    @Mock
    private lateinit var memberRepository: MemberRepository

    @Mock
    private lateinit var membershipPlanRepository: MembershipPlanRepository

    @Mock
    private lateinit var notificationService: NotificationService

    private lateinit var subscriptionService: SubscriptionService

    private lateinit var testPlan: MembershipPlan
    private lateinit var testSubscription: Subscription
    private val testMemberId = UUID.randomUUID()
    private val testPlanId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        subscriptionService = SubscriptionService(
            subscriptionRepository,
            memberRepository,
            membershipPlanRepository,
            notificationService
        )

        testPlan = MembershipPlan(
            id = testPlanId,
            name = LocalizedText(en = "Monthly Plan", ar = "الخطة الشهرية"),
            description = LocalizedText(en = "Monthly membership", ar = "العضوية الشهرية"),
            price = Money.of(100.00, "SAR"),
            billingPeriod = BillingPeriod.MONTHLY,
            maxClassesPerPeriod = 30,
            isActive = true
        )

        testSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMemberId,
            planId = testPlanId,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusMonths(1),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 30,
            freezeDaysRemaining = 7
        )

        // Common mocks
        whenever(memberRepository.existsById(testMemberId)) doReturn true
        whenever(membershipPlanRepository.findById(testPlanId)) doReturn Optional.of(testPlan)
    }

    @Test
    fun `createSubscription should create new subscription when valid`() {
        // Given
        val command = CreateSubscriptionCommand(
            memberId = testMemberId,
            planId = testPlanId,
            startDate = LocalDate.now(),
            paidAmount = Money.of(100.00, "SAR")
        )

        whenever(subscriptionRepository.existsActiveByMemberId(testMemberId)) doReturn false
        whenever(subscriptionRepository.save(any<Subscription>())).thenAnswer { it.getArgument(0) }

        // When
        val result = subscriptionService.createSubscription(command)

        // Then
        assertNotNull(result)
        assertEquals(testMemberId, result.memberId)
        assertEquals(testPlanId, result.planId)
        assertEquals(SubscriptionStatus.ACTIVE, result.status)
    }

    @Test
    fun `createSubscription should throw when member not found`() {
        // Given
        val nonExistentMemberId = UUID.randomUUID()
        val command = CreateSubscriptionCommand(
            memberId = nonExistentMemberId,
            planId = testPlanId,
            startDate = LocalDate.now()
        )

        whenever(memberRepository.existsById(nonExistentMemberId)) doReturn false

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            subscriptionService.createSubscription(command)
        }
    }

    @Test
    fun `createSubscription should throw when member already has active subscription`() {
        // Given
        val command = CreateSubscriptionCommand(
            memberId = testMemberId,
            planId = testPlanId,
            startDate = LocalDate.now()
        )

        whenever(subscriptionRepository.existsActiveByMemberId(testMemberId)) doReturn true

        // When/Then
        assertThrows(IllegalStateException::class.java) {
            subscriptionService.createSubscription(command)
        }
    }

    @Test
    fun `getSubscription should return subscription when found`() {
        // Given
        whenever(subscriptionRepository.findById(testSubscription.id)) doReturn Optional.of(testSubscription)

        // When
        val result = subscriptionService.getSubscription(testSubscription.id)

        // Then
        assertEquals(testSubscription, result)
    }

    @Test
    fun `getSubscription should throw when not found`() {
        // Given
        val subscriptionId = UUID.randomUUID()
        whenever(subscriptionRepository.findById(subscriptionId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            subscriptionService.getSubscription(subscriptionId)
        }
    }

    @Test
    fun `getActiveSubscription should return active subscription for member`() {
        // Given
        whenever(subscriptionRepository.findActiveByMemberId(testMemberId)) doReturn Optional.of(testSubscription)

        // When
        val result = subscriptionService.getActiveSubscription(testMemberId)

        // Then
        assertNotNull(result)
        assertEquals(testSubscription, result)
    }

    @Test
    fun `getActiveSubscription should return null when no active subscription`() {
        // Given
        whenever(subscriptionRepository.findActiveByMemberId(testMemberId)) doReturn Optional.empty()

        // When
        val result = subscriptionService.getActiveSubscription(testMemberId)

        // Then
        assertNull(result)
    }

    @Test
    fun `freezeSubscription should change status to FROZEN`() {
        // Given
        whenever(subscriptionRepository.findById(testSubscription.id)) doReturn Optional.of(testSubscription)
        whenever(subscriptionRepository.save(any<Subscription>())).thenAnswer { it.getArgument(0) }

        // When
        val result = subscriptionService.freezeSubscription(testSubscription.id)

        // Then
        assertEquals(SubscriptionStatus.FROZEN, result.status)
    }

    @Test
    fun `cancelSubscription should change status to CANCELLED`() {
        // Given
        whenever(subscriptionRepository.findById(testSubscription.id)) doReturn Optional.of(testSubscription)
        whenever(subscriptionRepository.save(any<Subscription>())).thenAnswer { it.getArgument(0) }

        // When
        val result = subscriptionService.cancelSubscription(testSubscription.id)

        // Then
        assertEquals(SubscriptionStatus.CANCELLED, result.status)
    }

    @Test
    fun `useClass should decrement classes remaining`() {
        // Given
        whenever(subscriptionRepository.findById(testSubscription.id)) doReturn Optional.of(testSubscription)
        whenever(subscriptionRepository.save(any<Subscription>())).thenAnswer { it.getArgument(0) }

        // When
        val result = subscriptionService.useClass(testSubscription.id)

        // Then
        assertEquals(29, result.classesRemaining)
    }

    @Test
    fun `useClass should throw when subscription is not active`() {
        // Given
        val expiredSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMemberId,
            planId = testPlanId,
            startDate = LocalDate.now().minusMonths(2),
            endDate = LocalDate.now().minusMonths(1),
            status = SubscriptionStatus.EXPIRED
        )

        whenever(subscriptionRepository.findById(expiredSubscription.id)) doReturn Optional.of(expiredSubscription)

        // When/Then
        assertThrows(IllegalStateException::class.java) {
            subscriptionService.useClass(expiredSubscription.id)
        }
    }

    @Test
    fun `getExpiringSubscriptions should return subscriptions expiring within days`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val page = PageImpl(listOf(testSubscription), pageable, 1)

        whenever(subscriptionRepository.findExpiringBefore(any(), any())) doReturn page

        // When
        val result = subscriptionService.getExpiringSubscriptions(7, pageable)

        // Then
        assertEquals(1, result.totalElements)
    }
}
