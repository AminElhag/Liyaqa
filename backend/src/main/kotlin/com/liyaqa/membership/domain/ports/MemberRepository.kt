package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Port (interface) for member persistence operations.
 * This is a domain-level abstraction - implementations are in the infrastructure layer.
 */
interface MemberRepository {
    fun save(member: Member): Member
    fun findById(id: UUID): Optional<Member>
    fun findByEmail(email: String): Optional<Member>
    fun findAll(pageable: Pageable): Page<Member>
    fun existsById(id: UUID): Boolean
    fun existsByEmail(email: String): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun findByUserId(userId: UUID): Optional<Member>

    /**
     * Search members with various filters.
     * @param search Search term for name or email (case-insensitive, partial match)
     * @param status Filter by member status
     * @param joinedAfter Filter members who joined after this date
     * @param joinedBefore Filter members who joined before this date
     */
    fun search(
        search: String?,
        status: MemberStatus?,
        joinedAfter: LocalDate?,
        joinedBefore: LocalDate?,
        pageable: Pageable
    ): Page<Member>

    /**
     * Find all members by a list of IDs in a single query.
     * Used for bulk operations to avoid N+1 queries.
     */
    fun findAllByIds(ids: List<UUID>): List<Member>
}
