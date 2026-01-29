package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.ContractPricingTier
import com.liyaqa.membership.domain.model.ContractTerm
import com.liyaqa.membership.domain.ports.ContractPricingTierRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataContractPricingTierRepository : JpaRepository<ContractPricingTier, UUID> {
    fun findByPlanId(planId: UUID, pageable: Pageable): Page<ContractPricingTier>

    @Query("SELECT t FROM ContractPricingTier t WHERE t.planId = :planId AND t.contractTerm = :term")
    fun findByPlanIdAndContractTerm(
        @Param("planId") planId: UUID,
        @Param("term") term: ContractTerm
    ): Optional<ContractPricingTier>

    @Query("SELECT t FROM ContractPricingTier t WHERE t.planId = :planId AND t.isActive = true ORDER BY t.contractTerm")
    fun findActiveByPlanId(@Param("planId") planId: UUID): List<ContractPricingTier>
}

@Repository
class JpaContractPricingTierRepository(
    private val springDataRepository: SpringDataContractPricingTierRepository
) : ContractPricingTierRepository {

    override fun save(tier: ContractPricingTier): ContractPricingTier =
        springDataRepository.save(tier)

    override fun findById(id: UUID): Optional<ContractPricingTier> =
        springDataRepository.findById(id)

    override fun findByPlanId(planId: UUID, pageable: Pageable): Page<ContractPricingTier> =
        springDataRepository.findByPlanId(planId, pageable)

    override fun findByPlanIdAndContractTerm(planId: UUID, term: ContractTerm): Optional<ContractPricingTier> =
        springDataRepository.findByPlanIdAndContractTerm(planId, term)

    override fun findActiveByPlanId(planId: UUID): List<ContractPricingTier> =
        springDataRepository.findActiveByPlanId(planId)

    override fun findAll(pageable: Pageable): Page<ContractPricingTier> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()
}
