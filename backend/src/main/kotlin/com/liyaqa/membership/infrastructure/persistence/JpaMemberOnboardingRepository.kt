package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.MemberOnboarding
import com.liyaqa.membership.domain.ports.MemberOnboardingRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataMemberOnboardingRepository : JpaRepository<MemberOnboarding, UUID> {

    fun findByMemberId(memberId: UUID): Optional<MemberOnboarding>

    @Query("SELECT o FROM MemberOnboarding o WHERE o.completedAt IS NULL ORDER BY o.startedAt DESC")
    fun findIncomplete(pageable: Pageable): Page<MemberOnboarding>

    @Query("""
        SELECT o FROM MemberOnboarding o
        WHERE o.assignedToUserId = :userId AND o.completedAt IS NULL
        ORDER BY o.startedAt DESC
    """)
    fun findIncompleteByAssignee(@Param("userId") userId: UUID, pageable: Pageable): Page<MemberOnboarding>

    fun findByAssignedToUserIdOrderByStartedAtDesc(userId: UUID, pageable: Pageable): Page<MemberOnboarding>

    @Query("SELECT o FROM MemberOnboarding o WHERE o.startedAt >= :since ORDER BY o.startedAt DESC")
    fun findRecentlyStarted(@Param("since") since: Instant, pageable: Pageable): Page<MemberOnboarding>

    @Query("""
        SELECT o FROM MemberOnboarding o
        WHERE o.completedAt IS NULL
        AND o.startedAt < :threshold
        ORDER BY o.startedAt ASC
    """)
    fun findOverdue(@Param("threshold") threshold: Instant, pageable: Pageable): Page<MemberOnboarding>

    @Query("SELECT COUNT(o) FROM MemberOnboarding o WHERE o.completedAt IS NULL")
    fun countIncomplete(): Long

    @Query("SELECT COUNT(o) FROM MemberOnboarding o WHERE o.assignedToUserId = :userId AND o.completedAt IS NULL")
    fun countIncompleteByAssignee(@Param("userId") userId: UUID): Long

    @Query("SELECT COUNT(o) FROM MemberOnboarding o WHERE o.completedAt IS NULL AND o.startedAt < :threshold")
    fun countOverdue(@Param("threshold") threshold: Instant): Long

    fun existsByMemberId(memberId: UUID): Boolean

    @Modifying
    @Query("DELETE FROM MemberOnboarding o WHERE o.memberId = :memberId")
    fun deleteByMemberId(@Param("memberId") memberId: UUID)
}

@Repository
class JpaMemberOnboardingRepository(
    private val springDataRepository: SpringDataMemberOnboardingRepository
) : MemberOnboardingRepository {

    override fun save(onboarding: MemberOnboarding): MemberOnboarding {
        return springDataRepository.save(onboarding)
    }

    override fun findById(id: UUID): Optional<MemberOnboarding> {
        return springDataRepository.findById(id)
    }

    override fun findByMemberId(memberId: UUID): Optional<MemberOnboarding> {
        return springDataRepository.findByMemberId(memberId)
    }

    override fun findIncomplete(pageable: Pageable): Page<MemberOnboarding> {
        return springDataRepository.findIncomplete(pageable)
    }

    override fun findIncompleteByAssignee(userId: UUID, pageable: Pageable): Page<MemberOnboarding> {
        return springDataRepository.findIncompleteByAssignee(userId, pageable)
    }

    override fun findByAssignedToUserId(userId: UUID, pageable: Pageable): Page<MemberOnboarding> {
        return springDataRepository.findByAssignedToUserIdOrderByStartedAtDesc(userId, pageable)
    }

    override fun findRecentlyStarted(since: Instant, pageable: Pageable): Page<MemberOnboarding> {
        return springDataRepository.findRecentlyStarted(since, pageable)
    }

    override fun findOverdue(daysThreshold: Long, pageable: Pageable): Page<MemberOnboarding> {
        val threshold = Instant.now().minus(java.time.Duration.ofDays(daysThreshold))
        return springDataRepository.findOverdue(threshold, pageable)
    }

    override fun countIncomplete(): Long {
        return springDataRepository.countIncomplete()
    }

    override fun countIncompleteByAssignee(userId: UUID): Long {
        return springDataRepository.countIncompleteByAssignee(userId)
    }

    override fun countOverdue(daysThreshold: Long): Long {
        val threshold = Instant.now().minus(java.time.Duration.ofDays(daysThreshold))
        return springDataRepository.countOverdue(threshold)
    }

    override fun existsByMemberId(memberId: UUID): Boolean {
        return springDataRepository.existsByMemberId(memberId)
    }

    override fun deleteByMemberId(memberId: UUID) {
        springDataRepository.deleteByMemberId(memberId)
    }
}
