package com.liyaqa.platform.application.services

import com.liyaqa.platform.domain.model.AlertSeverity
import com.liyaqa.platform.domain.model.AlertType
import com.liyaqa.platform.domain.model.PlatformAlert
import com.liyaqa.platform.domain.ports.PlatformAlertRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing platform alerts.
 * Handles proactive notifications for client management.
 */
@Service
@Transactional
class AlertService(
    private val alertRepository: PlatformAlertRepository
) {
    /**
     * Creates a new alert.
     */
    fun createAlert(alert: PlatformAlert): PlatformAlert {
        // Check for existing active alert of same type for same organization
        if (alertRepository.existsActiveByTypeAndOrganizationId(alert.type, alert.organizationId)) {
            // Don't create duplicate alerts
            return alertRepository.findByTypeAndOrganizationId(alert.type, alert.organizationId)
                .first { it.isActive() }
        }
        return alertRepository.save(alert)
    }

    /**
     * Creates a usage limit warning alert.
     */
    fun createUsageLimitWarning(
        organizationId: UUID,
        resource: String,
        currentUsage: Int,
        maxUsage: Int,
        percentUsed: Int
    ): PlatformAlert {
        val alert = PlatformAlert.usageLimitWarning(organizationId, resource, currentUsage, maxUsage, percentUsed)
        return createAlert(alert)
    }

    /**
     * Creates a payment failed alert.
     */
    fun createPaymentFailedAlert(
        organizationId: UUID,
        invoiceId: UUID,
        amount: String
    ): PlatformAlert {
        val alert = PlatformAlert.paymentFailed(organizationId, invoiceId, amount)
        return createAlert(alert)
    }

    /**
     * Creates a trial ending alert.
     */
    fun createTrialEndingAlert(
        organizationId: UUID,
        daysRemaining: Int
    ): PlatformAlert {
        val alert = PlatformAlert.trialEnding(organizationId, daysRemaining)
        return createAlert(alert)
    }

    /**
     * Creates a churn risk alert.
     */
    fun createChurnRiskAlert(
        organizationId: UUID,
        healthScore: Int,
        primaryReason: String
    ): PlatformAlert {
        val alert = PlatformAlert.churnRisk(organizationId, healthScore, primaryReason)
        return createAlert(alert)
    }

    /**
     * Creates an inactivity warning alert.
     */
    fun createInactivityAlert(
        organizationId: UUID,
        daysSinceLastLogin: Int
    ): PlatformAlert {
        val alert = PlatformAlert.inactivityWarning(organizationId, daysSinceLastLogin)
        return createAlert(alert)
    }

    /**
     * Creates a milestone reached alert.
     */
    fun createMilestoneAlert(
        organizationId: UUID,
        milestone: String,
        achievement: String
    ): PlatformAlert {
        val alert = PlatformAlert.milestoneReached(organizationId, milestone, achievement)
        return createAlert(alert)
    }

    /**
     * Creates an onboarding stalled alert.
     */
    fun createOnboardingStalledAlert(
        organizationId: UUID,
        daysSinceProgress: Int,
        completionPercent: Int
    ): PlatformAlert {
        val alert = PlatformAlert.onboardingStalled(organizationId, daysSinceProgress, completionPercent)
        return createAlert(alert)
    }

    /**
     * Creates a subscription expiring alert.
     */
    fun createSubscriptionExpiringAlert(
        organizationId: UUID,
        daysRemaining: Int
    ): PlatformAlert {
        val alert = PlatformAlert.subscriptionExpiring(organizationId, daysRemaining)
        return createAlert(alert)
    }

    /**
     * Gets an alert by ID.
     */
    @Transactional(readOnly = true)
    fun getById(id: UUID): PlatformAlert {
        return alertRepository.findById(id)
            .orElseThrow { NoSuchElementException("Alert not found: $id") }
    }

    /**
     * Gets all active alerts for an organization.
     */
    @Transactional(readOnly = true)
    fun getActiveAlerts(organizationId: UUID, pageable: Pageable): Page<PlatformAlert> {
        return alertRepository.findActiveByOrganizationId(organizationId, pageable)
    }

    /**
     * Gets alerts visible to the client.
     */
    @Transactional(readOnly = true)
    fun getClientVisibleAlerts(organizationId: UUID, pageable: Pageable): Page<PlatformAlert> {
        return alertRepository.findVisibleToClient(organizationId, pageable)
    }

    /**
     * Gets all active alerts (platform-wide).
     */
    @Transactional(readOnly = true)
    fun getAllActiveAlerts(pageable: Pageable): Page<PlatformAlert> {
        return alertRepository.findActive(pageable)
    }

    /**
     * Gets unacknowledged alerts.
     */
    @Transactional(readOnly = true)
    fun getUnacknowledgedAlerts(pageable: Pageable): Page<PlatformAlert> {
        return alertRepository.findUnacknowledged(pageable)
    }

    /**
     * Gets critical unacknowledged alerts.
     */
    @Transactional(readOnly = true)
    fun getCriticalUnacknowledgedAlerts(pageable: Pageable): Page<PlatformAlert> {
        return alertRepository.findCriticalUnacknowledged(pageable)
    }

    /**
     * Gets alerts by type.
     */
    @Transactional(readOnly = true)
    fun getByType(type: AlertType, pageable: Pageable): Page<PlatformAlert> {
        return alertRepository.findByType(type, pageable)
    }

    /**
     * Gets alerts by severity.
     */
    @Transactional(readOnly = true)
    fun getBySeverity(severity: AlertSeverity, pageable: Pageable): Page<PlatformAlert> {
        return alertRepository.findBySeverity(severity, pageable)
    }

    /**
     * Acknowledges an alert.
     */
    fun acknowledgeAlert(alertId: UUID, userId: UUID): PlatformAlert {
        val alert = getById(alertId)
        alert.acknowledge(userId)
        return alertRepository.save(alert)
    }

    /**
     * Resolves an alert.
     */
    fun resolveAlert(alertId: UUID, userId: UUID? = null, notes: String? = null): PlatformAlert {
        val alert = getById(alertId)
        alert.resolve(userId, notes)
        return alertRepository.save(alert)
    }

    /**
     * Auto-resolves alerts that meet their conditions.
     */
    fun autoResolveAlert(alertId: UUID): PlatformAlert {
        val alert = getById(alertId)
        alert.autoResolveNow()
        return alertRepository.save(alert)
    }

    /**
     * Dismisses an alert for the client.
     */
    fun dismissAlertForClient(alertId: UUID): PlatformAlert {
        val alert = getById(alertId)
        alert.dismissForClient()
        return alertRepository.save(alert)
    }

    /**
     * Reopens a resolved alert.
     */
    fun reopenAlert(alertId: UUID): PlatformAlert {
        val alert = getById(alertId)
        alert.reopen()
        return alertRepository.save(alert)
    }

    /**
     * Deletes expired alerts.
     */
    fun cleanupExpiredAlerts(): Int {
        return alertRepository.deleteExpired()
    }

    /**
     * Gets alert statistics.
     */
    @Transactional(readOnly = true)
    fun getStatistics(): AlertStatistics {
        return AlertStatistics(
            totalActive = alertRepository.countActive(),
            unacknowledged = alertRepository.countUnacknowledged(),
            critical = alertRepository.countBySeverity(AlertSeverity.CRITICAL),
            warning = alertRepository.countBySeverity(AlertSeverity.WARNING),
            info = alertRepository.countBySeverity(AlertSeverity.INFO),
            success = alertRepository.countBySeverity(AlertSeverity.SUCCESS)
        )
    }

    /**
     * Gets the count of active alerts for an organization.
     */
    @Transactional(readOnly = true)
    fun getActiveAlertCount(organizationId: UUID): Long {
        return alertRepository.countActiveByOrganizationId(organizationId)
    }
}

/**
 * Alert statistics for platform dashboard.
 */
data class AlertStatistics(
    val totalActive: Long,
    val unacknowledged: Long,
    val critical: Long,
    val warning: Long,
    val info: Long,
    val success: Long
)
