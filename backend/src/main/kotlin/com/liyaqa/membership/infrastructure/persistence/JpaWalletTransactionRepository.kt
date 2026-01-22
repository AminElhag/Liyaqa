package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.WalletTransaction
import com.liyaqa.membership.domain.model.WalletTransactionType
import com.liyaqa.membership.domain.ports.WalletTransactionRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

/**
 * Spring Data JPA repository interface for WalletTransaction.
 */
interface SpringDataWalletTransactionRepository : JpaRepository<WalletTransaction, UUID> {
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<WalletTransaction>
    fun findByMemberIdAndType(memberId: UUID, type: WalletTransactionType, pageable: Pageable): Page<WalletTransaction>
    fun countByMemberId(memberId: UUID): Long
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaWalletTransactionRepository(
    private val springDataRepository: SpringDataWalletTransactionRepository
) : WalletTransactionRepository {

    override fun save(transaction: WalletTransaction): WalletTransaction {
        return springDataRepository.save(transaction)
    }

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<WalletTransaction> {
        return springDataRepository.findByMemberId(memberId, pageable)
    }

    override fun findByMemberIdAndType(memberId: UUID, type: WalletTransactionType, pageable: Pageable): Page<WalletTransaction> {
        return springDataRepository.findByMemberIdAndType(memberId, type, pageable)
    }

    override fun countByMemberId(memberId: UUID): Long {
        return springDataRepository.countByMemberId(memberId)
    }
}
