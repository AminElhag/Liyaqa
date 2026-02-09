package com.liyaqa.platform.subscription.service

import com.liyaqa.platform.subscription.dto.CreateFeatureFlagCommand
import com.liyaqa.platform.subscription.exception.DuplicateFeatureKeyException
import com.liyaqa.platform.subscription.exception.FeatureFlagNotFoundException
import com.liyaqa.platform.subscription.model.FeatureCategory
import com.liyaqa.platform.subscription.model.FeatureFlag
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import com.liyaqa.platform.subscription.model.TenantFeatureOverride
import com.liyaqa.platform.subscription.repository.FeatureFlagRepository
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantFeatureOverrideRepository
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
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
class FeatureAccessServiceTest {

    @Mock
    private lateinit var subscriptionPlanRepository: SubscriptionPlanRepository

    @Mock
    private lateinit var tenantFeatureOverrideRepository: TenantFeatureOverrideRepository

    @Mock
    private lateinit var featureFlagRepository: FeatureFlagRepository

    @Mock
    private lateinit var tenantRepository: TenantRepository

    private lateinit var service: FeatureAccessService

    private val tenantId = UUID.randomUUID()
    private val planId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        service = FeatureAccessService(
            subscriptionPlanRepository,
            tenantFeatureOverrideRepository,
            featureFlagRepository,
            tenantRepository
        )
    }

    @Test
    fun `hasFeature returns true when plan has feature`() {
        val tenant = createTenant(planId)
        val plan = createPlan(mapOf("advanced_reporting" to true))

        whenever(tenantFeatureOverrideRepository.findByTenantIdAndFeatureKey(tenantId, "advanced_reporting"))
            .thenReturn(Optional.empty())
        whenever(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant))
        whenever(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.of(plan))

        val result = service.hasFeature(tenantId, "advanced_reporting")

        assertTrue(result)
    }

    @Test
    fun `hasFeature returns override value when override exists`() {
        val override = TenantFeatureOverride.create(
            tenantId = tenantId,
            featureKey = "advanced_reporting",
            enabled = false,
            reason = "Trial expired",
            overriddenBy = UUID.randomUUID()
        )

        whenever(tenantFeatureOverrideRepository.findByTenantIdAndFeatureKey(tenantId, "advanced_reporting"))
            .thenReturn(Optional.of(override))

        val result = service.hasFeature(tenantId, "advanced_reporting")

        assertFalse(result)
    }

    @Test
    fun `hasFeature returns flag default when not in plan`() {
        val tenant = createTenant(planId)
        val plan = createPlan(emptyMap())
        val flag = FeatureFlag.create("new_feature", "New Feature", FeatureCategory.OPERATIONS, defaultEnabled = true)

        whenever(tenantFeatureOverrideRepository.findByTenantIdAndFeatureKey(tenantId, "new_feature"))
            .thenReturn(Optional.empty())
        whenever(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant))
        whenever(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.of(plan))
        whenever(featureFlagRepository.findByKey("new_feature")).thenReturn(Optional.of(flag))

        val result = service.hasFeature(tenantId, "new_feature")

        assertTrue(result)
    }

    @Test
    fun `getEffectiveFeatures merges plan and overrides`() {
        val tenant = createTenant(planId)
        val plan = createPlan(mapOf("member_portal" to true, "api_access" to false))
        val flag1 = FeatureFlag.create("member_portal", "Member Portal", FeatureCategory.MEMBER_ENGAGEMENT, true)
        val flag2 = FeatureFlag.create("api_access", "API Access", FeatureCategory.INTEGRATIONS, false)
        val flag3 = FeatureFlag.create("advanced_reporting", "Advanced Reporting", FeatureCategory.REPORTING, false)

        val override = TenantFeatureOverride.create(
            tenantId = tenantId,
            featureKey = "api_access",
            enabled = true,
            reason = "Enterprise trial",
            overriddenBy = UUID.randomUUID()
        )

        whenever(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant))
        whenever(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.of(plan))
        whenever(featureFlagRepository.findByIsActiveTrue()).thenReturn(listOf(flag1, flag2, flag3))
        whenever(tenantFeatureOverrideRepository.findByTenantId(tenantId)).thenReturn(listOf(override))

        val result = service.getEffectiveFeatures(tenantId)

        assertEquals(tenantId, result.tenantId)
        assertEquals(planId, result.planId)
        assertTrue(result.features["member_portal"] == true)
        assertTrue(result.features["api_access"] == true) // override wins
        assertFalse(result.features["advanced_reporting"] == true) // flag default
        assertEquals(1, result.overrides.size)
    }

    @Test
    fun `setOverride creates new override`() {
        val overriddenBy = UUID.randomUUID()
        whenever(tenantFeatureOverrideRepository.findByTenantIdAndFeatureKey(tenantId, "api_access"))
            .thenReturn(Optional.empty())
        whenever(tenantFeatureOverrideRepository.save(any())).thenAnswer { it.arguments[0] }

        val result = service.setOverride(tenantId, "api_access", true, "Special deal", overriddenBy)

        assertEquals(tenantId, result.tenantId)
        assertEquals("api_access", result.featureKey)
        assertTrue(result.enabled)
        assertEquals("Special deal", result.reason)
        verify(tenantFeatureOverrideRepository).save(any())
    }

    @Test
    fun `removeOverride deletes override`() {
        service.removeOverride(tenantId, "api_access")

        verify(tenantFeatureOverrideRepository).deleteByTenantIdAndFeatureKey(tenantId, "api_access")
    }

    @Test
    fun `createFeatureFlag rejects duplicate key`() {
        whenever(featureFlagRepository.existsByKey("existing_key")).thenReturn(true)

        val cmd = CreateFeatureFlagCommand(
            key = "existing_key",
            name = "Existing",
            description = null,
            category = FeatureCategory.OPERATIONS,
            defaultEnabled = false
        )

        assertThrows(DuplicateFeatureKeyException::class.java) {
            service.createFeatureFlag(cmd)
        }
    }

    @Test
    fun `updateFeatureFlag throws when not found`() {
        whenever(featureFlagRepository.findByKey("nonexistent")).thenReturn(Optional.empty())

        assertThrows(FeatureFlagNotFoundException::class.java) {
            service.updateFeatureFlag("nonexistent", com.liyaqa.platform.subscription.dto.UpdateFeatureFlagCommand(
                name = "Updated",
                description = null,
                category = null,
                defaultEnabled = null,
                isActive = null
            ))
        }
    }

    private fun createTenant(subscriptionPlanId: UUID): Tenant {
        return Tenant.create(
            facilityName = "Test Gym",
            contactEmail = "test@example.com"
        ).apply {
            this.subscriptionPlanId = subscriptionPlanId
        }
    }

    private fun createPlan(features: Map<String, Boolean>): SubscriptionPlan {
        return SubscriptionPlan(
            id = planId,
            name = "Test Plan",
            tier = PlanTier.PROFESSIONAL,
            monthlyPriceAmount = BigDecimal("599"),
            annualPriceAmount = BigDecimal("5990"),
            features = features.toMutableMap()
        )
    }
}
