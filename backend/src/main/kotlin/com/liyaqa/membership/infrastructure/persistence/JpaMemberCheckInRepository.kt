package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.CheckInMethod
import com.liyaqa.membership.domain.model.MemberCheckIn
import com.liyaqa.membership.domain.ports.MemberCheckInRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.Optional
import java.util.UUID

interface SpringDataMemberCheckInRepository : JpaRepository<MemberCheckIn, UUID> {

    fun findByMemberIdOrderByCheckInTimeDesc(memberId: UUID, pageable: Pageable): Page<MemberCheckIn>

    @Query("""
        SELECT c FROM MemberCheckIn c
        WHERE c.memberId = :memberId
        AND c.checkInTime >= :startTime
        AND c.checkInTime <= :endTime
        ORDER BY c.checkInTime DESC
    """)
    fun findByMemberIdAndDateRange(
        @Param("memberId") memberId: UUID,
        @Param("startTime") startTime: Instant,
        @Param("endTime") endTime: Instant,
        pageable: Pageable
    ): Page<MemberCheckIn>

    @Query("""
        SELECT c FROM MemberCheckIn c
        WHERE c.checkInTime >= :startTime
        AND c.checkInTime < :endTime
        ORDER BY c.checkInTime DESC
    """)
    fun findByDateRange(
        @Param("startTime") startTime: Instant,
        @Param("endTime") endTime: Instant,
        pageable: Pageable
    ): Page<MemberCheckIn>

    @Query("""
        SELECT c FROM MemberCheckIn c
        WHERE c.memberId = :memberId
        AND c.checkOutTime IS NULL
        ORDER BY c.checkInTime DESC
    """)
    fun findActiveCheckIn(@Param("memberId") memberId: UUID): Optional<MemberCheckIn>

    fun countByMemberId(memberId: UUID): Long

    @Query("""
        SELECT COUNT(c) FROM MemberCheckIn c
        WHERE c.memberId = :memberId
        AND c.checkInTime >= :startTime
        AND c.checkInTime <= :endTime
    """)
    fun countByMemberIdAndDateRange(
        @Param("memberId") memberId: UUID,
        @Param("startTime") startTime: Instant,
        @Param("endTime") endTime: Instant
    ): Long

    @Query("SELECT COUNT(c) FROM MemberCheckIn c WHERE c.checkInTime >= :startTime AND c.checkInTime < :endTime")
    fun countByDateRange(@Param("startTime") startTime: Instant, @Param("endTime") endTime: Instant): Long

    @Query("SELECT c FROM MemberCheckIn c WHERE c.memberId = :memberId ORDER BY c.checkInTime DESC LIMIT 1")
    fun findLastCheckIn(@Param("memberId") memberId: UUID): Optional<MemberCheckIn>

    @Query("""
        SELECT c FROM MemberCheckIn c
        WHERE c.method = :method
        AND c.checkInTime >= :startTime
        AND c.checkInTime <= :endTime
    """)
    fun findByMethod(
        @Param("method") method: CheckInMethod,
        @Param("startTime") startTime: Instant,
        @Param("endTime") endTime: Instant
    ): List<MemberCheckIn>

    fun existsByMemberIdAndCheckInTimeBetween(memberId: UUID, startTime: Instant, endTime: Instant): Boolean

    @Query("""
        SELECT c.memberId as memberId, COUNT(c) as count
        FROM MemberCheckIn c
        WHERE c.memberId IN :memberIds
        AND c.checkInTime >= :startTime
        AND c.checkInTime <= :endTime
        GROUP BY c.memberId
    """)
    fun getCheckInCountsByMembers(
        @Param("memberIds") memberIds: List<UUID>,
        @Param("startTime") startTime: Instant,
        @Param("endTime") endTime: Instant
    ): List<CheckInCountProjection>

    @Query(value = """
        SELECT EXTRACT(HOUR FROM c.check_in_time) as hour, COUNT(*) as count
        FROM member_check_ins c
        WHERE c.check_in_time >= :startTime
        AND c.check_in_time <= :endTime
        GROUP BY EXTRACT(HOUR FROM c.check_in_time)
    """, nativeQuery = true)
    fun getHourDistribution(
        @Param("startTime") startTime: Instant,
        @Param("endTime") endTime: Instant
    ): List<HourDistributionProjection>

    @Query(value = """
        SELECT EXTRACT(DOW FROM c.check_in_time) as dayOfWeek, COUNT(*) as count
        FROM member_check_ins c
        WHERE c.check_in_time >= :startTime
        AND c.check_in_time <= :endTime
        GROUP BY EXTRACT(DOW FROM c.check_in_time)
    """, nativeQuery = true)
    fun getDayDistribution(
        @Param("startTime") startTime: Instant,
        @Param("endTime") endTime: Instant
    ): List<DayDistributionProjection>
}

