package com.liyaqa.loyalty.infrastructure.persistence

import com.liyaqa.loyalty.domain.model.PointsSource
import com.liyaqa.loyalty.domain.model.PointsTransaction
import com.liyaqa.loyalty.domain.model.PointsTransactionType
import com.liyaqa.loyalty.domain.ports.PointsTransactionRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

interface SpringDataPointsTransactionRepository : JpaRepository<PointsTransaction, UUID> {
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<PointsTransaction>
    fun findByMemberIdAndType(memberId: UUID, type: PointsTransactionType, pageable: Pageable): Page<PointsTransaction>
    fun findByMemberIdAndSource(memberId: UUID, source: PointsSource, pageable: Pageable): Page<PointsTransaction>

    @Query("SELECT pt FROM PointsTransaction pt WHERE pt.expiresAt IS NOT NULL AND pt.expiresAt < :before AND pt.type = 'EARN'")
    fun findExpiredTransactions(@Param("before") before: Instant, pageable: Pageable): Page<PointsTransaction>

    @Query("SELECT COALESCE(SUM(pt.points), 0) FROM PointsTransaction pt WHERE pt.memberId = :memberId AND pt.type = :type")
    fun sumPointsByMemberIdAndType(@Param("memberId") memberId: UUID, @Param("type") type: PointsTransactionType): Long
}

@Repository
class JpaPointsTransactionRepository(
    private val springDataRepository: SpringDataPointsTransactionRepository
) : PointsTransactionRepository {

    override fun save(transaction: PointsTransaction): PointsTransaction =
        springDataRepository.save(transaction)

    override fun findById(id: UUID): Optional<PointsTransaction> =
        springDataRepository.findById(id)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<PointsTransaction> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findByMemberIdAndType(memberId: UUID, type: PointsTransactionType, pageable: Pageable): Page<PointsTransaction> =
        springDataRepository.findByMemberIdAndType(memberId, type, pageable)

    override fun findByMemberIdAndSource(memberId: UUID, source: PointsSource, pageable: Pageable): Page<PointsTransaction> =
        springDataRepository.findByMemberIdAndSource(memberId, source, pageable)

    override fun findExpiredTransactions(before: Instant, pageable: Pageable): Page<PointsTransaction> =
        springDataRepository.findExpiredTransactions(before, pageable)

    override fun sumPointsByMemberIdAndType(memberId: UUID, type: PointsTransactionType): Long =
        springDataRepository.sumPointsByMemberIdAndType(memberId, type)
}
