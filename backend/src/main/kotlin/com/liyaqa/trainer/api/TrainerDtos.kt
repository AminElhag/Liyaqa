package com.liyaqa.trainer.api

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.LocalizedTextInput
import com.liyaqa.trainer.application.services.AvailabilityData
import com.liyaqa.trainer.application.services.CertificationData
import com.liyaqa.trainer.application.services.TimeSlotData
import com.liyaqa.trainer.domain.model.CompensationModel
import com.liyaqa.trainer.domain.model.Gender
import com.liyaqa.trainer.domain.model.Trainer
import com.liyaqa.trainer.domain.model.TrainerClubAssignment
import com.liyaqa.trainer.domain.model.TrainerClubAssignmentStatus
import com.liyaqa.trainer.domain.model.TrainerEmploymentType
import com.liyaqa.trainer.domain.model.TrainerStatus
import com.liyaqa.trainer.domain.model.TrainerType
import jakarta.validation.constraints.Past
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ==================== REQUEST DTOs ====================

/**
 * Request to create a new trainer from an existing user.
 */
data class CreateTrainerRequest(
    @field:NotNull(message = "User ID is required")
    val userId: UUID,

    @field:NotNull(message = "Organization ID is required")
    val organizationId: UUID,

    // Basic Info
    @field:Valid
    val displayName: LocalizedTextInput? = null,

    @field:Past(message = "Date of birth must be in the past")
    val dateOfBirth: LocalDate? = null,

    val gender: Gender? = null,

    // Profile
    @field:Valid
    val bio: LocalizedTextInput? = null,

    val profileImageUrl: String? = null,

    @field:Min(0, message = "Experience years must be non-negative")
    @field:Max(70, message = "Experience years cannot exceed 70")
    val experienceYears: Int? = null,

    val employmentType: TrainerEmploymentType = TrainerEmploymentType.INDEPENDENT_CONTRACTOR,

    val trainerType: TrainerType = TrainerType.GROUP_FITNESS,

    val specializations: List<String>? = null,

    @field:Valid
    val certifications: List<CertificationInput>? = null,

    @field:PositiveOrZero(message = "Hourly rate must be non-negative")
    val hourlyRate: BigDecimal? = null,

    @field:PositiveOrZero(message = "PT session rate must be non-negative")
    val ptSessionRate: BigDecimal? = null,

    val compensationModel: CompensationModel? = null,

    @field:Pattern(regexp = "^\\+?[0-9\\s\\-()]*$", message = "Invalid phone number format")
    val phone: String? = null,

    @field:Valid
    val notes: LocalizedTextInput? = null,

    val assignedClubIds: List<UUID>? = null,

    val primaryClubId: UUID? = null
)

/**
 * Request to update trainer profile information.
 */
data class UpdateTrainerProfileRequest(
    @field:Valid
    val bio: LocalizedTextInput? = null,

    val profileImageUrl: String? = null,

    @field:Min(0, message = "Experience years must be non-negative")
    @field:Max(70, message = "Experience years cannot exceed 70")
    val experienceYears: Int? = null,

    @field:Pattern(regexp = "^\\+?[0-9\\s\\-()]*$", message = "Invalid phone number format")
    val phone: String? = null
)

/**
 * Request to update trainer classification.
 */
data class UpdateTrainerClassificationRequest(
    @field:NotNull(message = "Employment type is required")
    val employmentType: TrainerEmploymentType,

    @field:NotNull(message = "Trainer type is required")
    val trainerType: TrainerType
)

/**
 * Request to update trainer qualifications.
 */
data class UpdateTrainerQualificationsRequest(
    val specializations: List<String>?,

    @field:Valid
    val certifications: List<CertificationInput>?
)

/**
 * Request to update trainer compensation.
 */
data class UpdateTrainerCompensationRequest(
    @field:PositiveOrZero(message = "Hourly rate must be non-negative")
    val hourlyRate: BigDecimal?,

    @field:PositiveOrZero(message = "PT session rate must be non-negative")
    val ptSessionRate: BigDecimal?,

    val compensationModel: CompensationModel?
)

