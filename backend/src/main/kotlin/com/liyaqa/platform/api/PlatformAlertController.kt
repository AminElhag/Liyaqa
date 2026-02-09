package com.liyaqa.platform.api

import com.liyaqa.platform.application.services.AlertService
import com.liyaqa.platform.application.services.AlertStatistics
import com.liyaqa.platform.domain.model.AlertSeverity
import com.liyaqa.platform.domain.model.AlertType
import com.liyaqa.platform.domain.model.PlatformAlert
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.infrastructure.security.PlatformSecured
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
@PlatformSecured
@Tag(name = "Platform Alerts", description = "Manage platform alerts and notifications")
class PlatformAlertController(
    private val alertService: AlertService
) {
    /**
     * Gets all active alerts.
     */
    @Operation(summary = "Get active alerts", description = "Returns a paginated list of all currently active platform alerts.")
    @ApiResponse(responseCode = "200", description = "Active alerts retrieved successfully")
    @GetMapping
    fun getActive(pageable: Pageable): ResponseEntity<Page<PlatformAlertResponse>> {
        val page = alertService.getAllActiveAlerts(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets alert statistics.
     */
    @Operation(summary = "Get alert statistics", description = "Returns aggregated statistics about platform alerts (counts by severity, type, etc.).")
    @ApiResponse(responseCode = "200", description = "Alert statistics retrieved successfully")
    @GetMapping("/statistics")
    fun getStatistics(): ResponseEntity<AlertStatistics> {
        val stats = alertService.getStatistics()
        return ResponseEntity.ok(stats)
    }

    /**
     * Gets unacknowledged alerts.
     */
    @Operation(summary = "Get unacknowledged alerts", description = "Returns a paginated list of alerts that have not yet been acknowledged.")
    @ApiResponse(responseCode = "200", description = "Unacknowledged alerts retrieved successfully")
    @GetMapping("/unacknowledged")
    fun getUnacknowledged(pageable: Pageable): ResponseEntity<Page<PlatformAlertResponse>> {
        val page = alertService.getUnacknowledgedAlerts(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets critical unacknowledged alerts.
     */
    @Operation(summary = "Get critical unacknowledged alerts", description = "Returns a paginated list of critical-severity alerts that have not been acknowledged.")
    @ApiResponse(responseCode = "200", description = "Critical unacknowledged alerts retrieved successfully")
    @GetMapping("/critical")
    fun getCriticalUnacknowledged(pageable: Pageable): ResponseEntity<Page<PlatformAlertResponse>> {
        val page = alertService.getCriticalUnacknowledgedAlerts(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets alerts by type.
     */
    @Operation(summary = "Get alerts by type", description = "Returns a paginated list of alerts filtered by alert type.")
    @ApiResponse(responseCode = "200", description = "Alerts retrieved successfully")
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
    @Operation(summary = "Get alerts by severity", description = "Returns a paginated list of alerts filtered by severity level.")
    @ApiResponse(responseCode = "200", description = "Alerts retrieved successfully")
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
    @Operation(summary = "Get alerts by organization", description = "Returns a paginated list of active alerts for a specific organization.")
    @ApiResponse(responseCode = "200", description = "Organization alerts retrieved successfully")
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
    @Operation(summary = "Get an alert by ID", description = "Retrieves the details of a specific platform alert.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Alert found"),
        ApiResponse(responseCode = "404", description = "Alert not found")
    ])
    @GetMapping("/{alertId}")
    fun getById(@PathVariable alertId: UUID): ResponseEntity<PlatformAlertResponse> {
        val alert = alertService.getById(alertId)
        return ResponseEntity.ok(alert.toResponse())
    }

    /**
     * Acknowledges an alert.
     */
    @Operation(summary = "Acknowledge an alert", description = "Marks an alert as acknowledged by the current user.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Alert acknowledged successfully"),
        ApiResponse(responseCode = "404", description = "Alert not found"),
        ApiResponse(responseCode = "422", description = "Alert is already acknowledged or resolved")
    ])
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
    @Operation(summary = "Resolve an alert", description = "Marks an alert as resolved with optional resolution notes.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Alert resolved successfully"),
        ApiResponse(responseCode = "404", description = "Alert not found"),
        ApiResponse(responseCode = "422", description = "Alert is already resolved")
    ])
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
    @Operation(summary = "Dismiss an alert", description = "Dismisses an alert so it is no longer visible to the client.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Alert dismissed successfully"),
        ApiResponse(responseCode = "404", description = "Alert not found")
    ])
    @PostMapping("/{alertId}/dismiss")
    fun dismiss(@PathVariable alertId: UUID): ResponseEntity<PlatformAlertResponse> {
        val alert = alertService.dismissAlertForClient(alertId)
        return ResponseEntity.ok(alert.toResponse())
    }

    /**
     * Bulk acknowledge alerts.
     */
    @Operation(summary = "Bulk acknowledge alerts", description = "Acknowledges multiple alerts in a single request. Requires PLATFORM_ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Bulk acknowledge completed (partial failures possible)")
    @PostMapping("/bulk-acknowledge")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
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
    @Operation(summary = "Bulk resolve alerts", description = "Resolves multiple alerts in a single request. Requires PLATFORM_ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Bulk resolve completed (partial failures possible)")
    @PostMapping("/bulk-resolve")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
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
