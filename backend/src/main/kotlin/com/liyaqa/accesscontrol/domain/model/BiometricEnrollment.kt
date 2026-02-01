package com.liyaqa.accesscontrol.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "biometric_enrollments")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class BiometricEnrollment(
    @Column(name = "member_id", nullable = false)
    var memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "biometric_type", nullable = false, length = 20)
    var biometricType: BiometricType,

    @Enumerated(EnumType.STRING)
    @Column(name = "finger_position", length = 20)
    var fingerPosition: FingerPosition? = null,

    @Column(name = "template_data_encrypted", nullable = false, columnDefinition = "TEXT")
    var templateDataEncrypted: String,

    @Column(name = "template_quality")
    var templateQuality: Int? = null,

    @Column(name = "device_id")
    var deviceId: UUID? = null,

    @Column(name = "enrolled_at")
    var enrolledAt: Instant = Instant.now(),

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    var status: BiometricStatus = BiometricStatus.ACTIVE,

    @Column(name = "last_used_at")
    var lastUsedAt: Instant? = null
) : BaseEntity() {

    fun isValid(): Boolean {
        return status == BiometricStatus.ACTIVE
    }

    fun markUsed() {
        lastUsedAt = Instant.now()
    }

    fun suspend() {
        status = BiometricStatus.SUSPENDED
    }

    fun requireReEnrollment() {
        status = BiometricStatus.NEEDS_RE_ENROLLMENT
    }

    fun reactivate() {
        status = BiometricStatus.ACTIVE
    }
}
