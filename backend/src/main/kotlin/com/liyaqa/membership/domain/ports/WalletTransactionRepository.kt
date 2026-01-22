package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.WalletTransaction
import com.liyaqa.membership.domain.model.WalletTransactionType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.UUID

/**
 * Repository port for WalletTransaction entity.
 */
interface WalletTransactionRepository {
    fun save(transaction: WalletTransaction): WalletTransaction
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<WalletTransaction>
    fun findByMemberIdAndType(memberId: UUID, type: WalletTransactionType, pageable: Pageable): Page<WalletTransaction>
    fun countByMemberId(memberId: UUID): Long
}
