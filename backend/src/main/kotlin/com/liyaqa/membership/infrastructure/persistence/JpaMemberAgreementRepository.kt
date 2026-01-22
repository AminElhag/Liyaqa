package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.MemberAgreement
import com.liyaqa.membership.domain.ports.MemberAgreementRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for MemberAgreement.
 */
interface SpringDataMemberAgreementRepository : JpaRepository<MemberAgreement, UUID> {
    fun findByMemberId(memberId: UUID): List<MemberAgreement>
    fun findByMemberIdAndAgreementId(memberId: UUID, agreementId: UUID): Optional<MemberAgreement>
    fun existsByMemberIdAndAgreementId(memberId: UUID, agreementId: UUID): Boolean
    fun deleteByMemberId(memberId: UUID)
    fun countByMemberId(memberId: UUID): Long
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaMemberAgreementRepository(
    private val springDataRepository: SpringDataMemberAgreementRepository
) : MemberAgreementRepository {

    override fun save(memberAgreement: MemberAgreement): MemberAgreement {
        return springDataRepository.save(memberAgreement)
    }

    override fun findById(id: UUID): Optional<MemberAgreement> {
        return springDataRepository.findById(id)
    }

    override fun findByMemberId(memberId: UUID): List<MemberAgreement> {
        return springDataRepository.findByMemberId(memberId)
    }

    override fun findByMemberIdAndAgreementId(memberId: UUID, agreementId: UUID): Optional<MemberAgreement> {
        return springDataRepository.findByMemberIdAndAgreementId(memberId, agreementId)
    }

    override fun existsByMemberIdAndAgreementId(memberId: UUID, agreementId: UUID): Boolean {
        return springDataRepository.existsByMemberIdAndAgreementId(memberId, agreementId)
    }

    override fun deleteByMemberId(memberId: UUID) {
        springDataRepository.deleteByMemberId(memberId)
    }

    override fun countByMemberId(memberId: UUID): Long {
        return springDataRepository.countByMemberId(memberId)
    }
}
