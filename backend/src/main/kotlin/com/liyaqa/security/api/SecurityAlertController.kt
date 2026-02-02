package com.liyaqa.security.api

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.security.domain.model.AlertSeverity
import com.liyaqa.security.domain.model.SecurityAlert
import com.liyaqa.security.domain.ports.SecurityAlertRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/api/security/alerts")
@Tag(name = "Security Alerts", description = "Security anomaly alerts and monitoring")
class SecurityAlertController(
    private val securityAlertRepository: SecurityAlertRepository
) {

    @Operation(
        summary = "List User Security Alerts",
        description = "Returns security alerts for the authenticated user"
    )
    @GetMapping
    fun listAlerts(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(required = false) unreadOnly: Boolean?
    ): ResponseEntity<List<SecurityAlertResponse>> {
        val alerts = if (unreadOnly == true) {
            securityAlertRepository.findUnreadByUserId(principal.userId)
        } else {
            securityAlertRepository.findUnresolvedByUserId(principal.userId)
        }

        val response = alerts.map { SecurityAlertResponse.from(it) }
        return ResponseEntity.ok(response)
    }

    @Operation(
        summary = "Get Unresolved Alert Count",
        description = "Returns count of unresolved security alerts"
    )
    @GetMapping("/count")
    fun getUnreadCount(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<Map<String, Long>> {
        val count = securityAlertRepository.countUnreadByUserId(principal.userId)
        return ResponseEntity.ok(mapOf("count" to count))
    }

    @Operation(
        summary = "Acknowledge Alert",
        description = "Marks a security alert as acknowledged/resolved"
    )
    @PostMapping("/{alertId}/acknowledge")
    fun acknowledgeAlert(
        @PathVariable alertId: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<Unit> {
        val alert = securityAlertRepository.findByIdOrNull(alertId)
            ?: return ResponseEntity.notFound().build()

        if (alert.userId != principal.userId) {
            return ResponseEntity.status(403).build()
        }

        alert.acknowledge()
        securityAlertRepository.save(alert)

        return ResponseEntity.noContent().build()
    }
}

data class SecurityAlertResponse(
    val id: UUID,
    val alertType: String,
    val severity: AlertSeverity,
    val details: String?,
    val resolved: Boolean,
    val acknowledgedAt: Instant?,
    val createdAt: Instant
) {
    companion object {
        fun from(alert: SecurityAlert): SecurityAlertResponse {
            return SecurityAlertResponse(
                id = alert.id!!,
                alertType = alert.alertType.name,
                severity = alert.severity,
                details = alert.details,
                resolved = alert.resolved,
                acknowledgedAt = alert.acknowledgedAt,
                createdAt = alert.createdAt
            )
        }
    }
}
