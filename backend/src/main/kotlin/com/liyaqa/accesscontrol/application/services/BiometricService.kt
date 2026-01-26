package com.liyaqa.accesscontrol.application.services

import com.liyaqa.accesscontrol.application.commands.*
import com.liyaqa.accesscontrol.domain.model.*
import com.liyaqa.accesscontrol.domain.ports.*
import com.liyaqa.shared.domain.TenantContext
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional
class BiometricService(
    private val biometricRepository: BiometricEnrollmentRepository
) {
    fun enrollBiometric(command: EnrollBiometricCommand): BiometricEnrollment {
        val enrollment = BiometricEnrollment(
            memberId = command.memberId,
            biometricType = command.biometricType,
            fingerPosition = command.fingerPosition,
            templateDataEncrypted = command.templateData, // Should encrypt in production
            templateQuality = command.templateQuality,
            deviceId = command.deviceId
        )
        // tenantId is automatically set by BaseEntity's @PrePersist
        return biometricRepository.save(enrollment)
    }

    fun getEnrollment(id: UUID) = biometricRepository.findById(id)

    fun getEnrollmentsByMember(memberId: UUID) = biometricRepository.findByMemberId(memberId)

    fun getActiveEnrollmentsByMember(memberId: UUID) = biometricRepository.findActiveByMemberId(memberId)

    fun getEnrollmentsByMemberAndType(memberId: UUID, type: BiometricType) =
        biometricRepository.findByMemberIdAndType(memberId, type)

    fun listEnrollments(pageable: Pageable) = biometricRepository.findAll(pageable)

    fun suspendEnrollment(id: UUID): BiometricEnrollment {
        val enrollment = biometricRepository.findById(id)
            ?: throw IllegalArgumentException("Enrollment not found: $id")
        enrollment.suspend()
        return biometricRepository.save(enrollment)
    }

    fun reactivateEnrollment(id: UUID): BiometricEnrollment {
        val enrollment = biometricRepository.findById(id)
            ?: throw IllegalArgumentException("Enrollment not found: $id")
        enrollment.reactivate()
        return biometricRepository.save(enrollment)
    }

    fun requireReEnrollment(id: UUID): BiometricEnrollment {
        val enrollment = biometricRepository.findById(id)
            ?: throw IllegalArgumentException("Enrollment not found: $id")
        enrollment.requireReEnrollment()
        return biometricRepository.save(enrollment)
    }

    fun deleteEnrollment(id: UUID) {
        val enrollment = biometricRepository.findById(id)
            ?: throw IllegalArgumentException("Enrollment not found: $id")
        biometricRepository.delete(enrollment)
    }
}
