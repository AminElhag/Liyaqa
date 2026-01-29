package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.ActivityType
import com.liyaqa.membership.domain.model.MemberActivity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface MemberActivityRepository {

    fun save(activity: MemberActivity): MemberActivity

    fun saveAll(activities: List<MemberActivity>): List<MemberActivity>

    fun findById(id: UUID): Optional<MemberActivity>

    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MemberActivity>

    fun findByMemberIdAndTypes(
        memberId: UUID,
        types: List<ActivityType>,
        pageable: Pageable
    ): Page<MemberActivity>

    fun findByMemberIdAndDateRange(
        memberId: UUID,
        startTime: Instant,
        endTime: Instant,
        pageable: Pageable
    ): Page<MemberActivity>

    fun findByMemberIdAndTypesAndDateRange(
        memberId: UUID,
        types: List<ActivityType>,
        startTime: Instant,
        endTime: Instant,
        pageable: Pageable
    ): Page<MemberActivity>

    fun findByPerformedByUserId(userId: UUID, pageable: Pageable): Page<MemberActivity>

    fun countByMemberId(memberId: UUID): Long

    fun countByMemberIdAndType(memberId: UUID, type: ActivityType): Long

    fun findLatestByMemberIdAndType(memberId: UUID, type: ActivityType): Optional<MemberActivity>

    fun findRecentByMemberId(memberId: UUID, limit: Int): List<MemberActivity>

    fun deleteByMemberId(memberId: UUID)
}
