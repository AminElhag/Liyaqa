package com.liyaqa.security.domain.model

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "security_alerts", indexes = [
    Index(name = "idx_security_alerts_user", columnList = "user_id"),
    Index(name = "idx_security_alerts_unresolved", columnList = "user_id, resolved"),
    Index(name = "idx_security_alerts_created", columnList = "created_at")
])
data class SecurityAlert(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false, length = 50)
    val alertType: AlertType,

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    val severity: AlertSeverity,

    @Column(name = "details", columnDefinition = "TEXT")
    val details: String? = null,

    @Column(name = "login_attempt_id")
    val loginAttemptId: UUID? = null,

    @Column(name = "resolved", nullable = false)
    var resolved: Boolean = false,

    @Column(name = "acknowledged_at")
    var acknowledgedAt: Instant? = null,

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
) {
    fun acknowledge() {
        resolved = true
        acknowledgedAt = Instant.now()
    }
}

enum class AlertType {
    IMPOSSIBLE_TRAVEL,
    NEW_DEVICE,
    BRUTE_FORCE,
    UNUSUAL_TIME,
    NEW_LOCATION,
    MULTIPLE_FAILED_MFA,
    SESSION_HIJACKING
}

enum class AlertSeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
