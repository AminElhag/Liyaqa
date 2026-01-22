package com.liyaqa.membership.api

import com.liyaqa.membership.domain.model.Address
import com.liyaqa.membership.domain.model.BloodType
import com.liyaqa.membership.domain.model.Gender
import com.liyaqa.membership.domain.model.Language
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.shared.domain.FlexibleLocalizedTextInput
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.LocalizedTextInput
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateMemberRequest(
    @field:Valid
    val firstName: FlexibleLocalizedTextInput,

    @field:Valid
    val lastName: FlexibleLocalizedTextInput,

    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    val email: String,

    val phone: String? = null,
    val dateOfBirth: LocalDate? = null,
    val gender: Gender? = null,
    val nationality: String? = null,
    val nationalId: String? = null,
    val address: LocalizedTextInput? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val notes: LocalizedTextInput? = null,
    val registrationNotes: String? = null,
    val preferredLanguage: Language = Language.EN,
    // Health info (optional - can be added during registration)
    @field:Valid
    val healthInfo: HealthInfoInput? = null,
    // Agreements to sign during registration
    val agreementIds: List<UUID>? = null,
    val signatureData: String? = null
)

// Health Info Input for registration
data class HealthInfoInput(
    // PAR-Q Questions
    val hasHeartCondition: Boolean = false,
    val hasChestPainDuringActivity: Boolean = false,
    val hasChestPainAtRest: Boolean = false,
    val hasDizzinessOrBalance: Boolean = false,
    val hasBoneJointProblem: Boolean = false,
    val takesBloodPressureMedication: Boolean = false,
    val hasOtherReasonNotToExercise: Boolean = false,
    // Health Details
    val medicalConditions: String? = null,
    val allergies: String? = null,
    val currentMedications: String? = null,
    val injuriesAndLimitations: String? = null,
    val bloodType: BloodType? = null,
    val emergencyMedicalNotes: String? = null,
    // Doctor Info
    val doctorName: String? = null,
    val doctorPhone: String? = null,
    // Medical Clearance
    val medicalClearanceDate: LocalDate? = null
)

data class UpdateMemberRequest(
    @field:Valid
    val firstName: FlexibleLocalizedTextInput? = null,

    @field:Valid
    val lastName: FlexibleLocalizedTextInput? = null,

    val phone: String? = null,
    val dateOfBirth: LocalDate? = null,
    val gender: Gender? = null,
    val nationality: String? = null,
    val nationalId: String? = null,
    val address: LocalizedTextInput? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val notes: LocalizedTextInput? = null,
    val registrationNotes: String? = null,
    val preferredLanguage: Language? = null
)

data class MemberResponse(
    val id: UUID,
    val firstName: LocalizedText,
    val lastName: LocalizedText,
    val fullName: LocalizedText,
    val email: String,
    val phone: String?,
    val dateOfBirth: LocalDate?,
    val gender: Gender?,
    val nationality: String?,
    val nationalId: String?,
    val status: MemberStatus,
    val address: AddressResponse?,
    val emergencyContactName: String?,
    val emergencyContactPhone: String?,
    val notes: String?,
    val registrationNotes: String?,
    val preferredLanguage: Language,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Additional info (populated from related services)
    val hasHealthInfo: Boolean = false,
    val requiresMedicalClearance: Boolean = false,
    val allMandatoryAgreementsSigned: Boolean = false
) {
    companion object {
        fun from(member: Member): MemberResponse = MemberResponse(
            id = member.id,
            firstName = member.firstName,
            lastName = member.lastName,
            fullName = member.fullName,
            email = member.email,
            phone = member.phone,
            dateOfBirth = member.dateOfBirth,
            gender = member.gender,
            nationality = member.nationality,
            nationalId = member.nationalId,
            status = member.status,
            address = member.address?.let { AddressResponse.from(it) },
            emergencyContactName = member.emergencyContactName,
            emergencyContactPhone = member.emergencyContactPhone,
            notes = member.notes,
            registrationNotes = member.registrationNotes,
            preferredLanguage = member.preferredLanguage,
            createdAt = member.createdAt,
            updatedAt = member.updatedAt
        )

        fun from(
            member: Member,
            hasHealthInfo: Boolean = false,
            requiresMedicalClearance: Boolean = false,
            allMandatoryAgreementsSigned: Boolean = false
        ): MemberResponse = MemberResponse(
            id = member.id,
            firstName = member.firstName,
            lastName = member.lastName,
            fullName = member.fullName,
            email = member.email,
            phone = member.phone,
            dateOfBirth = member.dateOfBirth,
            gender = member.gender,
            nationality = member.nationality,
            nationalId = member.nationalId,
            status = member.status,
            address = member.address?.let { AddressResponse.from(it) },
            emergencyContactName = member.emergencyContactName,
            emergencyContactPhone = member.emergencyContactPhone,
            notes = member.notes,
            registrationNotes = member.registrationNotes,
            preferredLanguage = member.preferredLanguage,
            createdAt = member.createdAt,
            updatedAt = member.updatedAt,
            hasHealthInfo = hasHealthInfo,
            requiresMedicalClearance = requiresMedicalClearance,
            allMandatoryAgreementsSigned = allMandatoryAgreementsSigned
        )
    }
}

data class AddressResponse(
    val street: String?,
    val city: String?,
    val state: String?,
    val postalCode: String?,
    val country: String?,
    val formatted: String
) {
    companion object {
        fun from(address: Address): AddressResponse = AddressResponse(
            street = address.street,
            city = address.city,
            state = address.state,
            postalCode = address.postalCode,
            country = address.country,
            formatted = address.toFormattedString()
        )
    }
}

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)

// ==================== USER ACCOUNT DTOs ====================

data class CreateUserForMemberRequest(
    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val password: String
)

data class UserAccountResponse(
    val userId: UUID,
    val email: String,
    val role: String,
    val status: String
)

data class LinkUserToMemberRequest(
    @field:NotNull(message = "User ID is required")
    val userId: UUID
)
