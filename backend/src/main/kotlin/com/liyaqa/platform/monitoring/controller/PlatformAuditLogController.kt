package com.liyaqa.platform.monitoring.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.platform.monitoring.dto.AuditActionResponse
import com.liyaqa.platform.monitoring.dto.AuditResourceTypeResponse
import com.liyaqa.platform.monitoring.dto.PlatformAuditLogResponse
import com.liyaqa.platform.monitoring.model.PlatformAuditAction
import com.liyaqa.platform.monitoring.model.PlatformAuditResourceType
import com.liyaqa.platform.monitoring.service.PlatformAuditLogService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/audit-logs")
@PlatformSecured
@Tag(name = "Platform Audit Logs", description = "Platform audit log search and export")
class PlatformAuditLogController(
    private val auditLogService: PlatformAuditLogService,
    private val objectMapper: ObjectMapper
) {

    @Operation(summary = "Search audit logs with filters")
    @GetMapping
    @PlatformSecured(permissions = [PlatformPermission.AUDIT_LOGS_VIEW])
    fun search(
        @RequestParam(required = false) action: PlatformAuditAction?,
        @RequestParam(required = false) actorId: UUID?,
        @RequestParam(required = false) resourceType: PlatformAuditResourceType?,
        @RequestParam(required = false) tenantId: UUID?,
        @RequestParam(required = false) dateFrom: Instant?,
        @RequestParam(required = false) dateTo: Instant?,
        @RequestParam(required = false) search: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<Page<PlatformAuditLogResponse>> {
        val results = auditLogService.search(
            action, actorId, resourceType, tenantId, dateFrom, dateTo, search,
            PageRequest.of(page, size)
        )
        return ResponseEntity.ok(results.map { PlatformAuditLogResponse.from(it, objectMapper) })
    }

    @Operation(summary = "Export audit logs as CSV")
    @GetMapping("/export")
    @PlatformSecured(permissions = [PlatformPermission.AUDIT_LOGS_VIEW, PlatformPermission.ANALYTICS_EXPORT])
    fun exportCsv(
        @RequestParam(required = false) action: PlatformAuditAction?,
        @RequestParam(required = false) actorId: UUID?,
        @RequestParam(required = false) resourceType: PlatformAuditResourceType?,
        @RequestParam(required = false) tenantId: UUID?,
        @RequestParam(required = false) dateFrom: Instant?,
        @RequestParam(required = false) dateTo: Instant?,
        @RequestParam(required = false) search: String?
    ): ResponseEntity<ByteArray> {
        val csv = auditLogService.exportCsv(action, actorId, resourceType, tenantId, dateFrom, dateTo, search)
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-logs-${LocalDate.now()}.csv\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(csv)
    }

    @Operation(summary = "List available audit actions")
    @GetMapping("/actions")
    @PlatformSecured(permissions = [PlatformPermission.AUDIT_LOGS_VIEW])
    fun getActions(): ResponseEntity<List<AuditActionResponse>> {
        return ResponseEntity.ok(auditLogService.getAvailableActions())
    }

    @Operation(summary = "List available audit resource types")
    @GetMapping("/resource-types")
    @PlatformSecured(permissions = [PlatformPermission.AUDIT_LOGS_VIEW])
    fun getResourceTypes(): ResponseEntity<List<AuditResourceTypeResponse>> {
        return ResponseEntity.ok(auditLogService.getAvailableResourceTypes())
    }
}
