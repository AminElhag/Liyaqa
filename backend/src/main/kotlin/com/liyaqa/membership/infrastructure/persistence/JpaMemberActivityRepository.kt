package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.ActivityType
import com.liyaqa.membership.domain.model.MemberActivity
import com.liyaqa.membership.domain.ports.MemberActivityRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataMemberActivityRepository : JpaRepository<MemberActivity, UUID> {

    fun findByMemberIdOrderByCreatedAtDesc(memberId: UUID, pageable: Pageable): Page<MemberActivity>

    @Query("""
        SELECT a FROM MemberActivity a
        WHERE a.memberId = :memberId
        AND a.activityType IN :types
        ORDER BY a.createdAt DESC
    """)
    fun findByMemberIdAndTypes(
        @Param("memberId") memberId: UUID,
        @Param("types") types: List<ActivityType>,
        pageable: Pageable
    ): Page<MemberActivity>

    @Query("""
        SELECT a FROM MemberActivity a
        WHERE a.memberId = :memberId
        AND a.createdAt >= :startTime
        AND a.createdAt <= :endTime
        ORDER BY a.createdAt DESC
    """)
    fun findByMemberIdAndDateRange(
        @Param("memberId") memberId: UUID,
        @Param("startTime") startTime: Instant,
        @Param("endTime") endTime: Instant,
        pageable: Pageable
    ): Page<MemberActivity>

    @Query("""
        SELECT a FROM MemberActivity a
        WHERE a.memberId = :memberId
        AND a.activityType IN :types
        AND a.createdAt >= :startTime
        AND a.createdAt <= :endTime
        ORDER BY a.createdAt DESC
    """)
    fun findByMemberIdAndTypesAndDateRange(
        @Param("memberId") memberId: UUID,
        @Param("types") types: List<ActivityType>,
        @Param("startTime") startTime: Instant,
        @Param("endTime") endTime: Instant,
        pageable: Pageable
    ): Page<MemberActivity>

    fun findByPerformedByUserIdOrderByCreatedAtDesc(userId: UUID, pageable: Pageable): Page<MemberActivity>

    fun countByMemberId(memberId: UUID): Long

    fun countByMemberIdAndActivityType(memberId: UUID, activityType: ActivityType): Long

    @Query("SELECT a FROM MemberActivity a WHERE a.memberId = :memberId AND a.activityType = :type ORDER BY a.createdAt DESC LIMIT 1")
    fun findLatestByMemberIdAndType(
        @Param("memberId") memberId: UUID,
        @Param("type") type: ActivityType
    ): Optional<MemberActivity>

    @Modifying
    @Query("DELETE FROM MemberActivity a WHERE a.memberId = :memberId")
    fun deleteByMemberId(@Param("memberId") memberId: UUID)
}

@Repository
class JpaMemberActivityRepository(
    private val springDataRepository: SpringDataMemberActivityRepository
) : MemberActivityRepository {

    override fun save(activity: MemberActivity): MemberActivity {
        return springDataRepository.save(activity)
    }

    override fun saveAll(activities: List<MemberActivity>): List<MemberActivity> {
        return springDataRepository.saveAll(activities)
    }

    override fun findById(id: UUID): Optional<MemberActivity> {
        return springDataRepository.findById(id)
    }

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MemberActivity> {
        return springDataRepository.findByMemberIdOrderByCreatedAtDesc(memberId, pageable)
    }

    override fun findByMemberIdAndTypes(
        memberId: UUID,
        types: List<ActivityType>,
        pageable: Pageable
    ): Page<MemberActivity> {
        return springDataRepository.findByMemberIdAndTypes(memberId, types, pageable)
    }

    override fun findByMemberIdAndDateRange(
        memberId: UUID,
        startTime: Instant,
        endTime: Instant,
        pageable: Pageable
    ): Page<MemberActivity> {
        return springDataRepository.findByMemberIdAndDateRange(memberId, startTime, endTime, pageable)
    }

    override fun findByMemberIdAndTypesAndDateRange(
        memberId: UUID,
        types: List<ActivityType>,
        startTime: Instant,
        endTime: Instant,
        pageable: Pageable
    ): Page<MemberActivity> {
        return springDataRepository.findByMemberIdAndTypesAndDateRange(memberId, types, startTime, endTime, pageable)
    }

    override fun findByPerformedByUserId(userId: UUID, pageable: Pageable): Page<MemberActivity> {
        return springDataRepository.findByPerformedByUserIdOrderByCreatedAtDesc(userId, pageable)
    }

    override fun countByMemberId(memberId: UUID): Long {
        return springDataRepository.countByMemberId(memberId)
    }

    override fun countByMemberIdAndType(memberId: UUID, type: ActivityType): Long {
        return springDataRepository.countByMemberIdAndActivityType(memberId, type)
    }

    override fun findLatestByMemberIdAndType(memberId: UUID, type: ActivityType): Optional<MemberActivity> {
        return springDataRepository.findLatestByMemberIdAndType(memberId, type)
    }

    override fun findRecentByMemberId(memberId: UUID, limit: Int): List<MemberActivity> {
        val pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        return springDataRepository.findByMemberIdOrderByCreatedAtDesc(memberId, pageable).content
    }

    override fun deleteByMemberId(memberId: UUID) {
        springDataRepository.deleteByMemberId(memberId)
    }
}
