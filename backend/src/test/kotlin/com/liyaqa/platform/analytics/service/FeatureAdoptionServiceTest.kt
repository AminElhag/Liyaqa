package com.liyaqa.platform.analytics.service

import com.liyaqa.platform.subscription.model.FeatureCategory
import com.liyaqa.platform.subscription.model.FeatureFlag
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionBillingCycle
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.model.TenantFeatureOverride
import com.liyaqa.platform.subscription.model.TenantSubscription
import com.liyaqa.platform.subscription.repository.FeatureFlagRepository
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantFeatureOverrideRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.model.TenantStatus
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
import java.time.LocalDate
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FeatureAdoptionServiceTest {

    @Mock private lateinit var featureFlagRepository: FeatureFlagRepository
    @Mock private lateinit var subscriptionPlanRepository: SubscriptionPlanRepository
    @Mock private lateinit var tenantSubscriptionRepository: TenantSubscriptionRepository
    @Mock private lateinit var tenantFeatureOverrideRepository: TenantFeatureOverrideRepository
    @Mock private lateinit var tenantRepository: TenantRepository

    private lateinit var service: FeatureAdoptionService

    private val planId = UUID.randomUUID()
    private val tenantId1 = UUID.randomUUID()
    private val tenantId2 = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        service = FeatureAdoptionService(
            featureFlagRepository, subscriptionPlanRepository,
            tenantSubscriptionRepository, tenantFeatureOverrideRepository,
            tenantRepository
        )
    }

    @Test
    fun `counts tenants with feature available from plan`() {
        val flag = FeatureFlag.create("booking", "Online Booking", FeatureCategory.OPERATIONS)
        val plan = SubscriptionPlan.create("Pro", PlanTier.PROFESSIONAL, BigDecimal("500"), BigDecimal("5000"))
        plan.features["booking"] = true

        whenever(featureFlagRepository.findByIsActiveTrue()).thenReturn(listOf(flag))
        whenever(subscriptionPlanRepository.findAll()).thenReturn(listOf(plan))
        whenever(tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)).thenReturn(
            listOf(
                TenantSubscription.createActive(tenantId1, plan.id, SubscriptionBillingCycle.MONTHLY),
                TenantSubscription.createActive(tenantId2, plan.id, SubscriptionBillingCycle.MONTHLY)
            )
        )
        whenever(tenantRepository.findByStatus(any<TenantStatus>(), any<Pageable>()))
            .thenReturn(PageImpl(listOf(
                Tenant(id = tenantId1, facilityName = "Gym1", contactEmail = "a@test.com"),
                Tenant(id = tenantId2, facilityName = "Gym2", contactEmail = "b@test.com")
            )))
        whenever(tenantFeatureOverrideRepository.findByTenantId(any())).thenReturn(emptyList())

        val result = service.getFeatureAdoption()
        assertEquals(1, result.features.size)
        assertEquals("booking", result.features[0].featureKey)
        assertEquals(2, result.features[0].activeTenantsUsing)
        assertEquals(BigDecimal("100.00"), result.features[0].adoptionRate)
    }

    @Test
    fun `handles overrides correctly`() {
        val flag = FeatureFlag.create("sms", "SMS Notifications", FeatureCategory.MEMBER_ENGAGEMENT)
        val plan = SubscriptionPlan.create("Starter", PlanTier.STARTER, BigDecimal("200"), BigDecimal("2000"))
        plan.features["sms"] = true

        whenever(featureFlagRepository.findByIsActiveTrue()).thenReturn(listOf(flag))
        whenever(subscriptionPlanRepository.findAll()).thenReturn(listOf(plan))
        whenever(tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)).thenReturn(
            listOf(
                TenantSubscription.createActive(tenantId1, plan.id, SubscriptionBillingCycle.MONTHLY),
                TenantSubscription.createActive(tenantId2, plan.id, SubscriptionBillingCycle.MONTHLY)
            )
        )
        whenever(tenantRepository.findByStatus(any<TenantStatus>(), any<Pageable>()))
            .thenReturn(PageImpl(listOf(
                Tenant(id = tenantId1, facilityName = "Gym1", contactEmail = "a@test.com"),
                Tenant(id = tenantId2, facilityName = "Gym2", contactEmail = "b@test.com")
            )))
        // tenantId1 has SMS disabled via override
        whenever(tenantFeatureOverrideRepository.findByTenantId(tenantId1)).thenReturn(
            listOf(TenantFeatureOverride.create(tenantId1, "sms", false, null, UUID.randomUUID()))
        )
        whenever(tenantFeatureOverrideRepository.findByTenantId(tenantId2)).thenReturn(emptyList())

        val result = service.getFeatureAdoption()
        assertEquals(1, result.features.size)
        // Only tenantId2 should have sms (tenantId1 disabled via override)
        assertEquals(1, result.features[0].activeTenantsUsing)
    }

    @Test
    fun `empty feature flags returns empty list`() {
        whenever(featureFlagRepository.findByIsActiveTrue()).thenReturn(emptyList())

        val result = service.getFeatureAdoption()
        assertTrue(result.features.isEmpty())
    }
}
