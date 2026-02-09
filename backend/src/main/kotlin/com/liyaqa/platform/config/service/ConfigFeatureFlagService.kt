package com.liyaqa.platform.config.service

import com.liyaqa.platform.config.dto.FeatureMatrixEntry
import com.liyaqa.platform.config.dto.FeatureMatrixResponse
import com.liyaqa.platform.config.dto.FeatureRolloutRequest
import com.liyaqa.platform.config.dto.FeatureRolloutResponse
import com.liyaqa.platform.config.dto.ToggleFeatureFlagRequest
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.subscription.service.FeatureAccessService
import com.liyaqa.platform.tenant.repository.TenantRepository
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class ConfigFeatureFlagService(
    private val featureAccessService: FeatureAccessService,
    private val tenantSubscriptionRepository: TenantSubscriptionRepository,
    private val tenantRepository: TenantRepository,
    private val securityService: SecurityService
) {

    fun toggleFeatureForTenant(tenantId: UUID, featureKey: String, request: ToggleFeatureFlagRequest) {
        val currentUserId = securityService.getCurrentUserId()
            ?: throw IllegalStateException("No authenticated user")

        featureAccessService.setOverride(
            tenantId = tenantId,
            featureKey = featureKey,
            enabled = request.enabled,
            reason = request.reason,
            overriddenBy = currentUserId
        )
    }

    fun rolloutFeature(request: FeatureRolloutRequest): FeatureRolloutResponse {
        val currentUserId = securityService.getCurrentUserId()
            ?: throw IllegalStateException("No authenticated user")

        val activeSubscriptions = tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)
        val activeTenantIds = activeSubscriptions.map { it.tenantId }

        val shuffled = activeTenantIds.shuffled()
        val enableCount = (shuffled.size * request.percentage / 100).coerceAtLeast(
            if (request.percentage > 0 && shuffled.isNotEmpty()) 1 else 0
        )
        val tenantsToEnable = shuffled.take(enableCount)

        tenantsToEnable.forEach { tenantId ->
            featureAccessService.setOverride(
                tenantId = tenantId,
                featureKey = request.featureKey,
                enabled = true,
                reason = request.reason ?: "Rollout at ${request.percentage}%",
                overriddenBy = currentUserId
            )
        }

        return FeatureRolloutResponse(
            featureKey = request.featureKey,
            percentage = request.percentage,
            totalActiveTenants = activeTenantIds.size,
            enabledCount = tenantsToEnable.size,
            tenantsEnabled = tenantsToEnable
        )
    }

    @Transactional(readOnly = true)
    fun getFeatureMatrix(): FeatureMatrixResponse {
        val flagCategories = featureAccessService.listFeatureFlags()
        val allFeatureKeys = flagCategories.flatMap { cat -> cat.flags.map { it.key } }

        val activeSubscriptions = tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)
        val activeTenantIds = activeSubscriptions.map { it.tenantId }

        val tenants = activeTenantIds.mapNotNull { tenantId ->
            tenantRepository.findById(tenantId).orElse(null)
        }

        val entries = tenants.map { tenant ->
            val effective = featureAccessService.getEffectiveFeatures(tenant.id)
            FeatureMatrixEntry(
                tenantId = tenant.id,
                tenantName = tenant.facilityName,
                features = allFeatureKeys.associateWith { key ->
                    effective.features[key] ?: false
                }
            )
        }

        return FeatureMatrixResponse(
            featureKeys = allFeatureKeys,
            tenants = entries
        )
    }
}
