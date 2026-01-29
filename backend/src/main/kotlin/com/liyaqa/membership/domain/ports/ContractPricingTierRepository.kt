package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.ContractPricingTier
import com.liyaqa.membership.domain.model.ContractTerm
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for ContractPricingTier entity.
 * Pricing tiers are tenant-scoped (belong to a club).
 */
interface ContractPricingTierRepository {
    fun save(tier: ContractPricingTier): ContractPricingTier
    fun findById(id: UUID): Optional<ContractPricingTier>
    fun findByPlanId(planId: UUID, pageable: Pageable): Page<ContractPricingTier>
    fun findByPlanIdAndContractTerm(planId: UUID, term: ContractTerm): Optional<ContractPricingTier>
    fun findActiveByPlanId(planId: UUID): List<ContractPricingTier>
    fun findAll(pageable: Pageable): Page<ContractPricingTier>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
}
