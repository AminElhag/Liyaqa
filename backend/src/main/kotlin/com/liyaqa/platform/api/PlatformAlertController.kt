package com.liyaqa.platform.api

import com.liyaqa.platform.application.services.AlertService
import com.liyaqa.platform.application.services.AlertStatistics
import com.liyaqa.platform.domain.model.AlertSeverity
import com.liyaqa.platform.domain.model.AlertType
import com.liyaqa.platform.domain.model.PlatformAlert
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * Controller for platform alerts management.
 * Provides endpoints for viewing and managing platform alerts.
 *
 * Endpoints:
 * - GET /api/platform/alerts                            - Get all active alerts
 * - GET /api/platform/alerts/statistics                 - Get alert statistics
 * - GET /api/platform/alerts/unacknowledged             - Get unacknowledged alerts
 * - GET /api/platform/alerts/critical                   - Get critical unacknowledged alerts
 * - GET /api/platform/alerts/by-type/{type}             - Get by type
 * - GET /api/platform/alerts/by-severity/{severity}     - Get by severity
 * - GET /api/platform/alerts/organization/{orgId}       - Get for organization
 * - GET /api/platform/alerts/{alertId}                  - Get alert by ID
 * - POST /api/platform/alerts/{alertId}/acknowledge     - Acknowledge alert
 * - POST /api/platform/alerts/{alertId}/resolve         - Resolve alert
 * - POST /api/platform/alerts/{alertId}/dismiss         - Dismiss alert
 * - POST /api/platform/alerts/bulk-acknowledge          - Bulk acknowledge
 * - POST /api/platform/alerts/bulk-resolve              - Bulk resolve
 */
