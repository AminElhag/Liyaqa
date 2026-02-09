package com.liyaqa.platform.subscription.service

import com.liyaqa.platform.subscription.dto.CreateFeatureFlagCommand
import com.liyaqa.platform.subscription.dto.EffectiveFeaturesResponse
import com.liyaqa.platform.subscription.dto.FeatureFlagsByCategoryResponse
import com.liyaqa.platform.subscription.dto.FeatureFlagResponse
import com.liyaqa.platform.subscription.dto.TenantFeatureOverrideResponse
import com.liyaqa.platform.subscription.dto.UpdateFeatureFlagCommand
import com.liyaqa.platform.subscription.exception.DuplicateFeatureKeyException
import com.liyaqa.platform.subscription.exception.FeatureFlagNotFoundException
import com.liyaqa.platform.subscription.model.FeatureFlag
import com.liyaqa.platform.subscription.model.TenantFeatureOverride
import com.liyaqa.platform.subscription.repository.FeatureFlagRepository
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantFeatureOverrideRepository
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class FeatureAccessService(
    private val subscriptionPlanRepository: SubscriptionPlanRepository,
    private val tenantFeatureOverrideRepository: TenantFeatureOverrideRepository,
    private val featureFlagRepository: FeatureFlagRepository,
    private val tenantRepository: TenantRepository
) {

    @Cacheable(cacheNames = ["featureAccess"], key = "#tenantId + ':' + #featureKey")
    @Transactional(readOnly = true)
    fun hasFeature(tenantId: UUID, featureKey: String): Boolean {
        // 1. Check tenant override first
        val override = tenantFeatureOverrideRepository
            .findByTenantIdAndFeatureKey(tenantId, featureKey)
        if (override.isPresent) {
            return override.get().enabled
        }

        // 2. Check plan features
        val tenant = tenantRepository.findById(tenantId).orElse(null)
        if (tenant?.subscriptionPlanId != null) {
            val plan = subscriptionPlanRepository.findById(tenant.subscriptionPlanId!!).orElse(null)
            if (plan != null) {
                val planFeature = plan.features[featureKey]
                if (planFeature != null) return planFeature
            }
        }

        // 3. Fallback to feature flag default
        val flag = featureFlagRepository.findByKey(featureKey).orElse(null)
        return flag?.defaultEnabled ?: false
    }

    @Transactional(readOnly = true)
    fun getEffectiveFeatures(tenantId: UUID): EffectiveFeaturesResponse {
        val tenant = tenantRepository.findById(tenantId).orElse(null)

        // Start with all active feature flag defaults
        val allFlags = featureFlagRepository.findByIsActiveTrue()
        val effectiveFeatures = mutableMapOf<String, Boolean>()
        allFlags.forEach { flag -> effectiveFeatures[flag.key] = flag.defaultEnabled }

        // Override with plan features
        var planId: UUID? = null
        var planName: String? = null
        if (tenant?.subscriptionPlanId != null) {
            val plan = subscriptionPlanRepository.findById(tenant.subscriptionPlanId!!).orElse(null)
            if (plan != null) {
                planId = plan.id
                planName = plan.name
                effectiveFeatures.putAll(plan.features)
            }
        }

        // Override with tenant-specific overrides
        val overrides = tenantFeatureOverrideRepository.findByTenantId(tenantId)
        overrides.forEach { override ->
            effectiveFeatures[override.featureKey] = override.enabled
        }

        return EffectiveFeaturesResponse(
            tenantId = tenantId,
            planId = planId,
            planName = planName,
            features = effectiveFeatures,
            overrides = overrides.map { TenantFeatureOverrideResponse.from(it) }
        )
    }

    @CacheEvict(cacheNames = ["featureAccess"], key = "#tenantId + ':' + #featureKey")
    fun setOverride(tenantId: UUID, featureKey: String, enabled: Boolean, reason: String?, overriddenBy: UUID): TenantFeatureOverride {
        val existing = tenantFeatureOverrideRepository
            .findByTenantIdAndFeatureKey(tenantId, featureKey)

        val override = if (existing.isPresent) {
            existing.get().apply {
                this.enabled = enabled
                this.reason = reason
                this.overriddenBy = overriddenBy
            }
        } else {
            TenantFeatureOverride.create(
                tenantId = tenantId,
                featureKey = featureKey,
                enabled = enabled,
                reason = reason,
                overriddenBy = overriddenBy
            )
        }

        return tenantFeatureOverrideRepository.save(override)
    }

    @CacheEvict(cacheNames = ["featureAccess"], key = "#tenantId + ':' + #featureKey")
    fun removeOverride(tenantId: UUID, featureKey: String) {
        tenantFeatureOverrideRepository.deleteByTenantIdAndFeatureKey(tenantId, featureKey)
    }

    @Transactional(readOnly = true)
    fun getOverrides(tenantId: UUID): List<TenantFeatureOverride> =
        tenantFeatureOverrideRepository.findByTenantId(tenantId)

    @Transactional(readOnly = true)
    fun listFeatureFlags(): List<FeatureFlagsByCategoryResponse> {
        val allFlags = featureFlagRepository.findByIsActiveTrue()
        return allFlags
            .groupBy { it.category }
            .map { (category, flags) ->
                FeatureFlagsByCategoryResponse(
                    category = category,
                    flags = flags.map { FeatureFlagResponse.from(it) }
                )
            }
    }

    fun createFeatureFlag(cmd: CreateFeatureFlagCommand): FeatureFlag {
        if (featureFlagRepository.existsByKey(cmd.key)) {
            throw DuplicateFeatureKeyException(cmd.key)
        }

        val flag = FeatureFlag.create(
            key = cmd.key,
            name = cmd.name,
            category = cmd.category,
            defaultEnabled = cmd.defaultEnabled
        ).apply {
            description = cmd.description
        }

        return featureFlagRepository.save(flag)
    }

    fun updateFeatureFlag(key: String, cmd: UpdateFeatureFlagCommand): FeatureFlag {
        val flag = featureFlagRepository.findByKey(key)
            .orElseThrow { FeatureFlagNotFoundException(key) }

        cmd.name?.let { flag.name = it }
        cmd.description?.let { flag.description = it }
        cmd.category?.let { flag.category = it }
        cmd.defaultEnabled?.let { flag.defaultEnabled = it }
        cmd.isActive?.let { flag.isActive = it }

        return featureFlagRepository.save(flag)
    }
}
