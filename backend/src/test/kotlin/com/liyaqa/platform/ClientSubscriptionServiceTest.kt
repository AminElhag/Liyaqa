package com.liyaqa.platform

import com.liyaqa.platform.application.services.ClientSubscriptionService
import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.platform.domain.model.ClientSubscription
import com.liyaqa.platform.domain.model.ClientSubscriptionStatus
import com.liyaqa.platform.domain.ports.ClientPlanRepository
import com.liyaqa.platform.domain.ports.ClientSubscriptionRepository
import com.liyaqa.shared.domain.Money
import org.junit.jupiter.api.Assertions.assertEquals
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
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ClientSubscriptionServiceTest {

    @Mock
    private lateinit var subscriptionRepository: ClientSubscriptionRepository

    @Mock
    private lateinit var planRepository: ClientPlanRepository

    private lateinit var subscriptionService: ClientSubscriptionService

    private val testOrganizationId = UUID.randomUUID()
    private val testPlanId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        subscriptionService = ClientSubscriptionService(subscriptionRepository, planRepository)
    }

    @Test
    fun `getSubscription should return subscription when found`() {
        // Given
        val testSubscription = createTestSubscription()
        whenever(subscriptionRepository.findById(testSubscription.id)) doReturn Optional.of(testSubscription)

        // When
        val result = subscriptionService.getSubscription(testSubscription.id)

        // Then
        assertEquals(testSubscription.id, result.id)
    }

    @Test
    fun `getSubscription should throw when subscription not found`() {
        // Given
        val subscriptionId = UUID.randomUUID()
        whenever(subscriptionRepository.findById(subscriptionId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            subscriptionService.getSubscription(subscriptionId)
        }
    }

    @Test
    fun `getAllSubscriptions should return paginated subscriptions`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val subscriptions = listOf(createTestSubscription(), createTestSubscription())
        val page = PageImpl(subscriptions, pageable, subscriptions.size.toLong())

        whenever(subscriptionRepository.findAll(pageable)) doReturn page

        // When
        val result = subscriptionService.getAllSubscriptions(pageable)

        // Then
        assertEquals(2, result.content.size)
    }

    @Test
    fun `activateSubscription should change status from TRIAL to ACTIVE`() {
        // Given
        val testSubscription = createTestSubscription(status = ClientSubscriptionStatus.TRIAL)
        whenever(subscriptionRepository.findById(testSubscription.id)) doReturn Optional.of(testSubscription)
        whenever(subscriptionRepository.save(any<ClientSubscription>())) doReturn testSubscription

        // When
        val result = subscriptionService.activateSubscription(testSubscription.id)

        // Then
        assertEquals(ClientSubscriptionStatus.ACTIVE, result.status)
    }

    @Test
    fun `suspendSubscription should change status to SUSPENDED`() {
        // Given
        val testSubscription = createTestSubscription(status = ClientSubscriptionStatus.ACTIVE)
        whenever(subscriptionRepository.findById(testSubscription.id)) doReturn Optional.of(testSubscription)
        whenever(subscriptionRepository.save(any<ClientSubscription>())) doReturn testSubscription

        // When
        val result = subscriptionService.suspendSubscription(testSubscription.id)

        // Then
        assertEquals(ClientSubscriptionStatus.SUSPENDED, result.status)
    }

    @Test
    fun `cancelSubscription should change status to CANCELLED`() {
        // Given
        val testSubscription = createTestSubscription(status = ClientSubscriptionStatus.ACTIVE)
        whenever(subscriptionRepository.findById(testSubscription.id)) doReturn Optional.of(testSubscription)
        whenever(subscriptionRepository.save(any<ClientSubscription>())) doReturn testSubscription

        // When
        val result = subscriptionService.cancelSubscription(testSubscription.id)

        // Then
        assertEquals(ClientSubscriptionStatus.CANCELLED, result.status)
    }

    @Test
    fun `getSubscriptionsByOrganization should return organization subscriptions`() {
        // Given
        val subscriptions = listOf(createTestSubscription())
        whenever(subscriptionRepository.findByOrganizationId(testOrganizationId)) doReturn subscriptions

        // When
        val result = subscriptionService.getSubscriptionsByOrganization(testOrganizationId)

        // Then
        assertEquals(1, result.size)
    }

    private fun createTestSubscription(
        id: UUID = UUID.randomUUID(),
        organizationId: UUID = testOrganizationId,
        clientPlanId: UUID = testPlanId,
        status: ClientSubscriptionStatus = ClientSubscriptionStatus.ACTIVE
    ) = ClientSubscription(
        id = id,
        organizationId = organizationId,
        clientPlanId = clientPlanId,
        agreedPrice = Money.of(BigDecimal("999"), "SAR"),
        billingCycle = BillingCycle.MONTHLY,
        startDate = LocalDate.now(),
        endDate = LocalDate.now().plusMonths(12),
        status = status
    )
}
