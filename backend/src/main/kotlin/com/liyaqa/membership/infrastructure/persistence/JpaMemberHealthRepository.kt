package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.MemberHealth
import com.liyaqa.membership.domain.ports.MemberHealthRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for MemberHealth.
 */
interface SpringDataMemberHealthRepository : JpaRepository<MemberHealth, UUID> {
    fun findByMemberId(memberId: UUID): Optional<MemberHealth>
    fun existsByMemberId(memberId: UUID): Boolean
    fun deleteByMemberId(memberId: UUID)
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaMemberHealthRepository(
    private val springDataRepository: SpringDataMemberHealthRepository
) : MemberHealthRepository {

    override fun save(memberHealth: MemberHealth): MemberHealth {
        return springDataRepository.save(memberHealth)
    }

    override fun findById(id: UUID): Optional<MemberHealth> {
        return springDataRepository.findById(id)
    }

    override fun findByMemberId(memberId: UUID): Optional<MemberHealth> {
        return springDataRepository.findByMemberId(memberId)
    }

    override fun existsByMemberId(memberId: UUID): Boolean {
        return springDataRepository.existsByMemberId(memberId)
    }

    override fun deleteByMemberId(memberId: UUID) {
        springDataRepository.deleteByMemberId(memberId)
    }
}
