package com.liyaqa.accesscontrol.domain.model

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.Instant
import java.util.*

@Entity
@Table(name = "access_logs")
class AccessLog(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "device_id", nullable = false)
    val deviceId: UUID,

    @Column(name = "zone_id")
    val zoneId: UUID? = null,

    @Column(name = "member_id")
    val memberId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "access_method", nullable = false, length = 20)
    val accessMethod: AccessMethod,

    @Column(name = "card_id")
    val cardId: UUID? = null,

    @Column(name = "biometric_id")
    val biometricId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 10)
    val direction: AccessDirection,

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 20)
    val result: AccessResult,

    @Enumerated(EnumType.STRING)
    @Column(name = "denial_reason", length = 50)
    val denialReason: DenialReason? = null,

    @Column(name = "confidence_score", precision = 5, scale = 4)
    val confidenceScore: BigDecimal? = null,

    @Column(name = "raw_credential", length = 255)
    val rawCredential: String? = null,

    @Column(name = "timestamp")
    val timestamp: Instant = Instant.now(),

    @Column(name = "created_at")
    val createdAt: Instant = Instant.now()
) {
    companion object {
        fun granted(
            tenantId: UUID,
            deviceId: UUID,
            zoneId: UUID?,
            memberId: UUID,
            accessMethod: AccessMethod,
            direction: AccessDirection,
            cardId: UUID? = null,
            biometricId: UUID? = null,
            confidenceScore: BigDecimal? = null
        ) = AccessLog(
            tenantId = tenantId,
            deviceId = deviceId,
            zoneId = zoneId,
            memberId = memberId,
            accessMethod = accessMethod,
            direction = direction,
            cardId = cardId,
            biometricId = biometricId,
            result = AccessResult.GRANTED,
            confidenceScore = confidenceScore
        )

        fun denied(
            tenantId: UUID,
            deviceId: UUID,
            zoneId: UUID?,
            memberId: UUID?,
            accessMethod: AccessMethod,
            direction: AccessDirection,
            denialReason: DenialReason,
            cardId: UUID? = null,
            biometricId: UUID? = null,
            rawCredential: String? = null
        ) = AccessLog(
            tenantId = tenantId,
            deviceId = deviceId,
            zoneId = zoneId,
            memberId = memberId,
            accessMethod = accessMethod,
            direction = direction,
            cardId = cardId,
            biometricId = biometricId,
            result = AccessResult.DENIED,
            denialReason = denialReason,
            rawCredential = rawCredential
        )
    }
}
