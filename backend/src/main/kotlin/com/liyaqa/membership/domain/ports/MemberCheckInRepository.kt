package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.CheckInMethod
import com.liyaqa.membership.domain.model.MemberCheckIn
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface MemberCheckInRepository {

    fun save(checkIn: MemberCheckIn): MemberCheckIn

    fun findById(id: UUID): Optional<MemberCheckIn>

    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MemberCheckIn>

    fun findByMemberIdAndDateRange(
        memberId: UUID,
        startTime: Instant,
        endTime: Instant,
        pageable: Pageable
    ): Page<MemberCheckIn>

    fun findTodayCheckIns(pageable: Pageable): Page<MemberCheckIn>

    fun findTodayCheckInsByDate(date: LocalDate, pageable: Pageable): Page<MemberCheckIn>

    fun findActiveCheckIn(memberId: UUID): Optional<MemberCheckIn>

    fun countByMemberId(memberId: UUID): Long

    fun countByMemberIdAndDateRange(memberId: UUID, startTime: Instant, endTime: Instant): Long

    fun countTodayCheckIns(): Long

    fun countCheckInsByDateRange(startTime: Instant, endTime: Instant): Long

    fun findLastCheckIn(memberId: UUID): Optional<MemberCheckIn>

    fun findCheckInsByMethod(method: CheckInMethod, startTime: Instant, endTime: Instant): List<MemberCheckIn>

    fun existsByMemberIdAndCheckInTimeBetween(memberId: UUID, startTime: Instant, endTime: Instant): Boolean

    fun getCheckInCountsByMember(memberIds: List<UUID>, startTime: Instant, endTime: Instant): Map<UUID, Long>

    fun getAverageVisitsPerWeek(memberId: UUID, weeks: Int): Double

    fun getCheckInHourDistribution(startTime: Instant, endTime: Instant): Map<Int, Long>

    fun getCheckInDayDistribution(startTime: Instant, endTime: Instant): Map<Int, Long>
}
