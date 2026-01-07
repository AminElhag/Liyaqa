package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.Member
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
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
    fun existsByEmail(email: String): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
}
