package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.MemberOnboarding
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface MemberOnboardingRepository {

    fun save(onboarding: MemberOnboarding): MemberOnboarding

    fun findById(id: UUID): Optional<MemberOnboarding>

    fun findByMemberId(memberId: UUID): Optional<MemberOnboarding>

    fun findIncomplete(pageable: Pageable): Page<MemberOnboarding>

    fun findIncompleteByAssignee(userId: UUID, pageable: Pageable): Page<MemberOnboarding>

    fun findByAssignedToUserId(userId: UUID, pageable: Pageable): Page<MemberOnboarding>

    fun findRecentlyStarted(since: Instant, pageable: Pageable): Page<MemberOnboarding>

    fun findOverdue(daysThreshold: Long, pageable: Pageable): Page<MemberOnboarding>

    fun countIncomplete(): Long

    fun countIncompleteByAssignee(userId: UUID): Long

    fun countOverdue(daysThreshold: Long): Long

    fun existsByMemberId(memberId: UUID): Boolean

    fun deleteByMemberId(memberId: UUID)
}
