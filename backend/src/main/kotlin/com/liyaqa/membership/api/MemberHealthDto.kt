package com.liyaqa.membership.api

import com.liyaqa.membership.domain.model.BloodType
import com.liyaqa.membership.domain.model.MemberHealth
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateOrUpdateHealthRequest(
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

data class MemberHealthResponse(
    val id: UUID,
    val memberId: UUID,

    // PAR-Q Questions
    val hasHeartCondition: Boolean,
    val hasChestPainDuringActivity: Boolean,
    val hasChestPainAtRest: Boolean,
    val hasDizzinessOrBalance: Boolean,
    val hasBoneJointProblem: Boolean,
    val takesBloodPressureMedication: Boolean,
    val hasOtherReasonNotToExercise: Boolean,

    // Health Details
    val medicalConditions: String?,
    val allergies: String?,
    val currentMedications: String?,
    val injuriesAndLimitations: String?,
    val bloodType: BloodType?,
    val emergencyMedicalNotes: String?,

    // Medical Clearance
    val requiresMedicalClearance: Boolean,
    val medicalClearanceDate: LocalDate?,
    val doctorName: String?,
    val doctorPhone: String?,

    // Metadata
    val healthUpdatedAt: Instant,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(health: MemberHealth): MemberHealthResponse = MemberHealthResponse(
            id = health.id,
            memberId = health.memberId,
            hasHeartCondition = health.hasHeartCondition,
            hasChestPainDuringActivity = health.hasChestPainDuringActivity,
            hasChestPainAtRest = health.hasChestPainAtRest,
            hasDizzinessOrBalance = health.hasDizzinessOrBalance,
            hasBoneJointProblem = health.hasBoneJointProblem,
            takesBloodPressureMedication = health.takesBloodPressureMedication,
            hasOtherReasonNotToExercise = health.hasOtherReasonNotToExercise,
            medicalConditions = health.medicalConditions,
            allergies = health.allergies,
            currentMedications = health.currentMedications,
            injuriesAndLimitations = health.injuriesAndLimitations,
            bloodType = health.bloodType,
            emergencyMedicalNotes = health.emergencyMedicalNotes,
            requiresMedicalClearance = health.requiresMedicalClearance,
            medicalClearanceDate = health.medicalClearanceDate,
            doctorName = health.doctorName,
            doctorPhone = health.doctorPhone,
            healthUpdatedAt = health.healthUpdatedAt,
            createdAt = health.createdAt,
            updatedAt = health.updatedAt
        )
    }
}

data class HealthSummaryResponse(
    val memberId: UUID,
    val hasHealthInfo: Boolean,
    val requiresMedicalClearance: Boolean,
    val hasMedicalClearance: Boolean,
    val parqAnsweredYes: Int,
    val healthUpdatedAt: Instant?
) {
    companion object {
        fun from(memberId: UUID, health: MemberHealth?): HealthSummaryResponse {
            if (health == null) {
                return HealthSummaryResponse(
                    memberId = memberId,
                    hasHealthInfo = false,
                    requiresMedicalClearance = false,
                    hasMedicalClearance = false,
                    parqAnsweredYes = 0,
                    healthUpdatedAt = null
                )
            }

            val yesCount = listOf(
                health.hasHeartCondition,
                health.hasChestPainDuringActivity,
                health.hasChestPainAtRest,
                health.hasDizzinessOrBalance,
                health.hasBoneJointProblem,
                health.takesBloodPressureMedication,
                health.hasOtherReasonNotToExercise
            ).count { it }

            return HealthSummaryResponse(
                memberId = memberId,
                hasHealthInfo = true,
                requiresMedicalClearance = health.requiresMedicalClearance,
                hasMedicalClearance = health.medicalClearanceDate != null,
                parqAnsweredYes = yesCount,
                healthUpdatedAt = health.healthUpdatedAt
            )
        }
    }
}
