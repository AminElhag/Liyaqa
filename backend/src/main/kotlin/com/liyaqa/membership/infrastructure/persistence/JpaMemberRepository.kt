package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.ports.MemberRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface.
 */
interface SpringDataMemberRepository : JpaRepository<Member, UUID> {
    fun findByEmail(email: String): Optional<Member>
    fun existsByEmail(email: String): Boolean

    @Query("SELECT m FROM Member m WHERE m.email = :email AND m.tenantId = :tenantId")
    fun findByEmailAndTenantId(email: String, tenantId: UUID): Optional<Member>
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaMemberRepository(
    private val springDataRepository: SpringDataMemberRepository
) : MemberRepository {

    override fun save(member: Member): Member {
        return springDataRepository.save(member)
    }

    override fun findById(id: UUID): Optional<Member> {
        return springDataRepository.findById(id)
    }

    override fun findByEmail(email: String): Optional<Member> {
        return springDataRepository.findByEmail(email)
    }

    override fun findAll(pageable: Pageable): Page<Member> {
        return springDataRepository.findAll(pageable)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun existsByEmail(email: String): Boolean {
        return springDataRepository.existsByEmail(email)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }
}
