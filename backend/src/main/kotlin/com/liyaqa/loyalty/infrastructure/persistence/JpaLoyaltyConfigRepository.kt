package com.liyaqa.loyalty.infrastructure.persistence

import com.liyaqa.loyalty.domain.model.LoyaltyConfig
import com.liyaqa.loyalty.domain.ports.LoyaltyConfigRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

interface SpringDataLoyaltyConfigRepository : JpaRepository<LoyaltyConfig, UUID> {
    fun findByTenantId(tenantId: UUID): Optional<LoyaltyConfig>
    fun existsByTenantId(tenantId: UUID): Boolean
}

@Repository
class JpaLoyaltyConfigRepository(
    private val springDataRepository: SpringDataLoyaltyConfigRepository
) : LoyaltyConfigRepository {

    override fun save(config: LoyaltyConfig): LoyaltyConfig =
        springDataRepository.save(config)

    override fun findByTenantId(tenantId: UUID): Optional<LoyaltyConfig> =
        springDataRepository.findByTenantId(tenantId)

    override fun existsByTenantId(tenantId: UUID): Boolean =
        springDataRepository.existsByTenantId(tenantId)
}
