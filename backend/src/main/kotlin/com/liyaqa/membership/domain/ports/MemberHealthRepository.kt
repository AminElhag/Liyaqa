package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.MemberHealth
import java.util.Optional
import java.util.UUID

/**
 * Port (interface) for member health information persistence operations.
 */
interface MemberHealthRepository {
    fun save(memberHealth: MemberHealth): MemberHealth
    fun findById(id: UUID): Optional<MemberHealth>
    fun findByMemberId(memberId: UUID): Optional<MemberHealth>
    fun existsByMemberId(memberId: UUID): Boolean
    fun deleteByMemberId(memberId: UUID)
}
