package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.FeatureCategory
import com.liyaqa.platform.subscription.model.FeatureFlag
import java.util.Optional

interface FeatureFlagRepository {
    fun save(flag: FeatureFlag): FeatureFlag
    fun findByKey(key: String): Optional<FeatureFlag>
    fun findAll(): List<FeatureFlag>
    fun findByCategory(category: FeatureCategory): List<FeatureFlag>
    fun findByIsActiveTrue(): List<FeatureFlag>
    fun existsByKey(key: String): Boolean
}
