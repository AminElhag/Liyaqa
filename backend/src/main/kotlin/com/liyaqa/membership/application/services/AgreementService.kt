package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.Agreement
import com.liyaqa.membership.domain.model.AgreementType
import com.liyaqa.membership.domain.model.MemberAgreement
import com.liyaqa.membership.domain.ports.AgreementRepository
import com.liyaqa.membership.domain.ports.MemberAgreementRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.shared.domain.LocalizedText
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class AgreementService(
    private val agreementRepository: AgreementRepository,
    private val memberAgreementRepository: MemberAgreementRepository,
    private val memberRepository: MemberRepository
) {

    // ==========================================
    // Agreement Management
    // ==========================================

    fun createAgreement(
        title: LocalizedText,
        content: LocalizedText,
        type: AgreementType,
        isMandatory: Boolean = true,
        sortOrder: Int = 0,
        hasHealthQuestions: Boolean = false,
        effectiveDate: LocalDate? = null
    ): Agreement {
        val agreement = Agreement(
            title = title,
            content = content,
            type = type,
            isMandatory = isMandatory,
            sortOrder = sortOrder,
            hasHealthQuestions = hasHealthQuestions,
            effectiveDate = effectiveDate ?: LocalDate.now()
        )
        return agreementRepository.save(agreement)
    }

    @Transactional(readOnly = true)
    fun getAgreement(id: UUID): Agreement {
        return agreementRepository.findById(id)
            .orElseThrow { NoSuchElementException("Agreement not found: $id") }
    }

    @Transactional(readOnly = true)
    fun getAllAgreements(pageable: Pageable): Page<Agreement> {
        return agreementRepository.findAll(pageable)
    }

    @Transactional(readOnly = true)
    fun getActiveAgreements(pageable: Pageable): Page<Agreement> {
        return agreementRepository.findAllActive(pageable)
    }

    @Transactional(readOnly = true)
    fun getMandatoryAgreements(): List<Agreement> {
        return agreementRepository.findAllMandatory()
    }

    @Transactional(readOnly = true)
    fun getAgreementsByType(type: AgreementType): List<Agreement> {
        return agreementRepository.findByType(type)
    }

    fun updateAgreement(
        id: UUID,
        title: LocalizedText?,
        content: LocalizedText?,
        isMandatory: Boolean?,
        sortOrder: Int?,
        hasHealthQuestions: Boolean?,
        effectiveDate: LocalDate?
    ): Agreement {
        val agreement = getAgreement(id)

        title?.let { agreement.title = it }
        content?.let {
            agreement.content = it
            agreement.incrementVersion()
        }
        isMandatory?.let { agreement.isMandatory = it }
        sortOrder?.let { agreement.sortOrder = it }
        hasHealthQuestions?.let { agreement.hasHealthQuestions = it }
        effectiveDate?.let { agreement.effectiveDate = it }

        return agreementRepository.save(agreement)
    }

    fun activateAgreement(id: UUID): Agreement {
        val agreement = getAgreement(id)
        agreement.activate()
        return agreementRepository.save(agreement)
    }

    fun deactivateAgreement(id: UUID): Agreement {
        val agreement = getAgreement(id)
        agreement.deactivate()
        return agreementRepository.save(agreement)
    }

    // ==========================================
    // Member Agreement Signing
    // ==========================================

    fun signAgreement(
        memberId: UUID,
        agreementId: UUID,
        ipAddress: String? = null,
        userAgent: String? = null,
        signatureData: String? = null,
        healthData: String? = null
    ): MemberAgreement {
        // Verify member exists
        if (!memberRepository.existsById(memberId)) {
            throw NoSuchElementException("Member not found: $memberId")
        }

        // Get agreement and verify it's active
        val agreement = getAgreement(agreementId)
        if (!agreement.isActive) {
            throw IllegalStateException("Agreement is not active: $agreementId")
        }

        // Check if already signed (same version)
        val existing = memberAgreementRepository.findByMemberIdAndAgreementId(memberId, agreementId)
        if (existing.isPresent && existing.get().agreementVersion == agreement.agreementVersion) {
            return existing.get() // Already signed this version
        }

        val memberAgreement = MemberAgreement(
            memberId = memberId,
            agreementId = agreementId,
            agreementVersion = agreement.agreementVersion,
            signedAt = Instant.now(),
            ipAddress = ipAddress,
            userAgent = userAgent,
            signatureData = signatureData,
            healthData = healthData
        )

        return memberAgreementRepository.save(memberAgreement)
    }

    fun signAgreements(
        memberId: UUID,
        agreementIds: List<UUID>,
        ipAddress: String? = null,
        userAgent: String? = null,
        signatureData: String? = null,
        healthData: String? = null
    ): List<MemberAgreement> {
        return agreementIds.map { agreementId ->
            signAgreement(
                memberId = memberId,
                agreementId = agreementId,
                ipAddress = ipAddress,
                userAgent = userAgent,
                signatureData = signatureData,
                healthData = if (getAgreement(agreementId).hasHealthQuestions) healthData else null
            )
        }
    }

    @Transactional(readOnly = true)
    fun getMemberAgreements(memberId: UUID): List<MemberAgreement> {
        return memberAgreementRepository.findByMemberId(memberId)
    }

    @Transactional(readOnly = true)
    fun hasMemberSignedAgreement(memberId: UUID, agreementId: UUID): Boolean {
        return memberAgreementRepository.existsByMemberIdAndAgreementId(memberId, agreementId)
    }

    @Transactional(readOnly = true)
    fun hasSignedAllMandatoryAgreements(memberId: UUID): Boolean {
        val mandatoryAgreements = getMandatoryAgreements()
        return mandatoryAgreements.all { agreement ->
            memberAgreementRepository.existsByMemberIdAndAgreementId(memberId, agreement.id)
        }
    }

    @Transactional(readOnly = true)
    fun getPendingMandatoryAgreements(memberId: UUID): List<Agreement> {
        val mandatoryAgreements = getMandatoryAgreements()
        val signedAgreementIds = memberAgreementRepository.findByMemberId(memberId)
            .map { it.agreementId }
            .toSet()

        return mandatoryAgreements.filter { it.id !in signedAgreementIds }
    }
}