/**
 * Request to update trainer availability.
 */
data class UpdateTrainerAvailabilityRequest(
    @field:Valid
    @field:NotNull(message = "Availability is required")
    val availability: AvailabilityInput
)

/**
 * Request to update trainer basic info (name, date of birth, gender).
 */
data class UpdateTrainerBasicInfoRequest(
    @field:Valid
    val displayName: LocalizedTextInput? = null,

    @field:Past(message = "Date of birth must be in the past")
    val dateOfBirth: LocalDate? = null,

    val gender: Gender? = null
)

/**
 * Request to assign trainer to a club.
 */
data class AssignTrainerToClubRequest(
    @field:NotNull(message = "Club ID is required")
    val clubId: UUID,

    val isPrimary: Boolean = false
)

/**
 * Input for certification data.
 */
data class CertificationInput(
    @field:NotBlank(message = "Certification name is required")
    val name: String,

    val issuedBy: String? = null,

    val issuedAt: LocalDate? = null,

    val expiresAt: LocalDate? = null
)

/**
 * Input for availability data.
 */
data class AvailabilityInput(
    @field:Valid
    val monday: List<TimeSlotInput>? = null,

    @field:Valid
    val tuesday: List<TimeSlotInput>? = null,

    @field:Valid
    val wednesday: List<TimeSlotInput>? = null,

    @field:Valid
    val thursday: List<TimeSlotInput>? = null,

    @field:Valid
    val friday: List<TimeSlotInput>? = null,

    @field:Valid
    val saturday: List<TimeSlotInput>? = null,

    @field:Valid
    val sunday: List<TimeSlotInput>? = null
)

/**
 * Input for time slot data.
 */
data class TimeSlotInput(
    @field:NotBlank(message = "Start time is required")
    @field:Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Start time must be in HH:mm format")
    val start: String,

    @field:NotBlank(message = "End time is required")
    @field:Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "End time must be in HH:mm format")
    val end: String
)

// ==================== RESPONSE DTOs ====================

/**
 * Full trainer response with all details.
 */
data class TrainerResponse(
    val id: UUID,
    val userId: UUID,
    val organizationId: UUID,
    // Basic Info
    val displayName: LocalizedText?,
    val dateOfBirth: LocalDate?,
    val gender: Gender?,
    val age: Int?,
    // Profile
    val bio: LocalizedText?,
    val profileImageUrl: String?,
    val experienceYears: Int?,
    val employmentType: TrainerEmploymentType,
    val trainerType: TrainerType,
    val specializations: List<String>,
    val certifications: List<CertificationResponse>,
    val availability: AvailabilityResponse?,
    val hourlyRate: BigDecimal?,
    val ptSessionRate: BigDecimal?,
    val compensationModel: CompensationModel?,
    val status: TrainerStatus,
    val phone: String?,
    val notes: LocalizedText?,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Related data (populated by controller)
    val userName: String? = null,
    val userEmail: String? = null,
    val assignedClubs: List<TrainerClubAssignmentResponse>? = null
) {
    companion object {
        fun from(
            trainer: Trainer,
            specializations: List<String>,
            certifications: List<CertificationData>,
            availability: AvailabilityData?,
            userName: String? = null,
            userEmail: String? = null,
            clubAssignments: List<TrainerClubAssignmentResponse>? = null
        ): TrainerResponse = TrainerResponse(
            id = trainer.id,
            userId = trainer.userId,
            organizationId = trainer.organizationId,
            displayName = trainer.displayName,
            dateOfBirth = trainer.dateOfBirth,
            gender = trainer.gender,
            age = trainer.getAge(),
            bio = trainer.bio,
            profileImageUrl = trainer.profileImageUrl,
            experienceYears = trainer.experienceYears,
            employmentType = trainer.employmentType,
            trainerType = trainer.trainerType,
            specializations = specializations,
            certifications = certifications.map { CertificationResponse.from(it) },
            availability = availability?.let { AvailabilityResponse.from(it) },
            hourlyRate = trainer.hourlyRate,
            ptSessionRate = trainer.ptSessionRate,
            compensationModel = trainer.compensationModel,
            status = trainer.status,
            phone = trainer.phone,
            notes = trainer.notes,
            createdAt = trainer.createdAt,
            updatedAt = trainer.updatedAt,
            userName = userName,
            userEmail = userEmail,
            assignedClubs = clubAssignments
        )
    }
}

