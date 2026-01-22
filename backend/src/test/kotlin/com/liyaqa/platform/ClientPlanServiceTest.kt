package com.liyaqa.platform

import com.liyaqa.platform.application.services.ClientPlanService
import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.platform.domain.model.ClientPlan
import com.liyaqa.platform.domain.ports.ClientPlanRepository
import com.liyaqa.platform.domain.ports.ClientSubscriptionRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.math.BigDecimal
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ClientPlanServiceTest {

    @Mock
    private lateinit var planRepository: ClientPlanRepository

    @Mock
    private lateinit var subscriptionRepository: ClientSubscriptionRepository

    private lateinit var planService: ClientPlanService

    @BeforeEach
    fun setUp() {
        planService = ClientPlanService(planRepository, subscriptionRepository)
    }

    @Test
    fun `getPlan should return plan when found`() {
        // Given
        val testPlan = createTestPlan()
        whenever(planRepository.findById(testPlan.id)) doReturn Optional.of(testPlan)

        // When
        val result = planService.getPlan(testPlan.id)

        // Then
        assertEquals(testPlan.id, result.id)
        assertEquals(testPlan.name.en, result.name.en)
    }

    @Test
    fun `getPlan should throw when plan not found`() {
        // Given
        val planId = UUID.randomUUID()
        whenever(planRepository.findById(planId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            planService.getPlan(planId)
        }
    }

    @Test
    fun `getAllPlans should return paginated plans`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val plans = listOf(createTestPlan(), createTestPlan())
        val page = PageImpl(plans, pageable, plans.size.toLong())

        whenever(planRepository.findAll(pageable)) doReturn page

        // When
        val result = planService.getAllPlans(pageable)

        // Then
        assertEquals(2, result.content.size)
    }

    @Test
    fun `getActivePlans should return only active plans`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val plans = listOf(createTestPlan(isActive = true))
        val page = PageImpl(plans, pageable, plans.size.toLong())

        whenever(planRepository.findByIsActive(true, pageable)) doReturn page

        // When
        val result = planService.getActivePlans(pageable)

        // Then
        assertEquals(1, result.content.size)
        assertTrue(result.content[0].isActive)
    }

    @Test
    fun `activatePlan should set isActive to true`() {
        // Given
        val testPlan = createTestPlan(isActive = false)
        whenever(planRepository.findById(testPlan.id)) doReturn Optional.of(testPlan)
        whenever(planRepository.save(any<ClientPlan>())) doReturn testPlan

        // When
        val result = planService.activatePlan(testPlan.id)

        // Then
        assertTrue(result.isActive)
    }

    @Test
    fun `deactivatePlan should set isActive to false`() {
        // Given
        val testPlan = createTestPlan(isActive = true)
        whenever(planRepository.findById(testPlan.id)) doReturn Optional.of(testPlan)
        whenever(planRepository.save(any<ClientPlan>())) doReturn testPlan

        // When
        val result = planService.deactivatePlan(testPlan.id)

        // Then
        assertFalse(result.isActive)
    }

    @Test
    fun `deletePlan should delete plan when no subscriptions exist`() {
        // Given
        val testPlan = createTestPlan()
        val emptyPage = PageImpl<com.liyaqa.platform.domain.model.ClientSubscription>(emptyList())
        whenever(planRepository.existsById(testPlan.id)) doReturn true
        whenever(subscriptionRepository.findByClientPlanId(any(), any())) doReturn emptyPage

        // When
        planService.deletePlan(testPlan.id)

        // Then
        verify(planRepository).deleteById(testPlan.id)
    }

    @Test
    fun `deletePlan should throw when plan not found`() {
        // Given
        val planId = UUID.randomUUID()
        whenever(planRepository.existsById(planId)) doReturn false

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            planService.deletePlan(planId)
        }

        verify(planRepository, never()).deleteById(any())
    }

    private fun createTestPlan(
        id: UUID = UUID.randomUUID(),
        name: LocalizedText = LocalizedText(en = "Test Plan", ar = "خطة اختبار"),
        isActive: Boolean = true
    ) = ClientPlan(
        id = id,
        name = name,
        description = LocalizedText(en = "Test Description", ar = "وصف اختبار"),
        monthlyPrice = Money.of(BigDecimal("999"), "SAR"),
        annualPrice = Money.of(BigDecimal("9990"), "SAR"),
        billingCycle = BillingCycle.MONTHLY,
        maxClubs = 1,
        maxLocationsPerClub = 1,
        maxMembers = 100,
        maxStaffUsers = 5,
        isActive = isActive
    )
}
