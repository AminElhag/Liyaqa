package com.liyaqa.trainer.application.commands

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.trainer.domain.model.CompensationModel
import com.liyaqa.trainer.domain.model.Gender
import com.liyaqa.trainer.domain.model.TrainerEmploymentType
import com.liyaqa.trainer.domain.model.TrainerType
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Command to create a new trainer.
 */
data class CreateTrainerCommand(
    val userId: UUID,
    val organizationId: UUID,
    val tenantId: UUID,
    // Basic Info
    val displayName: LocalizedText? = null,
    val dateOfBirth: LocalDate? = null,
    val gender: Gender? = null,
    // Profile
    val bio: LocalizedText? = null,
    val profileImageUrl: String? = null,
    val experienceYears: Int? = null,
    val employmentType: TrainerEmploymentType = TrainerEmploymentType.INDEPENDENT_CONTRACTOR,
    val trainerType: TrainerType = TrainerType.GROUP_FITNESS,
    val specializations: List<String>? = null,
    val certifications: List<CertificationInput>? = null,
    val hourlyRate: BigDecimal? = null,
    val ptSessionRate: BigDecimal? = null,
    val compensationModel: CompensationModel? = null,
    val phone: String? = null,
    val notes: LocalizedText? = null,
    val assignedClubIds: List<UUID>? = null,
    val primaryClubId: UUID? = null
)

/**
 * Command to update trainer profile.
 */
data class UpdateTrainerProfileCommand(
    val trainerId: UUID,
    val bio: LocalizedText? = null,
    val profileImageUrl: String? = null,
    val experienceYears: Int? = null,
    val phone: String? = null
)

/**
 * Command to update trainer classification.
 */
data class UpdateTrainerClassificationCommand(
    val trainerId: UUID,
    val employmentType: TrainerEmploymentType,
    val trainerType: TrainerType
)

/**
 * Command to update trainer qualifications.
 */
data class UpdateTrainerQualificationsCommand(
    val trainerId: UUID,
    val specializations: List<String>?,
    val certifications: List<CertificationInput>?
)

/**
 * Command to update trainer compensation.
 */
data class UpdateTrainerCompensationCommand(
    val trainerId: UUID,
    val hourlyRate: BigDecimal?,
    val ptSessionRate: BigDecimal?,
    val compensationModel: CompensationModel?
)

/**
 * Command to update trainer availability.
 */
data class UpdateTrainerAvailabilityCommand(
    val trainerId: UUID,
    val availability: AvailabilityInput
)

/**
 * Command to update trainer basic info (name, DOB, gender).
 */
data class UpdateTrainerBasicInfoCommand(
    val trainerId: UUID,
    val displayName: LocalizedText? = null,
    val dateOfBirth: LocalDate? = null,
    val gender: Gender? = null
)

/**
 * Command to assign a trainer to a club.
 */
data class AssignTrainerToClubCommand(
    val trainerId: UUID,
    val clubId: UUID,
    val isPrimary: Boolean = false
)

/**
 * Command to remove a trainer from a club.
 */
data class RemoveTrainerFromClubCommand(
    val trainerId: UUID,
    val clubId: UUID
)

/**
 * Input for certification data.
 */
data class CertificationInput(
    val name: String,
    val issuedBy: String? = null,
    val issuedAt: String? = null, // ISO date format
    val expiresAt: String? = null  // ISO date format
)

/**
 * Input for availability data.
 */
data class AvailabilityInput(
    val monday: List<TimeSlotInput>? = null,
    val tuesday: List<TimeSlotInput>? = null,
    val wednesday: List<TimeSlotInput>? = null,
    val thursday: List<TimeSlotInput>? = null,
    val friday: List<TimeSlotInput>? = null,
    val saturday: List<TimeSlotInput>? = null,
    val sunday: List<TimeSlotInput>? = null
)

/**
 * Input for time slot data.
 */
data class TimeSlotInput(
    val start: String, // HH:mm format
    val end: String    // HH:mm format
)
