package com.liyaqa.platform.application.services

import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.platform.api.dto.ClientHealthResponse
import com.liyaqa.platform.api.dto.HealthAlert
import com.liyaqa.platform.api.dto.HealthAlertSeverity
import com.liyaqa.platform.api.dto.HealthAlertType
import com.liyaqa.platform.domain.model.ClientSubscriptionStatus
import com.liyaqa.platform.domain.model.TicketStatus
import com.liyaqa.platform.domain.ports.ClientNoteRepository
import com.liyaqa.platform.domain.ports.ClientSubscriptionRepository
import com.liyaqa.platform.domain.ports.SupportTicketRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditLogRepository
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Service for calculating client health indicators.
 */
@Service
class ClientHealthService(
    private val organizationRepository: OrganizationRepository,
    private val clubRepository: ClubRepository,
    private val auditLogRepository: AuditLogRepository,
    private val supportTicketRepository: SupportTicketRepository,
    private val subscriptionRepository: ClientSubscriptionRepository,
    private val clientNoteRepository: ClientNoteRepository
) {

    /**
     * Get health indicators for a client organization.
     */
    @Transactional(readOnly = true)
    fun getClientHealth(organizationId: UUID): ClientHealthResponse {
        // Verify organization exists
        val organization = organizationRepository.findById(organizationId)
            .orElseThrow { NoSuchElementException("Organization not found: $organizationId") }

        // Get last activity from audit logs
        val auditPageable = PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt"))
        val lastActivityLogs = auditLogRepository.findByOrganizationId(organizationId, auditPageable)
        val lastActiveAt = lastActivityLogs.content.firstOrNull()?.createdAt

        // Get last login from audit logs
        val loginLogs = auditLogRepository.findByOrganizationIdAndAction(
            organizationId,
            AuditAction.LOGIN,
            auditPageable
        )
        val lastLoginAt = loginLogs.content.firstOrNull()?.createdAt

        // Count open support tickets
        val openTicketsCount = supportTicketRepository.countByOrganizationIdAndStatus(
            organizationId,
            TicketStatus.OPEN
        ).toInt() + supportTicketRepository.countByOrganizationIdAndStatus(
            organizationId,
            TicketStatus.IN_PROGRESS
        ).toInt()

        // Count active subscriptions
        val activeSubscriptionsCount = subscriptionRepository
            .countByOrganizationIdAndStatus(organizationId, ClientSubscriptionStatus.ACTIVE).toInt()

        // Count clubs
        val totalClubs = clubRepository.countByOrganizationId(organizationId).toInt()

        // Count notes
        val totalNotes = clientNoteRepository.countByOrganizationId(organizationId).toInt()

        // Calculate alerts
        val alerts = calculateAlerts(
            lastActiveAt = lastActiveAt,
            openTicketsCount = openTicketsCount,
            activeSubscriptionsCount = activeSubscriptionsCount,
            organizationId = organizationId
        )

        // Calculate health score
        val healthScore = calculateHealthScore(
            lastActiveAt = lastActiveAt,
            openTicketsCount = openTicketsCount,
            activeSubscriptionsCount = activeSubscriptionsCount,
            alerts = alerts
        )

        return ClientHealthResponse(
            lastActiveAt = lastActiveAt,
            lastLoginAt = lastLoginAt,
            openTicketsCount = openTicketsCount,
            activeSubscriptionsCount = activeSubscriptionsCount,
            totalClubs = totalClubs,
            totalNotes = totalNotes,
            healthScore = healthScore,
            alerts = alerts
        )
    }

    private fun calculateAlerts(
        lastActiveAt: Instant?,
        openTicketsCount: Int,
        activeSubscriptionsCount: Int,
        organizationId: UUID
    ): List<HealthAlert> {
        val alerts = mutableListOf<HealthAlert>()
        val now = Instant.now()

        // Check for no recent activity (7+ days)
        if (lastActiveAt == null) {
            alerts.add(
                HealthAlert(
                    type = HealthAlertType.NO_RECENT_ACTIVITY,
                    message = "No activity recorded for this client",
                    severity = HealthAlertSeverity.WARNING
                )
            )
        } else {
            val daysSinceActivity = ChronoUnit.DAYS.between(lastActiveAt, now)
            if (daysSinceActivity >= 30) {
                alerts.add(
                    HealthAlert(
                        type = HealthAlertType.NO_RECENT_ACTIVITY,
                        message = "No activity in the last 30 days",
                        severity = HealthAlertSeverity.CRITICAL
                    )
                )
            } else if (daysSinceActivity >= 7) {
                alerts.add(
                    HealthAlert(
                        type = HealthAlertType.NO_RECENT_ACTIVITY,
                        message = "No activity in the last 7 days",
                        severity = HealthAlertSeverity.WARNING
                    )
                )
            }
        }

        // Check for open tickets
        if (openTicketsCount >= 5) {
            alerts.add(
                HealthAlert(
                    type = HealthAlertType.OPEN_TICKETS,
                    message = "$openTicketsCount open support tickets",
                    severity = HealthAlertSeverity.CRITICAL
                )
            )
        } else if (openTicketsCount >= 2) {
            alerts.add(
                HealthAlert(
                    type = HealthAlertType.OPEN_TICKETS,
                    message = "$openTicketsCount open support tickets",
                    severity = HealthAlertSeverity.WARNING
                )
            )
        } else if (openTicketsCount == 1) {
            alerts.add(
                HealthAlert(
                    type = HealthAlertType.OPEN_TICKETS,
                    message = "1 open support ticket",
                    severity = HealthAlertSeverity.INFO
                )
            )
        }

        // Check for no active subscription
        if (activeSubscriptionsCount == 0) {
            alerts.add(
                HealthAlert(
                    type = HealthAlertType.NO_ACTIVE_SUBSCRIPTION,
                    message = "No active subscription",
                    severity = HealthAlertSeverity.CRITICAL
                )
            )
        }

        // Check for expiring subscriptions (within 30 days)
        val expiringSoon = subscriptionRepository.countExpiringWithinDays(organizationId, 30)
        if (expiringSoon > 0 && activeSubscriptionsCount > 0) {
            alerts.add(
                HealthAlert(
                    type = HealthAlertType.SUBSCRIPTION_EXPIRING_SOON,
                    message = "Subscription expires within 30 days",
                    severity = HealthAlertSeverity.WARNING
                )
            )
        }

        return alerts
    }

    private fun calculateHealthScore(
        lastActiveAt: Instant?,
        openTicketsCount: Int,
        activeSubscriptionsCount: Int,
        alerts: List<HealthAlert>
    ): Int {
        var score = 100

        // Deduct for critical alerts (-20 each)
        val criticalAlerts = alerts.count { it.severity == HealthAlertSeverity.CRITICAL }
        score -= criticalAlerts * 20

        // Deduct for warning alerts (-10 each)
        val warningAlerts = alerts.count { it.severity == HealthAlertSeverity.WARNING }
        score -= warningAlerts * 10

        // Deduct for info alerts (-5 each)
        val infoAlerts = alerts.count { it.severity == HealthAlertSeverity.INFO }
        score -= infoAlerts * 5

        // Activity bonus/penalty
        if (lastActiveAt != null) {
            val daysSinceActivity = ChronoUnit.DAYS.between(lastActiveAt, Instant.now())
            when {
                daysSinceActivity <= 1 -> score += 5 // Active today/yesterday bonus
                daysSinceActivity <= 3 -> { /* No change */ }
                daysSinceActivity <= 7 -> score -= 5
                daysSinceActivity <= 14 -> score -= 10
                daysSinceActivity <= 30 -> score -= 15
                else -> score -= 25
            }
        }

        // Ensure score is within 0-100
        return score.coerceIn(0, 100)
    }
}