@RestController
@RequestMapping("/api/platform/alerts")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
class PlatformAlertController(
    private val alertService: AlertService
) {
    /**
     * Gets all active alerts.
     */
    @GetMapping
    fun getActive(pageable: Pageable): ResponseEntity<Page<PlatformAlertResponse>> {
        val page = alertService.getAllActiveAlerts(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets alert statistics.
     */
    @GetMapping("/statistics")
    fun getStatistics(): ResponseEntity<AlertStatistics> {
        val stats = alertService.getStatistics()
        return ResponseEntity.ok(stats)
    }

    /**
     * Gets unacknowledged alerts.
     */
    @GetMapping("/unacknowledged")
    fun getUnacknowledged(pageable: Pageable): ResponseEntity<Page<PlatformAlertResponse>> {
        val page = alertService.getUnacknowledgedAlerts(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets critical unacknowledged alerts.
     */
    @GetMapping("/critical")
    fun getCriticalUnacknowledged(pageable: Pageable): ResponseEntity<Page<PlatformAlertResponse>> {
        val page = alertService.getCriticalUnacknowledgedAlerts(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets alerts by type.
     */
    @GetMapping("/by-type/{type}")
    fun getByType(
        @PathVariable type: AlertType,
        pageable: Pageable
    ): ResponseEntity<Page<PlatformAlertResponse>> {
        val page = alertService.getByType(type, pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets alerts by severity.
     */
    @GetMapping("/by-severity/{severity}")
    fun getBySeverity(
        @PathVariable severity: AlertSeverity,
        pageable: Pageable
    ): ResponseEntity<Page<PlatformAlertResponse>> {
        val page = alertService.getBySeverity(severity, pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets active alerts for an organization.
     */
    @GetMapping("/organization/{organizationId}")
    fun getByOrganizationId(
        @PathVariable organizationId: UUID,
        pageable: Pageable
    ): ResponseEntity<Page<PlatformAlertResponse>> {
        val page = alertService.getActiveAlerts(organizationId, pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets an alert by ID.
     */
    @GetMapping("/{alertId}")
    fun getById(@PathVariable alertId: UUID): ResponseEntity<PlatformAlertResponse> {
        val alert = alertService.getById(alertId)
        return ResponseEntity.ok(alert.toResponse())
    }

    /**
     * Acknowledges an alert.
     */
    @PostMapping("/{alertId}/acknowledge")
    fun acknowledge(
        @PathVariable alertId: UUID,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<PlatformAlertResponse> {
        // In a real implementation, extract user ID from authentication
        val userId = UUID.randomUUID() // Placeholder
        val alert = alertService.acknowledgeAlert(alertId, userId)
        return ResponseEntity.ok(alert.toResponse())
    }

    /**
     * Resolves an alert.
     */
    @PostMapping("/{alertId}/resolve")
    fun resolve(
        @PathVariable alertId: UUID,
        @RequestBody(required = false) request: ResolveAlertRequest?,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<PlatformAlertResponse> {
        val userId = UUID.randomUUID() // Placeholder
        val alert = alertService.resolveAlert(alertId, userId, request?.notes)
        return ResponseEntity.ok(alert.toResponse())
    }

    /**
     * Dismisses an alert for the client.
     */
    @PostMapping("/{alertId}/dismiss")
    fun dismiss(@PathVariable alertId: UUID): ResponseEntity<PlatformAlertResponse> {
        val alert = alertService.dismissAlertForClient(alertId)
        return ResponseEntity.ok(alert.toResponse())
    }

    /**
     * Bulk acknowledge alerts.
     */
    @PostMapping("/bulk-acknowledge")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun bulkAcknowledge(
        @RequestBody request: BulkAlertRequest,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<BulkAlertResponse> {
        val userId = UUID.randomUUID() // Placeholder
        val results = request.alertIds.map { alertId ->
            try {
                alertService.acknowledgeAlert(alertId, userId)
                alertId to true
            } catch (e: Exception) {
                alertId to false
            }
        }
        return ResponseEntity.ok(BulkAlertResponse(
            successCount = results.count { it.second },
            failedCount = results.count { !it.second },
            failedIds = results.filter { !it.second }.map { it.first }
        ))
    }

    /**
     * Bulk resolve alerts.
     */
    @PostMapping("/bulk-resolve")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun bulkResolve(
        @RequestBody request: BulkAlertRequest,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<BulkAlertResponse> {
        val userId = UUID.randomUUID() // Placeholder
        val results = request.alertIds.map { alertId ->
            try {
                alertService.resolveAlert(alertId, userId)
                alertId to true
            } catch (e: Exception) {
                alertId to false
            }
        }
        return ResponseEntity.ok(BulkAlertResponse(
            successCount = results.count { it.second },
            failedCount = results.count { !it.second },
            failedIds = results.filter { !it.second }.map { it.first }
        ))
    }
}

/**
 * Response DTO for platform alert.
 */
data class PlatformAlertResponse(
    val id: UUID,
    val organizationId: UUID,
    val type: AlertType,
    val severity: AlertSeverity,
    val title: String,
    val message: String,
    val actionUrl: String?,
    val actionLabel: String?,
    val createdAt: String,
    val acknowledgedAt: String?,
    val acknowledgedBy: UUID?,
    val resolvedAt: String?,
    val resolvedBy: UUID?,
    val isActive: Boolean
)

/**
 * Request DTO for resolving an alert.
 */
data class ResolveAlertRequest(
    val notes: String?
)

/**
 * Request DTO for bulk alert operations.
 */
data class BulkAlertRequest(
    val alertIds: List<UUID>
)

/**
 * Response DTO for bulk alert operations.
 */
data class BulkAlertResponse(
    val successCount: Int,
    val failedCount: Int,
    val failedIds: List<UUID>
)

/**
 * Extension function to convert PlatformAlert to response DTO.
 */
private fun PlatformAlert.toResponse() = PlatformAlertResponse(
    id = this.id,
    organizationId = this.organizationId,
    type = this.type,
    severity = this.severity,
    title = this.title,
    message = this.message,
    actionUrl = this.actionUrl,
    actionLabel = this.actionLabel,
    createdAt = this.createdAt.toString(),
    acknowledgedAt = this.acknowledgedAt?.toString(),
    acknowledgedBy = this.acknowledgedBy,
    resolvedAt = this.resolvedAt?.toString(),
    resolvedBy = this.resolvedBy,
    isActive = this.isActive()
)
