package com.liyaqa.platform.monitoring.controller

import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.shared.api.AuditLogResponse
import com.liyaqa.shared.api.toResponse
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/client-audit")
@PlatformSecured
@Tag(name = "Platform Client Audit", description = "Platform-scoped access to facility-level audit logs")
class PlatformClientAuditController(
    private val auditService: AuditService
) {

    @Operation(summary = "Get organization audit logs", description = "Get all audit logs for a specific client organization")
    @GetMapping("/organization/{organizationId}")
    @PlatformSecured(permissions = [PlatformPermission.AUDIT_LOGS_VIEW])
    fun getOrganizationAuditLogs(
        @PathVariable organizationId: UUID,
        @RequestParam(required = false) action: AuditAction?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDirection: String
    ): ResponseEntity<Page<AuditLogResponse>> {
        val sort = if (sortDirection.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable: Pageable = PageRequest.of(page, size.coerceAtMost(100), sort)

        val result = when {
            action != null -> auditService.getAuditLogsByOrganizationAndAction(organizationId, action, pageable)
            startDate != null && endDate != null -> {
                val startInstant = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant()
                val endInstant = endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()
                auditService.getAuditLogsByOrganizationAndDateRange(organizationId, startInstant, endInstant, pageable)
            }
            else -> auditService.getAuditLogsByOrganization(organizationId, pageable)
        }

        return ResponseEntity.ok(result.map { it.toResponse() })
    }
}
