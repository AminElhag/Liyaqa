package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.MemberAgreement
import java.util.Optional
import java.util.UUID

/**
 * Port (interface) for member agreement persistence operations.
 */
interface MemberAgreementRepository {
    fun save(memberAgreement: MemberAgreement): MemberAgreement
    fun findById(id: UUID): Optional<MemberAgreement>
    fun findByMemberId(memberId: UUID): List<MemberAgreement>
    fun findByMemberIdAndAgreementId(memberId: UUID, agreementId: UUID): Optional<MemberAgreement>
    fun existsByMemberIdAndAgreementId(memberId: UUID, agreementId: UUID): Boolean
    fun deleteByMemberId(memberId: UUID)
    fun countByMemberId(memberId: UUID): Long
}
