package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.FeatureCategory
import com.liyaqa.platform.subscription.model.FeatureFlag
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataFeatureFlagRepository : JpaRepository<FeatureFlag, UUID> {
    fun findByKey(key: String): Optional<FeatureFlag>
    fun findByCategory(category: FeatureCategory): List<FeatureFlag>
    fun findByIsActiveTrue(): List<FeatureFlag>
    fun existsByKey(key: String): Boolean
}

@Repository
class JpaFeatureFlagRepository(
    private val springDataRepository: SpringDataFeatureFlagRepository
) : FeatureFlagRepository {

    override fun save(flag: FeatureFlag): FeatureFlag =
        springDataRepository.save(flag)

    override fun findByKey(key: String): Optional<FeatureFlag> =
        springDataRepository.findByKey(key)

    override fun findAll(): List<FeatureFlag> =
        springDataRepository.findAll()

    override fun findByCategory(category: FeatureCategory): List<FeatureFlag> =
        springDataRepository.findByCategory(category)

    override fun findByIsActiveTrue(): List<FeatureFlag> =
        springDataRepository.findByIsActiveTrue()

    override fun existsByKey(key: String): Boolean =
        springDataRepository.existsByKey(key)
}
