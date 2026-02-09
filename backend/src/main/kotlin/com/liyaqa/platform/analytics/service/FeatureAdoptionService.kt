package com.liyaqa.platform.analytics.service

import com.liyaqa.platform.analytics.dto.FeatureAdoptionEntry
import com.liyaqa.platform.analytics.dto.FeatureAdoptionResponse
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.repository.FeatureFlagRepository
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantFeatureOverrideRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode

@Service
@Transactional(readOnly = true)
class FeatureAdoptionService(
    private val featureFlagRepository: FeatureFlagRepository,
    private val subscriptionPlanRepository: SubscriptionPlanRepository,
    private val tenantSubscriptionRepository: TenantSubscriptionRepository,
    private val tenantFeatureOverrideRepository: TenantFeatureOverrideRepository,
    private val tenantRepository: TenantRepository
) {
    private val logger = LoggerFactory.getLogger(FeatureAdoptionService::class.java)

    @Cacheable(
        value = ["platformDashboard"],
        key = "'analytics-feature-adoption'",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getFeatureAdoption(): FeatureAdoptionResponse {
        logger.info("Building feature adoption analysis")

        val activeFlags = featureFlagRepository.findByIsActiveTrue()
        if (activeFlags.isEmpty()) {
            return FeatureAdoptionResponse(features = emptyList())
        }

        val allPlans = subscriptionPlanRepository.findAll().associateBy { it.id }
        val activeSubs = tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)
        val totalActiveTenants = tenantRepository.findByStatus(TenantStatus.ACTIVE, Pageable.unpaged()).totalElements

        // Build a map: featureKey -> set of tenantIds that have access via their plan
        val featureTenantMap = mutableMapOf<String, MutableSet<java.util.UUID>>()
        for (flag in activeFlags) {
            featureTenantMap[flag.key] = mutableSetOf()
        }

        for (sub in activeSubs) {
            val plan = allPlans[sub.planId] ?: continue
            for (flag in activeFlags) {
                if (plan.hasFeature(flag.key) || flag.defaultEnabled) {
                    featureTenantMap[flag.key]?.add(sub.tenantId)
                }
            }
        }

        // Apply overrides: for each active sub's tenant, check overrides
        for (sub in activeSubs) {
            val overrides = tenantFeatureOverrideRepository.findByTenantId(sub.tenantId)
            for (override in overrides) {
                val tenantSet = featureTenantMap[override.featureKey] ?: continue
                if (override.enabled) {
                    tenantSet.add(sub.tenantId)
                } else {
                    tenantSet.remove(sub.tenantId)
                }
            }
        }

        val features = activeFlags.map { flag ->
            val tenantsUsing = featureTenantMap[flag.key]?.size?.toLong() ?: 0
            val adoptionRate = if (totalActiveTenants > 0) {
                BigDecimal(tenantsUsing).multiply(BigDecimal(100))
                    .divide(BigDecimal(totalActiveTenants), 2, RoundingMode.HALF_UP)
            } else {
                BigDecimal.ZERO
            }

            FeatureAdoptionEntry(
                featureKey = flag.key,
                name = flag.name,
                adoptionRate = adoptionRate,
                activeTenantsUsing = tenantsUsing,
                totalAvailable = totalActiveTenants,
                trend = "STABLE"
            )
        }.sortedByDescending { it.adoptionRate }

        return FeatureAdoptionResponse(features = features)
    }
}
