package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.ContractStatus
import com.liyaqa.membership.domain.model.MembershipContract
import com.liyaqa.membership.domain.ports.MembershipContractRepository
import com.liyaqa.shared.domain.TenantContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataMembershipContractRepository : JpaRepository<MembershipContract, UUID> {
    fun findByContractNumber(contractNumber: String): Optional<MembershipContract>

    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MembershipContract>

    @Query("SELECT c FROM MembershipContract c WHERE c.memberId = :memberId AND c.status = 'ACTIVE'")
    fun findActiveByMemberId(@Param("memberId") memberId: UUID): Optional<MembershipContract>

    fun findBySubscriptionId(subscriptionId: UUID): Optional<MembershipContract>

    fun findByStatus(status: ContractStatus, pageable: Pageable): Page<MembershipContract>

    fun existsByContractNumber(contractNumber: String): Boolean

    @Query("SELECT c FROM MembershipContract c WHERE c.status = 'IN_NOTICE_PERIOD'")
    fun findContractsInNoticePeriod(pageable: Pageable): Page<MembershipContract>

    @Query("SELECT c FROM MembershipContract c WHERE c.status = 'ACTIVE' AND c.coolingOffEndDate >= :asOfDate")
    fun findContractsWithinCoolingOff(
        @Param("asOfDate") asOfDate: LocalDate,
        pageable: Pageable
    ): Page<MembershipContract>

    @Query("SELECT c FROM MembershipContract c WHERE c.status = 'ACTIVE' AND c.commitmentEndDate <= :date")
    fun findContractsWithCommitmentEndingBefore(
        @Param("date") date: LocalDate,
        pageable: Pageable
    ): Page<MembershipContract>

    @Query("SELECT c FROM MembershipContract c WHERE c.status = 'PENDING_SIGNATURE'")
    fun findPendingSignature(pageable: Pageable): Page<MembershipContract>

    @Query("""
        SELECT c FROM MembershipContract c
        WHERE (:memberId IS NULL OR c.memberId = :memberId)
        AND (:planId IS NULL OR c.planId = :planId)
        AND (:status IS NULL OR c.status = :status)
    """)
    fun search(
        @Param("memberId") memberId: UUID?,
        @Param("planId") planId: UUID?,
        @Param("status") status: ContractStatus?,
        pageable: Pageable
    ): Page<MembershipContract>
}

interface ContractNumberSequenceRepository : JpaRepository<ContractNumberSequence, UUID> {
    @Query("SELECT s FROM ContractNumberSequence s WHERE s.tenantId = :tenantId AND s.year = :year")
    fun findByTenantIdAndYear(@Param("tenantId") tenantId: UUID, @Param("year") year: Int): Optional<ContractNumberSequence>

    @Modifying
    @Query("UPDATE ContractNumberSequence s SET s.lastNumber = s.lastNumber + 1 WHERE s.tenantId = :tenantId AND s.year = :year")
    fun incrementSequence(@Param("tenantId") tenantId: UUID, @Param("year") year: Int): Int
}

@Repository
class JpaMembershipContractRepository(
    private val springDataRepository: SpringDataMembershipContractRepository,
    private val sequenceRepository: ContractNumberSequenceRepository
) : MembershipContractRepository {

    override fun save(contract: MembershipContract): MembershipContract =
        springDataRepository.save(contract)

    override fun findById(id: UUID): Optional<MembershipContract> =
        springDataRepository.findById(id)

    override fun findByContractNumber(contractNumber: String): Optional<MembershipContract> =
        springDataRepository.findByContractNumber(contractNumber)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MembershipContract> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findActiveByMemberId(memberId: UUID): Optional<MembershipContract> =
        springDataRepository.findActiveByMemberId(memberId)

    override fun findBySubscriptionId(subscriptionId: UUID): Optional<MembershipContract> =
        springDataRepository.findBySubscriptionId(subscriptionId)

    override fun findByStatus(status: ContractStatus, pageable: Pageable): Page<MembershipContract> =
        springDataRepository.findByStatus(status, pageable)

    override fun findAll(pageable: Pageable): Page<MembershipContract> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsByContractNumber(contractNumber: String): Boolean =
        springDataRepository.existsByContractNumber(contractNumber)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun findContractsInNoticePeriod(pageable: Pageable): Page<MembershipContract> =
        springDataRepository.findContractsInNoticePeriod(pageable)

    override fun findContractsWithinCoolingOff(asOfDate: LocalDate, pageable: Pageable): Page<MembershipContract> =
        springDataRepository.findContractsWithinCoolingOff(asOfDate, pageable)

    override fun findContractsWithCommitmentEndingBefore(date: LocalDate, pageable: Pageable): Page<MembershipContract> =
        springDataRepository.findContractsWithCommitmentEndingBefore(date, pageable)

    override fun findPendingSignature(pageable: Pageable): Page<MembershipContract> =
        springDataRepository.findPendingSignature(pageable)

    override fun search(
        memberId: UUID?,
        planId: UUID?,
        status: ContractStatus?,
        pageable: Pageable
    ): Page<MembershipContract> =
        springDataRepository.search(memberId, planId, status, pageable)

    @Transactional
    override fun getNextContractSequence(tenantId: UUID, year: Int): Int {
        val existing = sequenceRepository.findByTenantIdAndYear(tenantId, year)
        if (existing.isPresent) {
            sequenceRepository.incrementSequence(tenantId, year)
            return existing.get().lastNumber + 1
        } else {
            val sequence = ContractNumberSequence(tenantId = tenantId, year = year, lastNumber = 1)
            sequenceRepository.save(sequence)
            return 1
        }
    }
}

/**
 * Entity for tracking contract number sequences per tenant per year.
 */
@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "contract_number_sequences")
class ContractNumberSequence(
    @jakarta.persistence.Id
    @jakarta.persistence.Column(name = "tenant_id")
    val tenantId: UUID,

    @jakarta.persistence.Column(name = "year", nullable = false)
    val year: Int,

    @jakarta.persistence.Column(name = "last_number", nullable = false)
    var lastNumber: Int = 0,

    @jakarta.persistence.Column(name = "updated_at")
    var updatedAt: java.time.Instant = java.time.Instant.now()
)
