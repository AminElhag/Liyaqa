package com.liyaqa.loyalty.domain.ports

import com.liyaqa.loyalty.domain.model.PointsSource
import com.liyaqa.loyalty.domain.model.PointsTransaction
import com.liyaqa.loyalty.domain.model.PointsTransactionType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.*

interface PointsTransactionRepository {
    fun save(transaction: PointsTransaction): PointsTransaction
    fun findById(id: UUID): Optional<PointsTransaction>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<PointsTransaction>
    fun findByMemberIdAndType(memberId: UUID, type: PointsTransactionType, pageable: Pageable): Page<PointsTransaction>
    fun findByMemberIdAndSource(memberId: UUID, source: PointsSource, pageable: Pageable): Page<PointsTransaction>
    fun findExpiredTransactions(before: Instant, pageable: Pageable): Page<PointsTransaction>
    fun sumPointsByMemberIdAndType(memberId: UUID, type: PointsTransactionType): Long
}
