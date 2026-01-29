package com.liyaqa.scheduling.domain.ports

import com.liyaqa.scheduling.domain.model.ClassPackBalanceStatus
import com.liyaqa.scheduling.domain.model.MemberClassPackBalance
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for MemberClassPackBalance entities.
 */
interface MemberClassPackBalanceRepository {
    fun save(balance: MemberClassPackBalance): MemberClassPackBalance
    fun saveAll(balances: Iterable<MemberClassPackBalance>): List<MemberClassPackBalance>
    fun findById(id: UUID): Optional<MemberClassPackBalance>

    // Find by member
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MemberClassPackBalance>
    fun findByMemberIdAndStatus(memberId: UUID, status: ClassPackBalanceStatus): List<MemberClassPackBalance>
    fun findActiveByMemberId(memberId: UUID): List<MemberClassPackBalance>

    // Find by pack
    fun findByClassPackId(classPackId: UUID, pageable: Pageable): Page<MemberClassPackBalance>

    // Find expiring balances (for scheduled tasks)
    fun findByStatusAndExpiresAtBefore(status: ClassPackBalanceStatus, before: Instant): List<MemberClassPackBalance>

    // Count queries
    fun countByMemberIdAndStatus(memberId: UUID, status: ClassPackBalanceStatus): Long
    fun sumClassesRemainingByMemberIdAndStatus(memberId: UUID, status: ClassPackBalanceStatus): Int

    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
}
