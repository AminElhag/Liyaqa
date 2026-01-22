package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "member_health_info")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberHealth(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false, unique = true)
    val memberId: UUID,

    // PAR-Q Questions (7 core questions)
    @Column(name = "has_heart_condition")
    var hasHeartCondition: Boolean = false,

    @Column(name = "has_chest_pain_activity")
    var hasChestPainDuringActivity: Boolean = false,

    @Column(name = "has_chest_pain_rest")
    var hasChestPainAtRest: Boolean = false,

    @Column(name = "has_dizziness")
    var hasDizzinessOrBalance: Boolean = false,

    @Column(name = "has_bone_joint_problem")
    var hasBoneJointProblem: Boolean = false,

    @Column(name = "takes_blood_pressure_meds")
    var takesBloodPressureMedication: Boolean = false,

    @Column(name = "has_other_reason")
    var hasOtherReasonNotToExercise: Boolean = false,

    // Health Details
    @Column(name = "medical_conditions", columnDefinition = "TEXT")
    var medicalConditions: String? = null,

    @Column(name = "allergies", columnDefinition = "TEXT")
    var allergies: String? = null,

    @Column(name = "current_medications", columnDefinition = "TEXT")
    var currentMedications: String? = null,

    @Column(name = "injuries_limitations", columnDefinition = "TEXT")
    var injuriesAndLimitations: String? = null,

    @Column(name = "blood_type")
    @Enumerated(EnumType.STRING)
    var bloodType: BloodType? = null,

    @Column(name = "emergency_medical_notes", columnDefinition = "TEXT")
    var emergencyMedicalNotes: String? = null,

    // Medical Clearance
    @Column(name = "requires_medical_clearance")
    var requiresMedicalClearance: Boolean = false,

    @Column(name = "medical_clearance_date")
    var medicalClearanceDate: LocalDate? = null,

    @Column(name = "doctor_name")
    var doctorName: String? = null,

    @Column(name = "doctor_phone")
    var doctorPhone: String? = null,

    @Column(name = "health_updated_at")
    var healthUpdatedAt: Instant = Instant.now()

) : BaseEntity(id) {

    fun needsMedicalClearance(): Boolean {
        return hasHeartCondition || hasChestPainDuringActivity ||
               hasChestPainAtRest || hasDizzinessOrBalance ||
               hasBoneJointProblem || takesBloodPressureMedication ||
               hasOtherReasonNotToExercise
    }

    fun updateHealthInfo() {
        healthUpdatedAt = Instant.now()
        requiresMedicalClearance = needsMedicalClearance()
    }
}

enum class BloodType {
    A_POSITIVE,
    A_NEGATIVE,
    B_POSITIVE,
    B_NEGATIVE,
    AB_POSITIVE,
    AB_NEGATIVE,
    O_POSITIVE,
    O_NEGATIVE,
    UNKNOWN
}
