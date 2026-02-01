package com.liyaqa.security.api

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.security.domain.model.AlertType
import com.liyaqa.security.domain.model.SecurityAlert
import com.liyaqa.security.domain.model.Severity
import com.liyaqa.security.domain.ports.SecurityAlertRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for security alerts.
 */
@RestController
@RequestMapping("/api/security/alerts")
class SecurityAlertController(
    private val securityAlertRepository: SecurityAlertRepository
) {

    /**
     * Gets all security alerts for the authenticated user.
     */
    @GetMapping
    fun getAlerts(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) resolved: Boolean?
    ): ResponseEntity<SecurityAlertPageResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val alerts = securityAlertRepository.findByUserId(principal.userId, pageable)

        val filteredAlerts = if (resolved != null) {
            alerts.filter { it.resolved == resolved }
        } else {
            alerts.content
        }

        return ResponseEntity.ok(
            SecurityAlertPageResponse(
                content = filteredAlerts.map { SecurityAlertDto.from(it) },
                totalElements = alerts.totalElements,
                totalPages = alerts.totalPages,
                currentPage = page,
                pageSize = size
            )
        )
    }

    /**
     * Gets unread security alerts for the authenticated user.
     */
    @GetMapping("/unread")
    fun getUnreadAlerts(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<SecurityAlertsResponse> {
        val alerts = securityAlertRepository.findUnreadByUserId(principal.userId)
        return ResponseEntity.ok(
            SecurityAlertsResponse(
                alerts = alerts.map { SecurityAlertDto.from(it) },
                count = alerts.size
            )
        )
    }

    /**
     * Gets count of unread alerts.
     */
    @GetMapping("/unread/count")
    fun getUnreadCount(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<UnreadCountResponse> {
        val count = securityAlertRepository.countUnreadByUserId(principal.userId)
        return ResponseEntity.ok(UnreadCountResponse(count))
    }

    /**
     * Acknowledges a specific alert.
     */
    @PostMapping("/{alertId}/acknowledge")
    fun acknowledgeAlert(
        @PathVariable alertId: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MessageResponse> {
        val alert = securityAlertRepository.findByIdOrNull(alertId)
            ?: return ResponseEntity.notFound().build()

        if (alert.userId != principal.userId) {
            return ResponseEntity.status(403).body(MessageResponse("Not authorized"))
        }

        alert.acknowledge()
        securityAlertRepository.save(alert)

        return ResponseEntity.ok(MessageResponse("Alert acknowledged"))
    }

    /**
     * Dismisses a specific alert.
     */
    @PostMapping("/{alertId}/dismiss")
    fun dismissAlert(
        @PathVariable alertId: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MessageResponse> {
        val alert = securityAlertRepository.findByIdOrNull(alertId)
            ?: return ResponseEntity.notFound().build()

        if (alert.userId != principal.userId) {
            return ResponseEntity.status(403).body(MessageResponse("Not authorized"))
        }

        alert.dismiss()
        securityAlertRepository.save(alert)

        return ResponseEntity.ok(MessageResponse("Alert dismissed"))
    }

    /**
     * Acknowledges all unread alerts.
     */
    @PostMapping("/acknowledge-all")
    fun acknowledgeAllAlerts(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MessageResponse> {
        val unreadAlerts = securityAlertRepository.findUnreadByUserId(principal.userId)

        unreadAlerts.forEach { alert ->
            alert.acknowledge()
            securityAlertRepository.save(alert)
        }

        return ResponseEntity.ok(MessageResponse("All alerts acknowledged"))
    }
}

/**
 * DTO for security alert.
 */
data class SecurityAlertDto(
    val id: UUID,
    val alertType: String,
    val severity: String,
    val description: String,
    val details: String?,
    val ipAddress: String?,
    val deviceInfo: String?,
    val location: String?,
    val resolved: Boolean,
    val acknowledgedAt: String?,
    val createdAt: String
) {
    companion object {
        fun from(alert: SecurityAlert): SecurityAlertDto {
            return SecurityAlertDto(
                id = alert.id,
                alertType = alert.alertType.name,
                severity = alert.severity.name,
                description = alert.getDescription(),
                details = alert.details,
                ipAddress = alert.ipAddress,
                deviceInfo = alert.deviceInfo,
                location = alert.location,
                resolved = alert.resolved,
                acknowledgedAt = alert.acknowledgedAt?.toString(),
                createdAt = alert.createdAt.toString()
            )
        }
    }
}

/**
 * Response for paginated alerts.
 */
data class SecurityAlertPageResponse(
    val content: List<SecurityAlertDto>,
    val totalElements: Long,
    val totalPages: Int,
    val currentPage: Int,
    val pageSize: Int
)

/**
 * Response for list of alerts.
 */
data class SecurityAlertsResponse(
    val alerts: List<SecurityAlertDto>,
    val count: Int
)

/**
 * Response for unread count.
 */
data class UnreadCountResponse(
    val count: Long
)

/**
 * Generic message response.
 */
data class MessageResponse(
    val message: String
)
