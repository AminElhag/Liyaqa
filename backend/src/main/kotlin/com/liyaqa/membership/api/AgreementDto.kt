package com.liyaqa.membership.api

import com.fasterxml.jackson.annotation.JsonProperty
import com.liyaqa.membership.domain.model.Agreement
import com.liyaqa.membership.domain.model.AgreementType
import com.liyaqa.membership.domain.model.MemberAgreement
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.LocalizedTextInput
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ==========================================
// Agreement DTOs
// ==========================================

data class CreateAgreementRequest(
    @field:Valid
    @field:NotNull(message = "Title is required")
    val title: LocalizedTextInput,

    @field:Valid
    @field:NotNull(message = "Content is required")
    val content: LocalizedTextInput,

    @field:NotNull(message = "Agreement type is required")
    val type: AgreementType,

    val isMandatory: Boolean = true,
    val sortOrder: Int = 0,
    val hasHealthQuestions: Boolean = false,
    val effectiveDate: LocalDate? = null
)

data class UpdateAgreementRequest(
    @field:Valid
    val title: LocalizedTextInput? = null,

    @field:Valid
    val content: LocalizedTextInput? = null,

    val isMandatory: Boolean? = null,
    val sortOrder: Int? = null,
    val hasHealthQuestions: Boolean? = null,
    val effectiveDate: LocalDate? = null
)

data class AgreementResponse(
    val id: UUID,
    val title: LocalizedText,
    val content: LocalizedText,
    val type: AgreementType,
    @get:JsonProperty("isMandatory")
    val isMandatory: Boolean,
    @get:JsonProperty("isActive")
    val isActive: Boolean,
    val agreementVersion: Int,
    val effectiveDate: LocalDate,
    val sortOrder: Int,
    val hasHealthQuestions: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(agreement: Agreement): AgreementResponse = AgreementResponse(
            id = agreement.id,
            title = agreement.title,
            content = agreement.content,
            type = agreement.type,
            isMandatory = agreement.isMandatory,
            isActive = agreement.isActive,
            agreementVersion = agreement.agreementVersion,
            effectiveDate = agreement.effectiveDate,
            sortOrder = agreement.sortOrder,
            hasHealthQuestions = agreement.hasHealthQuestions,
            createdAt = agreement.createdAt,
            updatedAt = agreement.updatedAt
        )
    }
}

data class AgreementSummaryResponse(
    val id: UUID,
    val title: LocalizedText,
    val type: AgreementType,
    @get:JsonProperty("isMandatory")
    val isMandatory: Boolean,
    val agreementVersion: Int
) {
    companion object {
        fun from(agreement: Agreement): AgreementSummaryResponse = AgreementSummaryResponse(
            id = agreement.id,
            title = agreement.title,
            type = agreement.type,
            isMandatory = agreement.isMandatory,
            agreementVersion = agreement.agreementVersion
        )
    }
}

// ==========================================
// Member Agreement DTOs
// ==========================================

data class SignAgreementRequest(
    @field:NotNull(message = "Agreement ID is required")
    val agreementId: UUID,

    val ipAddress: String? = null,
    val userAgent: String? = null,
    val signatureData: String? = null,
    val healthData: String? = null
)

data class SignAgreementsRequest(
    @field:NotNull(message = "Agreement IDs are required")
    val agreementIds: List<UUID>,

    val ipAddress: String? = null,
    val userAgent: String? = null,
    val signatureData: String? = null,
    val healthData: String? = null
)

// DTO for signing agreement when agreementId is in the path
data class SignAgreementDetailsRequest(
    val ipAddress: String? = null,
    val userAgent: String? = null,
    val signatureData: String? = null,
    val healthData: String? = null
)

data class MemberAgreementResponse(
    val id: UUID,
    val memberId: UUID,
    val agreementId: UUID,
    val agreementVersion: Int,
    val signedAt: Instant,
    val agreement: AgreementSummaryResponse?
) {
    companion object {
        fun from(memberAgreement: MemberAgreement, agreement: Agreement? = null): MemberAgreementResponse = MemberAgreementResponse(
            id = memberAgreement.id,
            memberId = memberAgreement.memberId,
            agreementId = memberAgreement.agreementId,
            agreementVersion = memberAgreement.agreementVersion,
            signedAt = memberAgreement.signedAt,
            agreement = agreement?.let { AgreementSummaryResponse.from(it) }
        )
    }
}

data class MemberAgreementStatusResponse(
    val memberId: UUID,
    val signedAgreements: List<MemberAgreementResponse>,
    val pendingMandatoryAgreements: List<AgreementSummaryResponse>,
    val allMandatorySigned: Boolean
)
