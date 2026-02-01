package com.liyaqa.auth.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Type of login attempt.
 */
enum class LoginAttemptType {
    SUCCESS,
    FAILED,
    LOCKED,
    MFA_REQUIRED,
    MFA_SUCCESS,
    MFA_FAILED
}

/**
 * Login attempt entity for comprehensive audit trail.
 * Tracks all login attempts with device fingerprinting and geolocation.
 */
@Entity
@Table(name = "login_attempts")
class LoginAttempt(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "user_id")
    val userId: UUID? = null,

    @Column(name = "email", nullable = false)
    val email: String,

    @Column(name = "ip_address", nullable = false, length = 45)
    val ipAddress: String,

    @Column(name = "user_agent", length = 500)
    val userAgent: String? = null,

    @Column(name = "device_fingerprint", length = 64)
    val deviceFingerprint: String? = null,

    @Column(name = "device_name", length = 100)
    val deviceName: String? = null,

    @Column(name = "os", length = 50)
    val os: String? = null,

    @Column(name = "browser", length = 50)
    val browser: String? = null,

    @Column(name = "country", length = 2)
    val country: String? = null,

    @Column(name = "city", length = 100)
    val city: String? = null,

    @Column(name = "latitude")
    val latitude: Double? = null,

    @Column(name = "longitude")
    val longitude: Double? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "attempt_type", nullable = false)
    val attemptType: LoginAttemptType,

    @Column(name = "failure_reason", length = 255)
    val failureReason: String? = null,

    @Column(name = "timestamp", nullable = false)
    val timestamp: Instant = Instant.now(),

    @Column(name = "tenant_id")
    val tenantId: UUID? = null,

    @Column(name = "flagged_as_suspicious", nullable = false)
    var flaggedAsSuspicious: Boolean = false,

    @Column(name = "acknowledged_at")
    var acknowledgedAt: Instant? = null
) {
    /**
     * Marks this login attempt as suspicious.
     */
    fun flagAsSuspicious() {
        flaggedAsSuspicious = true
    }

    /**
     * Acknowledges a suspicious login attempt.
     */
    fun acknowledge() {
        acknowledgedAt = Instant.now()
    }

    /**
     * Checks if this login attempt was successful.
     */
    fun isSuccess(): Boolean {
        return attemptType == LoginAttemptType.SUCCESS || attemptType == LoginAttemptType.MFA_SUCCESS
    }

    /**
     * Checks if this attempt is from a new device.
     * This is determined by the caller based on device fingerprint comparison.
     */
    fun isNewDevice(): Boolean {
        return deviceFingerprint != null
    }

    /**
     * Gets a human-readable device description.
     */
    fun getDeviceDescription(): String {
        val parts = mutableListOf<String>()

        browser?.let { parts.add(it) }
        os?.let { parts.add(it) }
        deviceName?.let { parts.add(it) }

        return if (parts.isNotEmpty()) {
            parts.joinToString(" on ")
        } else {
            "Unknown Device"
        }
    }

    /**
     * Gets a human-readable location description.
     */
    fun getLocationDescription(): String {
        val parts = mutableListOf<String>()

        city?.let { parts.add(it) }
        country?.let { parts.add(it) }

        return if (parts.isNotEmpty()) {
            parts.joinToString(", ")
        } else {
            "Unknown Location"
        }
    }
}
