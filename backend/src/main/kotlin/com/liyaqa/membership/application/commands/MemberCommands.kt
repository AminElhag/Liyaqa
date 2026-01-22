package com.liyaqa.membership.application.commands

import com.liyaqa.membership.domain.model.BloodType
import com.liyaqa.membership.domain.model.Gender
import com.liyaqa.membership.domain.model.Language
import com.liyaqa.shared.domain.LocalizedText
import java.time.LocalDate
import java.util.UUID

data class CreateMemberCommand(
    val firstName: LocalizedText,
    val lastName: LocalizedText,
    val email: String,
    val phone: String? = null,
    val dateOfBirth: LocalDate? = null,
    val address: LocalizedText? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val notes: String? = null,
    // Enhanced registration fields
    val gender: Gender? = null,
    val nationality: String? = null,
    val nationalId: String? = null,
    val registrationNotes: String? = null,
    val preferredLanguage: Language = Language.EN,
    // Health info (optional - can be added during registration)
    val healthInfo: HealthInfoCommand? = null,
    // Agreements to sign during registration
    val agreementIds: List<UUID>? = null,
    val signatureData: String? = null,
    val ipAddress: String? = null,
    val userAgent: String? = null
)

data class UpdateMemberCommand(
    val firstName: LocalizedText? = null,
    val lastName: LocalizedText? = null,
    val phone: String? = null,
    val dateOfBirth: LocalDate? = null,
    val address: LocalizedText? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val notes: String? = null,
    // Enhanced fields
    val gender: Gender? = null,
    val nationality: String? = null,
    val nationalId: String? = null,
    val registrationNotes: String? = null,
    val preferredLanguage: Language? = null
)

data class HealthInfoCommand(
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