/**
 * Summary trainer response for list views.
 */
data class TrainerSummaryResponse(
    val id: UUID,
    val userId: UUID,
    val displayName: LocalizedText?,
    val userName: String?,
    val userEmail: String?,
    val profileImageUrl: String?,
    val trainerType: TrainerType,
    val specializations: List<String>,
    val status: TrainerStatus,
    val ptSessionRate: BigDecimal?,
    val createdAt: Instant
) {
    companion object {
        fun from(
            trainer: Trainer,
            specializations: List<String>,
            userName: String? = null,
            userEmail: String? = null
        ): TrainerSummaryResponse = TrainerSummaryResponse(
            id = trainer.id,
            userId = trainer.userId,
            displayName = trainer.displayName,
            userName = userName,
            userEmail = userEmail,
            profileImageUrl = trainer.profileImageUrl,
            trainerType = trainer.trainerType,
            specializations = specializations,
            status = trainer.status,
            ptSessionRate = trainer.ptSessionRate,
            createdAt = trainer.createdAt
        )
    }
}

/**
 * Certification response.
 */
data class CertificationResponse(
    val name: String,
    val issuedBy: String?,
    val issuedAt: LocalDate?,
    val expiresAt: LocalDate?,
    val isExpired: Boolean
) {
    companion object {
        fun from(data: CertificationData): CertificationResponse = CertificationResponse(
            name = data.name,
            issuedBy = data.issuedBy,
            issuedAt = data.issuedAt,
            expiresAt = data.expiresAt,
            isExpired = data.expiresAt?.isBefore(LocalDate.now()) ?: false
        )
    }
}

/**
 * Availability response.
 */
data class AvailabilityResponse(
    val monday: List<TimeSlotResponse>?,
    val tuesday: List<TimeSlotResponse>?,
    val wednesday: List<TimeSlotResponse>?,
    val thursday: List<TimeSlotResponse>?,
    val friday: List<TimeSlotResponse>?,
    val saturday: List<TimeSlotResponse>?,
    val sunday: List<TimeSlotResponse>?
) {
    companion object {
        fun from(data: AvailabilityData): AvailabilityResponse = AvailabilityResponse(
            monday = data.monday?.map { TimeSlotResponse.from(it) },
            tuesday = data.tuesday?.map { TimeSlotResponse.from(it) },
            wednesday = data.wednesday?.map { TimeSlotResponse.from(it) },
            thursday = data.thursday?.map { TimeSlotResponse.from(it) },
            friday = data.friday?.map { TimeSlotResponse.from(it) },
            saturday = data.saturday?.map { TimeSlotResponse.from(it) },
            sunday = data.sunday?.map { TimeSlotResponse.from(it) }
        )
    }
}

/**
 * Time slot response.
 */
data class TimeSlotResponse(
    val start: String,
    val end: String
) {
    companion object {
        fun from(data: TimeSlotData): TimeSlotResponse = TimeSlotResponse(
            start = data.start,
            end = data.end
        )
    }
}

/**
 * Trainer club assignment response.
 */
data class TrainerClubAssignmentResponse(
    val id: UUID,
    val trainerId: UUID,
    val clubId: UUID,
    val clubName: String?,
    val isPrimary: Boolean,
    val status: TrainerClubAssignmentStatus,
    val createdAt: Instant
) {
    companion object {
        fun from(
            assignment: TrainerClubAssignment,
            clubName: String? = null
        ): TrainerClubAssignmentResponse = TrainerClubAssignmentResponse(
            id = assignment.id,
            trainerId = assignment.trainerId,
            clubId = assignment.clubId,
            clubName = clubName,
            isPrimary = assignment.isPrimary,
            status = assignment.status,
            createdAt = assignment.createdAt
        )
    }
}
