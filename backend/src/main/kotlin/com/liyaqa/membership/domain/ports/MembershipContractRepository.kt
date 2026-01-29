package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.ContractStatus
import com.liyaqa.membership.domain.model.MembershipContract
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for MembershipContract entity.
 * Contracts are tenant-scoped (belong to a club).
 */
interface MembershipContractRepository {
    fun save(contract: MembershipContract): MembershipContract
    fun findById(id: UUID): Optional<MembershipContract>
    fun findByContractNumber(contractNumber: String): Optional<MembershipContract>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MembershipContract>
    fun findActiveByMemberId(memberId: UUID): Optional<MembershipContract>
    fun findBySubscriptionId(subscriptionId: UUID): Optional<MembershipContract>
    fun findByStatus(status: ContractStatus, pageable: Pageable): Page<MembershipContract>
    fun findAll(pageable: Pageable): Page<MembershipContract>
    fun existsById(id: UUID): Boolean
    fun existsByContractNumber(contractNumber: String): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find contracts in notice period that should be processed.
     */
    fun findContractsInNoticePeriod(pageable: Pageable): Page<MembershipContract>

    /**
     * Find contracts still within cooling-off period.
     */
    fun findContractsWithinCoolingOff(asOfDate: LocalDate, pageable: Pageable): Page<MembershipContract>

    /**
     * Find contracts with commitment ending soon.
     */
    fun findContractsWithCommitmentEndingBefore(date: LocalDate, pageable: Pageable): Page<MembershipContract>

    /**
     * Find pending signature contracts.
     */
    fun findPendingSignature(pageable: Pageable): Page<MembershipContract>

    /**
     * Search contracts with various filters.
     */
    fun search(
        memberId: UUID?,
        planId: UUID?,
        status: ContractStatus?,
        pageable: Pageable
    ): Page<MembershipContract>

    /**
     * Get the next contract number sequence for a tenant/year.
     */
    fun getNextContractSequence(tenantId: UUID, year: Int): Int
}
