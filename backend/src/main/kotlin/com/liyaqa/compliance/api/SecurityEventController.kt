package com.liyaqa.compliance.api

import com.liyaqa.compliance.application.services.SecurityEventService
import com.liyaqa.compliance.application.services.SecurityStats
import com.liyaqa.compliance.domain.model.SecurityEvent
import com.liyaqa.compliance.domain.model.SecurityEventType
import com.liyaqa.compliance.domain.model.SecurityOutcome
import com.liyaqa.compliance.domain.model.SecuritySeverity
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

data class SecurityEventResponse(
    val id: UUID,
    val tenantId: UUID,
    val eventType: SecurityEventType,
    val severity: SecuritySeverity,
    val sourceIp: String?,
    val userId: UUID?,
    val userAgent: String?,
    val resourceType: String?,
    val resourceId: String?,
    val action: String?,
    val outcome: SecurityOutcome?,
    val details: Map<String, Any>?,
    val riskScore: Int,
    val investigated: Boolean,
    val investigatedBy: UUID?,
    val investigatedAt: Instant?,
    val investigationNotes: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(event: SecurityEvent) = SecurityEventResponse(
            id = event.id,
            tenantId = event.tenantId,
            eventType = event.eventType,
            severity = event.severity,
            sourceIp = event.sourceIp,
            userId = event.userId,
            userAgent = event.userAgent,
            resourceType = event.resourceType,
            resourceId = event.resourceId,
            action = event.action,
            outcome = event.outcome,
            details = event.details,
            riskScore = event.riskScore,
            investigated = event.investigated,
            investigatedBy = event.investigatedBy,
            investigatedAt = event.investigatedAt,
            investigationNotes = event.investigationNotes,
            createdAt = event.createdAt
        )
    }
}

data class InvestigateEventRequest(
    val notes: String? = null
)

@RestController
@RequestMapping("/api/security-events")
@Tag(name = "Security Events", description = "Security event logging and monitoring")
class SecurityEventController(
    private val securityEventService: SecurityEventService
) {
    @GetMapping
    @PreAuthorize("hasAuthority('security_events_view')")
    @Operation(summary = "Get security events")
    fun getEvents(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<SecurityEventResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val events = securityEventService.getEvents(pageable)
        return ResponseEntity.ok(events.content.map { SecurityEventResponse.from(it) })
    }

    @GetMapping("/type/{eventType}")
    @PreAuthorize("hasAuthority('security_events_view')")
    @Operation(summary = "Get events by type")
    fun getEventsByType(
        @PathVariable eventType: SecurityEventType,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<SecurityEventResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val events = securityEventService.getEventsByType(eventType, pageable)
        return ResponseEntity.ok(events.content.map { SecurityEventResponse.from(it) })
    }

    @GetMapping("/severity/{severity}")
    @PreAuthorize("hasAuthority('security_events_view')")
    @Operation(summary = "Get events by severity")
    fun getEventsBySeverity(
        @PathVariable severity: SecuritySeverity,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<SecurityEventResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val events = securityEventService.getEventsBySeverity(severity, pageable)
        return ResponseEntity.ok(events.content.map { SecurityEventResponse.from(it) })
    }

    @GetMapping("/uninvestigated")
    @PreAuthorize("hasAuthority('security_events_view')")
    @Operation(summary = "Get uninvestigated events")
    fun getUninvestigatedEvents(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<SecurityEventResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val events = securityEventService.getUninvestigatedEvents(pageable)
        return ResponseEntity.ok(events.content.map { SecurityEventResponse.from(it) })
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('security_events_view')")
    @Operation(summary = "Get events for a user")
    fun getEventsByUser(
        @PathVariable userId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<SecurityEventResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val events = securityEventService.getEventsByUser(userId, pageable)
        return ResponseEntity.ok(events.content.map { SecurityEventResponse.from(it) })
    }

    @GetMapping("/range")
    @PreAuthorize("hasAuthority('security_events_view')")
    @Operation(summary = "Get events by date range")
    fun getEventsByDateRange(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) startDate: Instant,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) endDate: Instant,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<SecurityEventResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val events = securityEventService.getEventsByDateRange(startDate, endDate, pageable)
        return ResponseEntity.ok(events.content.map { SecurityEventResponse.from(it) })
    }

    @PostMapping("/{id}/investigate")
    @PreAuthorize("hasAuthority('security_events_investigate')")
    @Operation(summary = "Mark event as investigated")
    fun investigateEvent(
        @PathVariable id: UUID,
        @RequestBody request: InvestigateEventRequest
    ): ResponseEntity<SecurityEventResponse> {
        val userId = getCurrentUserId()
        val event = securityEventService.investigateEvent(id, userId, request.notes)
        return ResponseEntity.ok(SecurityEventResponse.from(event))
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('security_events_view')")
    @Operation(summary = "Get security event statistics")
    fun getStats(): ResponseEntity<SecurityStats> {
        val stats = securityEventService.getSecurityStats()
        return ResponseEntity.ok(stats)
    }

    @GetMapping("/recent-high-severity")
    @PreAuthorize("hasAuthority('security_events_view')")
    @Operation(summary = "Get recent high-severity events (last 24 hours)")
    fun getRecentHighSeverityEvents(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<SecurityEventResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val events = securityEventService.getRecentHighSeverityEvents(pageable)
        return ResponseEntity.ok(events.content.map { SecurityEventResponse.from(it) })
    }

    private fun getCurrentUserId(): UUID {
        val auth = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found")
        return UUID.fromString(auth.name)
    }
}
