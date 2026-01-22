package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.BloodType
import com.liyaqa.membership.domain.model.MemberHealth
import com.liyaqa.membership.domain.ports.MemberHealthRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class MemberHealthService(
    private val memberHealthRepository: MemberHealthRepository,
    private val memberRepository: MemberRepository
) {

    fun createOrUpdateHealth(
        memberId: UUID,
        hasHeartCondition: Boolean = false,
        hasChestPainDuringActivity: Boolean = false,
        hasChestPainAtRest: Boolean = false,
        hasDizzinessOrBalance: Boolean = false,
        hasBoneJointProblem: Boolean = false,
        takesBloodPressureMedication: Boolean = false,
        hasOtherReasonNotToExercise: Boolean = false,
        medicalConditions: String? = null,
        allergies: String? = null,
        currentMedications: String? = null,
        injuriesAndLimitations: String? = null,
        bloodType: BloodType? = null,
        emergencyMedicalNotes: String? = null,
        doctorName: String? = null,
        doctorPhone: String? = null,
        medicalClearanceDate: LocalDate? = null
    ): MemberHealth {
        // Verify member exists
        if (!memberRepository.existsById(memberId)) {
            throw NoSuchElementException("Member not found: $memberId")
        }

        val existing = memberHealthRepository.findByMemberId(memberId)
        val health = if (existing.isPresent) {
            existing.get().apply {
                this.hasHeartCondition = hasHeartCondition
                this.hasChestPainDuringActivity = hasChestPainDuringActivity
                this.hasChestPainAtRest = hasChestPainAtRest
                this.hasDizzinessOrBalance = hasDizzinessOrBalance
                this.hasBoneJointProblem = hasBoneJointProblem
                this.takesBloodPressureMedication = takesBloodPressureMedication
                this.hasOtherReasonNotToExercise = hasOtherReasonNotToExercise
                this.medicalConditions = medicalConditions
                this.allergies = allergies
                this.currentMedications = currentMedications
                this.injuriesAndLimitations = injuriesAndLimitations
                this.bloodType = bloodType
                this.emergencyMedicalNotes = emergencyMedicalNotes
                this.doctorName = doctorName
                this.doctorPhone = doctorPhone
                this.medicalClearanceDate = medicalClearanceDate
                this.updateHealthInfo()
            }
        } else {
            MemberHealth(
                memberId = memberId,
                hasHeartCondition = hasHeartCondition,
                hasChestPainDuringActivity = hasChestPainDuringActivity,
                hasChestPainAtRest = hasChestPainAtRest,
                hasDizzinessOrBalance = hasDizzinessOrBalance,
                hasBoneJointProblem = hasBoneJointProblem,
                takesBloodPressureMedication = takesBloodPressureMedication,
                hasOtherReasonNotToExercise = hasOtherReasonNotToExercise,
                medicalConditions = medicalConditions,
                allergies = allergies,
                currentMedications = currentMedications,
                injuriesAndLimitations = injuriesAndLimitations,
                bloodType = bloodType,
                emergencyMedicalNotes = emergencyMedicalNotes,
                doctorName = doctorName,
                doctorPhone = doctorPhone,
                medicalClearanceDate = medicalClearanceDate
            ).apply { updateHealthInfo() }
        }

        return memberHealthRepository.save(health)
    }

    @Transactional(readOnly = true)
    fun getHealthInfo(memberId: UUID): MemberHealth? {
        return memberHealthRepository.findByMemberId(memberId).orElse(null)
    }

    @Transactional(readOnly = true)
    fun getHealthInfoOrThrow(memberId: UUID): MemberHealth {
        return memberHealthRepository.findByMemberId(memberId)
            .orElseThrow { NoSuchElementException("Health info not found for member: $memberId") }
    }

    @Transactional(readOnly = true)
    fun hasHealthInfo(memberId: UUID): Boolean {
        return memberHealthRepository.existsByMemberId(memberId)
    }

    @Transactional(readOnly = true)
    fun needsMedicalClearance(memberId: UUID): Boolean {
        val health = memberHealthRepository.findByMemberId(memberId).orElse(null)
        return health?.needsMedicalClearance() ?: false
    }

    fun deleteHealthInfo(memberId: UUID) {
        memberHealthRepository.deleteByMemberId(memberId)
    }

    fun recordMedicalClearance(memberId: UUID, clearanceDate: LocalDate, doctorName: String?, doctorPhone: String?): MemberHealth {
        val health = getHealthInfoOrThrow(memberId)
        health.medicalClearanceDate = clearanceDate
        health.doctorName = doctorName
        health.doctorPhone = doctorPhone
        health.updateHealthInfo()
        return memberHealthRepository.save(health)
    }
}
