package com.liyaqa.platform.subscription.service

import com.liyaqa.platform.subscription.dto.CreateSubscriptionPlanCommand
import com.liyaqa.platform.subscription.dto.UpdateSubscriptionPlanCommand
import com.liyaqa.platform.subscription.exception.DuplicatePlanTierException
import com.liyaqa.platform.subscription.exception.SubscriptionPlanNotFoundException
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.math.BigDecimal
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SubscriptionPlanServiceTest {

    @Mock
    private lateinit var subscriptionPlanRepository: SubscriptionPlanRepository

    private lateinit var service: SubscriptionPlanService

    @BeforeEach
    fun setUp() {
        service = SubscriptionPlanService(subscriptionPlanRepository)
    }

    @Test
    fun `creates plan successfully`() {
        val cmd = createPlanCommand()
        whenever(subscriptionPlanRepository.existsByTier(PlanTier.STARTER)).thenReturn(false)
        whenever(subscriptionPlanRepository.save(any())).thenAnswer { it.arguments[0] }

        val plan = service.createPlan(cmd)

        assertEquals("Starter Plan", plan.name)
        assertEquals(PlanTier.STARTER, plan.tier)
        verify(subscriptionPlanRepository).save(any())
    }

    @Test
    fun `rejects duplicate tier`() {
        val cmd = createPlanCommand()
        whenever(subscriptionPlanRepository.existsByTier(PlanTier.STARTER)).thenReturn(true)

        assertThrows(DuplicatePlanTierException::class.java) {
            service.createPlan(cmd)
        }
    }

    @Test
    fun `updates plan`() {
        val planId = UUID.randomUUID()
        val existingPlan = SubscriptionPlan.create(
            name = "Old Name",
            tier = PlanTier.STARTER,
            monthlyPriceAmount = BigDecimal("100"),
            annualPriceAmount = BigDecimal("1000")
        )
        whenever(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.of(existingPlan))
        whenever(subscriptionPlanRepository.save(any())).thenAnswer { it.arguments[0] }

        val cmd = UpdateSubscriptionPlanCommand(
            name = "New Name",
            nameAr = null,
            description = null,
            descriptionAr = null,
            monthlyPriceAmount = BigDecimal("200"),
            monthlyPriceCurrency = null,
            annualPriceAmount = null,
            annualPriceCurrency = null,
            maxClubs = 5,
            maxLocationsPerClub = null,
            maxMembers = null,
            maxStaffUsers = null,
            features = null,
            sortOrder = null
        )

        val updated = service.updatePlan(planId, cmd)

        assertEquals("New Name", updated.name)
        assertEquals(BigDecimal("200"), updated.monthlyPriceAmount)
        assertEquals(5, updated.maxClubs)
    }

    @Test
    fun `lists active plans only`() {
        val activePlan = SubscriptionPlan.create(
            name = "Active",
            tier = PlanTier.PROFESSIONAL,
            monthlyPriceAmount = BigDecimal("599"),
            annualPriceAmount = BigDecimal("5990")
        )
        whenever(subscriptionPlanRepository.findByIsActiveTrue()).thenReturn(listOf(activePlan))

        val plans = service.listPlans(activeOnly = true)

        assertEquals(1, plans.size)
        assertEquals("Active", plans[0].name)
        verify(subscriptionPlanRepository).findByIsActiveTrue()
    }

    @Test
    fun `compares multiple plans`() {
        val id1 = UUID.randomUUID()
        val id2 = UUID.randomUUID()
        val plan1 = SubscriptionPlan.create("Starter", PlanTier.STARTER, BigDecimal("299"), BigDecimal("2990"))
        val plan2 = SubscriptionPlan.create("Pro", PlanTier.PROFESSIONAL, BigDecimal("599"), BigDecimal("5990"))

        whenever(subscriptionPlanRepository.findById(id1)).thenReturn(Optional.of(plan1))
        whenever(subscriptionPlanRepository.findById(id2)).thenReturn(Optional.of(plan2))

        val result = service.comparePlans(listOf(id1, id2))

        assertEquals(2, result.size)
        assertEquals("Starter", result[0].name)
        assertEquals("Pro", result[1].name)
    }

    @Test
    fun `deactivates plan`() {
        val planId = UUID.randomUUID()
        val plan = SubscriptionPlan.create("Test", PlanTier.STARTER, BigDecimal("100"), BigDecimal("1000"))
        whenever(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.of(plan))
        whenever(subscriptionPlanRepository.save(any())).thenAnswer { it.arguments[0] }

        val deactivated = service.deletePlan(planId)

        assertFalse(deactivated.isActive)
        verify(subscriptionPlanRepository).save(any())
    }

    @Test
    fun `getPlan throws when not found`() {
        val planId = UUID.randomUUID()
        whenever(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.empty())

        assertThrows(SubscriptionPlanNotFoundException::class.java) {
            service.getPlan(planId)
        }
    }

    private fun createPlanCommand() = CreateSubscriptionPlanCommand(
        name = "Starter Plan",
        nameAr = null,
        description = "A starter plan",
        descriptionAr = null,
        tier = PlanTier.STARTER,
        monthlyPriceAmount = BigDecimal("299"),
        monthlyPriceCurrency = "SAR",
        annualPriceAmount = BigDecimal("2990"),
        annualPriceCurrency = "SAR",
        maxClubs = 1,
        maxLocationsPerClub = 1,
        maxMembers = 200,
        maxStaffUsers = 5,
        features = mapOf("member_portal" to true, "mobile_app" to false),
        sortOrder = 1
    )
}
