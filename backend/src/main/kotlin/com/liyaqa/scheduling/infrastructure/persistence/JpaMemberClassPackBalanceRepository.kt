package com.liyaqa.scheduling.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.ClassPackBalanceStatus
import com.liyaqa.scheduling.domain.model.MemberClassPackBalance
import com.liyaqa.scheduling.domain.ports.MemberClassPackBalanceRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataMemberClassPackBalanceRepository : JpaRepository<MemberClassPackBalance, UUID> {
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MemberClassPackBalance>
    fun findByMemberIdAndStatus(memberId: UUID, status: ClassPackBalanceStatus): List<MemberClassPackBalance>

    @Query("""
        SELECT b FROM MemberClassPackBalance b
        WHERE b.memberId = :memberId
        AND b.status = 'ACTIVE'
        AND b.classesRemaining > 0
        AND (b.expiresAt IS NULL OR b.expiresAt > :now)
        ORDER BY b.expiresAt ASC NULLS LAST, b.purchasedAt ASC
    """)
    fun findActiveByMemberId(@Param("memberId") memberId: UUID, @Param("now") now: Instant): List<MemberClassPackBalance>

    fun findByClassPackId(classPackId: UUID, pageable: Pageable): Page<MemberClassPackBalance>

    fun findByStatusAndExpiresAtBefore(status: ClassPackBalanceStatus, before: Instant): List<MemberClassPackBalance>

    fun countByMemberIdAndStatus(memberId: UUID, status: ClassPackBalanceStatus): Long

    @Query("""
        SELECT COALESCE(SUM(b.classesRemaining), 0) FROM MemberClassPackBalance b
        WHERE b.memberId = :memberId AND b.status = :status
    """)
    fun sumClassesRemainingByMemberIdAndStatus(
        @Param("memberId") memberId: UUID,
        @Param("status") status: ClassPackBalanceStatus
    ): Int
}

@Repository
class JpaMemberClassPackBalanceRepository(
    private val springDataRepository: SpringDataMemberClassPackBalanceRepository
) : MemberClassPackBalanceRepository {

    override fun save(balance: MemberClassPackBalance): MemberClassPackBalance =
        springDataRepository.save(balance)

    override fun saveAll(balances: Iterable<MemberClassPackBalance>): List<MemberClassPackBalance> =
        springDataRepository.saveAll(balances)

    override fun findById(id: UUID): Optional<MemberClassPackBalance> =
        springDataRepository.findById(id)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MemberClassPackBalance> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findByMemberIdAndStatus(memberId: UUID, status: ClassPackBalanceStatus): List<MemberClassPackBalance> =
        springDataRepository.findByMemberIdAndStatus(memberId, status)

    override fun findActiveByMemberId(memberId: UUID): List<MemberClassPackBalance> =
        springDataRepository.findActiveByMemberId(memberId, Instant.now())

    override fun findByClassPackId(classPackId: UUID, pageable: Pageable): Page<MemberClassPackBalance> =
        springDataRepository.findByClassPackId(classPackId, pageable)

    override fun findByStatusAndExpiresAtBefore(
        status: ClassPackBalanceStatus,
        before: Instant
    ): List<MemberClassPackBalance> =
        springDataRepository.findByStatusAndExpiresAtBefore(status, before)

    override fun countByMemberIdAndStatus(memberId: UUID, status: ClassPackBalanceStatus): Long =
        springDataRepository.countByMemberIdAndStatus(memberId, status)

    override fun sumClassesRemainingByMemberIdAndStatus(memberId: UUID, status: ClassPackBalanceStatus): Int =
        springDataRepository.sumClassesRemainingByMemberIdAndStatus(memberId, status)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)
}