interface CheckInCountProjection {
    val memberId: UUID
    val count: Long
}

interface HourDistributionProjection {
    val hour: Int
    val count: Long
}

interface DayDistributionProjection {
    val dayOfWeek: Int
    val count: Long
}

@Repository
class JpaMemberCheckInRepository(
    private val springDataRepository: SpringDataMemberCheckInRepository
) : MemberCheckInRepository {

    override fun save(checkIn: MemberCheckIn): MemberCheckIn {
        return springDataRepository.save(checkIn)
    }

    override fun findById(id: UUID): Optional<MemberCheckIn> {
        return springDataRepository.findById(id)
    }

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MemberCheckIn> {
        return springDataRepository.findByMemberIdOrderByCheckInTimeDesc(memberId, pageable)
    }

    override fun findByMemberIdAndDateRange(
        memberId: UUID,
        startTime: Instant,
        endTime: Instant,
        pageable: Pageable
    ): Page<MemberCheckIn> {
        return springDataRepository.findByMemberIdAndDateRange(memberId, startTime, endTime, pageable)
    }

    override fun findTodayCheckIns(pageable: Pageable): Page<MemberCheckIn> {
        val today = LocalDate.now()
        val startOfDay = today.atStartOfDay().toInstant(ZoneOffset.UTC)
        val endOfDay = today.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        return springDataRepository.findByDateRange(startOfDay, endOfDay, pageable)
    }

    override fun findTodayCheckInsByDate(date: LocalDate, pageable: Pageable): Page<MemberCheckIn> {
        val startOfDay = date.atStartOfDay().toInstant(ZoneOffset.UTC)
        val endOfDay = date.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        return springDataRepository.findByDateRange(startOfDay, endOfDay, pageable)
    }

    override fun findActiveCheckIn(memberId: UUID): Optional<MemberCheckIn> {
        return springDataRepository.findActiveCheckIn(memberId)
    }

    override fun countByMemberId(memberId: UUID): Long {
        return springDataRepository.countByMemberId(memberId)
    }

    override fun countByMemberIdAndDateRange(memberId: UUID, startTime: Instant, endTime: Instant): Long {
        return springDataRepository.countByMemberIdAndDateRange(memberId, startTime, endTime)
    }

    override fun countTodayCheckIns(): Long {
        val today = LocalDate.now()
        val startOfDay = today.atStartOfDay().toInstant(ZoneOffset.UTC)
        val endOfDay = today.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        return springDataRepository.countByDateRange(startOfDay, endOfDay)
    }

    override fun countCheckInsByDateRange(startTime: Instant, endTime: Instant): Long {
        return springDataRepository.countByDateRange(startTime, endTime)
    }

    override fun findLastCheckIn(memberId: UUID): Optional<MemberCheckIn> {
        return springDataRepository.findLastCheckIn(memberId)
    }

    override fun findCheckInsByMethod(method: CheckInMethod, startTime: Instant, endTime: Instant): List<MemberCheckIn> {
        return springDataRepository.findByMethod(method, startTime, endTime)
    }

    override fun existsByMemberIdAndCheckInTimeBetween(memberId: UUID, startTime: Instant, endTime: Instant): Boolean {
        return springDataRepository.existsByMemberIdAndCheckInTimeBetween(memberId, startTime, endTime)
    }

    override fun getCheckInCountsByMember(memberIds: List<UUID>, startTime: Instant, endTime: Instant): Map<UUID, Long> {
        if (memberIds.isEmpty()) return emptyMap()
        return springDataRepository.getCheckInCountsByMembers(memberIds, startTime, endTime)
            .associate { it.memberId to it.count }
    }

    override fun getAverageVisitsPerWeek(memberId: UUID, weeks: Int): Double {
        val endTime = Instant.now()
        val startTime = endTime.minus(java.time.Duration.ofDays(weeks.toLong() * 7))
        val totalVisits = springDataRepository.countByMemberIdAndDateRange(memberId, startTime, endTime)
        return if (weeks > 0) totalVisits.toDouble() / weeks else 0.0
    }

    override fun getCheckInHourDistribution(startTime: Instant, endTime: Instant): Map<Int, Long> {
        return springDataRepository.getHourDistribution(startTime, endTime)
            .associate { it.hour to it.count }
    }

    override fun getCheckInDayDistribution(startTime: Instant, endTime: Instant): Map<Int, Long> {
        return springDataRepository.getDayDistribution(startTime, endTime)
            .associate { it.dayOfWeek to it.count }
    }
}
