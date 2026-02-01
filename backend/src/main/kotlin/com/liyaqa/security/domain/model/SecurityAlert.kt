package com.liyaqa.security.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * Security alert for suspicious activity detection.
 * Tracks anomalies like impossible travel, new device, brute force, etc.
 */
@Entity
@Table(name = "security_alerts")
class SecurityAlert(
    id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "alert_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    var alertType: AlertType,

    @Column(name = "severity", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    var severity: Severity,

    @Column(name = "details", columnDefinition = "TEXT")
    var details: String? = null,

    @Column(name = "login_attempt_id")
    var loginAttemptId: UUID? = null,

    @Column(name = "resolved", nullable = false)
    var resolved: Boolean = false,

    @Column(name = "acknowledged_at")
    var acknowledgedAt: Instant? = null,

    @Column(name = "ip_address", length = 45)
    var ipAddress: String? = null,

    @Column(name = "device_info", length = 500)
    var deviceInfo: String? = null,

    @Column(name = "location", length = 200)
    var location: String? = null

) : BaseEntity(id) {

    /**
     * Acknowledges this alert.
     */
    fun acknowledge() {
        acknowledgedAt = Instant.now()
        resolved = true
    }

    /**
     * Dismisses this alert without action.
     */
    fun dismiss() {
        resolved = true
    }

    /**
     * Checks if this alert is unread.
     */
    fun isUnread(): Boolean = acknowledgedAt == null && !resolved

    /**
     * Gets a human-readable description of the alert.
     */
    fun getDescription(): String {
        return when (alertType) {
            AlertType.IMPOSSIBLE_TRAVEL -> "Login from a location too far from your last login"
            AlertType.NEW_DEVICE -> "Login from a new device"
            AlertType.BRUTE_FORCE -> "Multiple failed login attempts detected"
            AlertType.UNUSUAL_TIME -> "Login at an unusual time"
            AlertType.NEW_LOCATION -> "Login from a new location"
            AlertType.MULTIPLE_SESSIONS -> "Unusual number of concurrent sessions"
            AlertType.PASSWORD_SPRAY -> "Password spray attack detected"
        }
    }
}

/**
 * Type of security alert.
 */
enum class AlertType {
    /** Login from two distant locations within short time */
    IMPOSSIBLE_TRAVEL,

    /** Login from unrecognized device */
    NEW_DEVICE,

    /** Multiple failed login attempts from same IP */
    BRUTE_FORCE,

    /** Login outside normal hours */
    UNUSUAL_TIME,

    /** Login from new country/city */
    NEW_LOCATION,

    /** Unusual number of active sessions */
    MULTIPLE_SESSIONS,

    /** Password spray attack pattern */
    PASSWORD_SPRAY
}

/**
 * Alert severity level.
 */
enum class Severity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
