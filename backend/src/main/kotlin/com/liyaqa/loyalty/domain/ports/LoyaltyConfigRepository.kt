package com.liyaqa.loyalty.domain.ports

import com.liyaqa.loyalty.domain.model.LoyaltyConfig
import java.util.*

interface LoyaltyConfigRepository {
    fun save(config: LoyaltyConfig): LoyaltyConfig
    fun findByTenantId(tenantId: UUID): Optional<LoyaltyConfig>
    fun existsByTenantId(tenantId: UUID): Boolean
}
