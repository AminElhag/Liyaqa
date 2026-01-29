package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Represents a proactive alert for a client.
 * Alerts notify the platform team and/or clients about important events
 * requiring attention.
 *
 * This is a platform-level entity for B2B client management.
 */
@Entity
@Table(name = "platform_alerts")
class PlatformAlert(
    id: UUID = UUID.randomUUID(),

    /**
     * The organization this alert is for.
     */
    @Column(name = "organization_id", nullable = false)
    var organizationId: UUID,

    /**
     * Optional club ID for club-specific alerts.
     */
    @Column(name = "club_id")
    var clubId: UUID? = null,

    /**
     * Type of alert.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    var type: AlertType,

    /**
     * Severity level.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    var severity: AlertSeverity,

    /**
     * Alert title (short description).
     */
    @Column(name = "title", nullable = false)
    var title: String,

    /**
     * Detailed alert message.
     */
    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    var message: String,

    /**
     * Optional action URL (e.g., link to upgrade, update payment, etc.).
     */
    @Column(name = "action_url")
    var actionUrl: String? = null,

    /**
     * Optional action button label.
     */
    @Column(name = "action_label")
    var actionLabel: String? = null,

    /**
     * Additional data as JSON (for programmatic handling).
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    var metadata: String? = null,

    /**
     * When the alert was acknowledged by staff.
     */
    @Column(name = "acknowledged_at")
    var acknowledgedAt: Instant? = null,

    /**
     * User ID who acknowledged the alert.
     */
    @Column(name = "acknowledged_by")
    var acknowledgedBy: UUID? = null,

    /**
     * When the alert was resolved.
     */
    @Column(name = "resolved_at")
    var resolvedAt: Instant? = null,

    /**
     * User ID who resolved the alert.
     */
    @Column(name = "resolved_by")
    var resolvedBy: UUID? = null,

    /**
     * Resolution notes.
     */
    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    var resolutionNotes: String? = null,

    /**
     * Whether this alert can auto-resolve when conditions improve.
     */
    @Column(name = "auto_resolve", nullable = false)
    var autoResolve: Boolean = false,

    /**
     * Auto-resolve condition reference (e.g., "health_score >= 60").
     */
    @Column(name = "auto_resolve_condition")
    var autoResolveCondition: String? = null,

    /**
     * When this alert expires (null = never).
     */
    @Column(name = "expires_at")
    var expiresAt: Instant? = null,

    /**
     * Whether this alert should be shown to the client.
     */
    @Column(name = "visible_to_client", nullable = false)
    var visibleToClient: Boolean = true,

    /**
     * Whether the client has dismissed this alert (if visible).
     */
    @Column(name = "client_dismissed", nullable = false)
    var clientDismissed: Boolean = false,

    /**
     * When the client dismissed the alert.
     */
    @Column(name = "client_dismissed_at")
    var clientDismissedAt: Instant? = null

) : OrganizationLevelEntity(id) {

    // ============================================
    // Domain Methods - Lifecycle
    // ============================================

    /**
     * Acknowledges the alert (staff has seen it).
     */
    fun acknowledge(userId: UUID) {
        if (acknowledgedAt == null) {
            acknowledgedAt = Instant.now()
            acknowledgedBy = userId
        }
    }

    /**
     * Resolves the alert.
     */
    fun resolve(userId: UUID? = null, notes: String? = null) {
        resolvedAt = Instant.now()
        resolvedBy = userId
        resolutionNotes = notes
    }

    /**
     * Auto-resolves the alert (system detected condition is met).
     */
    fun autoResolveNow() {
        if (autoResolve && resolvedAt == null) {
            resolvedAt = Instant.now()
            resolutionNotes = "Auto-resolved: condition met"
        }
    }

    /**
     * Dismisses the alert for the client (hides it from their view).
     */
    fun dismissForClient() {
        if (visibleToClient && !clientDismissed) {
            clientDismissed = true
            clientDismissedAt = Instant.now()
        }
    }

    /**
     * Reopens a resolved alert.
     */
    fun reopen() {
        resolvedAt = null
        resolvedBy = null
        resolutionNotes = null
    }

    // ============================================
    // Domain Methods - Queries
    // ============================================

    /**
     * Checks if the alert is currently active (not resolved/expired).
     */
    fun isActive(): Boolean {
        if (resolvedAt != null) return false
        if (expiresAt != null && Instant.now().isAfter(expiresAt)) return false
        return true
    }

    /**
     * Checks if the alert has been acknowledged.
     */
    fun isAcknowledged(): Boolean = acknowledgedAt != null

    /**
     * Checks if the alert is resolved.
     */
    fun isResolved(): Boolean = resolvedAt != null

    /**
     * Checks if the alert has expired.
     */
    fun isExpired(): Boolean {
        return expiresAt != null && Instant.now().isAfter(expiresAt)
    }

    /**
     * Checks if this is a critical alert.
     */
    fun isCritical(): Boolean = severity == AlertSeverity.CRITICAL

    /**
     * Checks if this is a warning alert.
     */
    fun isWarning(): Boolean = severity == AlertSeverity.WARNING

    /**
     * Checks if this is a positive (success) alert.
     */
    fun isPositive(): Boolean = severity == AlertSeverity.SUCCESS

    /**
     * Checks if the alert should be shown to the client.
     */
    fun shouldShowToClient(): Boolean {
        return visibleToClient && !clientDismissed && isActive()
    }

    /**
     * Gets the age of the alert in hours.
     */
    fun getAgeHours(): Long {
        return java.time.Duration.between(createdAt, Instant.now()).toHours()
    }

    /**
     * Gets the time since acknowledgement in hours (null if not acknowledged).
     */
    fun getHoursSinceAcknowledgement(): Long? {
        return acknowledgedAt?.let {
            java.time.Duration.between(it, Instant.now()).toHours()
        }
    }

    companion object Factory {

        /**
         * Creates a usage limit warning alert.
         */
        fun usageLimitWarning(
            organizationId: UUID,
            resource: String,
            currentUsage: Int,
            maxUsage: Int,
            percentUsed: Int
        ): PlatformAlert {
            val severity = when {
                percentUsed >= 95 -> AlertSeverity.CRITICAL
                percentUsed >= 90 -> AlertSeverity.WARNING
                else -> AlertSeverity.INFO
            }
            return PlatformAlert(
                organizationId = organizationId,
                type = if (percentUsed >= 95) AlertType.USAGE_LIMIT_CRITICAL else AlertType.USAGE_LIMIT_WARNING,
                severity = severity,
                title = "$resource usage at $percentUsed%",
                message = "You are using $currentUsage of $maxUsage $resource. " +
                         if (percentUsed >= 95) "Upgrade now to avoid service interruption."
                         else "Consider upgrading your plan.",
                actionUrl = "/settings/billing/upgrade",
                actionLabel = "Upgrade Plan",
                autoResolve = true,
                autoResolveCondition = "usage_percent < 80",
                visibleToClient = true
            )
        }

        /**
         * Creates a payment failed alert.
         */
        fun paymentFailed(
            organizationId: UUID,
            invoiceId: UUID,
            amount: String
        ): PlatformAlert {
            return PlatformAlert(
                organizationId = organizationId,
                type = AlertType.PAYMENT_FAILED,
                severity = AlertSeverity.CRITICAL,
                title = "Payment of $amount failed",
                message = "We were unable to process your payment. Please update your payment method to avoid service interruption.",
                actionUrl = "/settings/billing/payment-method",
                actionLabel = "Update Payment Method",
                metadata = """{"invoiceId": "$invoiceId"}""",
                autoResolve = true,
                autoResolveCondition = "payment_successful",
                visibleToClient = true
            )
        }

        /**
         * Creates a trial ending alert.
         */
        fun trialEnding(
            organizationId: UUID,
            daysRemaining: Int
        ): PlatformAlert {
            val severity = when {
                daysRemaining <= 1 -> AlertSeverity.CRITICAL
                daysRemaining <= 3 -> AlertSeverity.WARNING
                else -> AlertSeverity.INFO
            }
            return PlatformAlert(
                organizationId = organizationId,
                type = AlertType.TRIAL_ENDING,
                severity = severity,
                title = "Trial ending in $daysRemaining ${if (daysRemaining == 1) "day" else "days"}",
                message = "Your free trial is ending soon. Subscribe now to keep access to all features and your data.",
                actionUrl = "/settings/billing/subscribe",
                actionLabel = "Subscribe Now",
                expiresAt = Instant.now().plusSeconds((daysRemaining + 1L) * 24 * 60 * 60),
                visibleToClient = true
            )
        }

        /**
         * Creates a churn risk alert.
         */
        fun churnRisk(
            organizationId: UUID,
            healthScore: Int,
            primaryReason: String
        ): PlatformAlert {
            return PlatformAlert(
                organizationId = organizationId,
                type = AlertType.CHURN_RISK,
                severity = AlertSeverity.WARNING,
                title = "Client at risk (Health Score: $healthScore)",
                message = "This client's health score has dropped to $healthScore. Primary concern: $primaryReason. Consider proactive outreach.",
                autoResolve = true,
                autoResolveCondition = "health_score >= 60",
                visibleToClient = false // Internal alert
            )
        }

        /**
         * Creates an inactivity warning alert.
         */
        fun inactivityWarning(
            organizationId: UUID,
            daysSinceLastLogin: Int
        ): PlatformAlert {
            return PlatformAlert(
                organizationId = organizationId,
                type = AlertType.INACTIVITY_WARNING,
                severity = AlertSeverity.WARNING,
                title = "No admin activity for $daysSinceLastLogin days",
                message = "We noticed you haven't logged in recently. Is there anything we can help with?",
                autoResolve = true,
                autoResolveCondition = "admin_login_detected",
                visibleToClient = true
            )
        }

        /**
         * Creates a milestone reached alert (positive).
         */
        fun milestoneReached(
            organizationId: UUID,
            milestone: String,
            achievement: String
        ): PlatformAlert {
            return PlatformAlert(
                organizationId = organizationId,
                type = AlertType.MILESTONE_REACHED,
                severity = AlertSeverity.SUCCESS,
                title = "🎉 $milestone",
                message = achievement,
                expiresAt = Instant.now().plusSeconds(7 * 24 * 60 * 60), // Expires in 7 days
                visibleToClient = true
            )
        }

        /**
         * Creates an onboarding stalled alert.
         */
        fun onboardingStalled(
            organizationId: UUID,
            daysSinceProgress: Int,
            completionPercent: Int
        ): PlatformAlert {
            return PlatformAlert(
                organizationId = organizationId,
                type = AlertType.ONBOARDING_STALLED,
                severity = AlertSeverity.WARNING,
                title = "Onboarding progress stalled",
                message = "This client is $completionPercent% complete but hasn't made progress in $daysSinceProgress days.",
                autoResolve = true,
                autoResolveCondition = "onboarding_progress_detected",
                visibleToClient = false // Internal alert
            )
        }

        /**
         * Creates a subscription expiring alert.
         */
        fun subscriptionExpiring(
            organizationId: UUID,
            daysRemaining: Int
        ): PlatformAlert {
            val severity = when {
                daysRemaining <= 7 -> AlertSeverity.CRITICAL
                daysRemaining <= 30 -> AlertSeverity.WARNING
                else -> AlertSeverity.INFO
            }
            return PlatformAlert(
                organizationId = organizationId,
                type = AlertType.SUBSCRIPTION_EXPIRING,
                severity = severity,
                title = "Subscription renewing in $daysRemaining days",
                message = "Your subscription will renew automatically. Review your plan or update payment method if needed.",
                actionUrl = "/settings/billing",
                actionLabel = "Review Billing",
                visibleToClient = true
            )
        }
    }
}
