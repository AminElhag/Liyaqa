package com.liyaqa.shared.api

import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.domain.AuditLog
import com.liyaqa.shared.infrastructure.audit.AuditService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

/**
 * REST controller for querying audit logs.
 * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
 */
@RestController
@RequestMapping("/api/audit")
@Tag(name = "Audit", description = "Audit log endpoints for compliance and activity tracking")
class AuditLogController(
    private val auditService: AuditService
) {
    /**
     * Get all audit logs with pagination and optional filters.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('audit_view')")
    @Operation(summary = "Get audit logs", description = "Get paginated audit logs with optional filters")
    fun getAuditLogs(
        @RequestParam(required = false) action: AuditAction?,
        @RequestParam(required = false) entityType: String?,
        @RequestParam(required = false) userId: UUID?,
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
            // Filter by action
            action != null -> auditService.getAuditLogsByAction(action, pageable)
            // Filter by user
            userId != null -> auditService.getAuditLogsByUser(userId, pageable)
            // Filter by date range
            startDate != null && endDate != null -> {
                val startInstant = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant()
                val endInstant = endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()
                auditService.getAuditLogsByDateRange(startInstant, endInstant, pageable)
            }
            // No filters - get all
            else -> auditService.getAllAuditLogs(pageable)
        }

        return ResponseEntity.ok(result.map { it.toResponse() })
    }

    /**
     * Get a single audit log by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('audit_view')")
    @Operation(summary = "Get audit log by ID", description = "Get a single audit log entry by its ID")
    fun getAuditLogById(@PathVariable id: UUID): ResponseEntity<AuditLogResponse> {
        val pageable = PageRequest.of(0, 1)
        // Using findAll and filtering since we don't have findById exposed directly
        val allLogs = auditService.getAllAuditLogs(pageable)
        // This is a workaround - ideally we'd have findById in the repository
        val log = allLogs.content.find { it.id == id }
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(log.toResponse())
    }

    /**
     * Get audit history for a specific entity.
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("hasAuthority('audit_view')")
    @Operation(summary = "Get entity history", description = "Get all audit logs for a specific entity")
    fun getEntityHistory(
        @PathVariable entityType: String,
        @PathVariable entityId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<Page<AuditLogResponse>> {
        val pageable: Pageable = PageRequest.of(page, size.coerceAtMost(100), Sort.by("createdAt").descending())
        val result = auditService.getAuditLogsByEntity(entityType, entityId, pageable)
        return ResponseEntity.ok(result.map { it.toResponse() })
    }

    /**
     * Get all activity for a specific user.
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('audit_view')")
    @Operation(summary = "Get user activity", description = "Get all audit logs for a specific user")
    fun getUserActivity(
        @PathVariable userId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<Page<AuditLogResponse>> {
        val pageable: Pageable = PageRequest.of(page, size.coerceAtMost(100), Sort.by("createdAt").descending())
        val result = auditService.getAuditLogsByUser(userId, pageable)
        return ResponseEntity.ok(result.map { it.toResponse() })
    }

    /**
     * Get available audit actions (for filter dropdowns).
     */
    @GetMapping("/actions")
    @PreAuthorize("hasAuthority('audit_view')")
    @Operation(summary = "Get available actions", description = "Get list of all possible audit actions")
    fun getAuditActions(): ResponseEntity<List<String>> {
        return ResponseEntity.ok(AuditAction.entries.map { it.name })
    }

    /**
     * Get audit logs for a specific organization.
     * Available to platform admins, sales reps, and support reps.
     */
    @GetMapping("/organization/{organizationId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
    @Operation(summary = "Get organization audit logs", description = "Get all audit logs for a specific organization (client)")
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
            // Filter by action
            action != null -> auditService.getAuditLogsByOrganizationAndAction(organizationId, action, pageable)
            // Filter by date range
            startDate != null && endDate != null -> {
                val startInstant = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant()
                val endInstant = endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()
                auditService.getAuditLogsByOrganizationAndDateRange(organizationId, startInstant, endInstant, pageable)
            }
            // No additional filters - get all for organization
            else -> auditService.getAuditLogsByOrganization(organizationId, pageable)
        }

        return ResponseEntity.ok(result.map { it.toResponse() })
    }
}

// ==================== RESPONSE DTOs ====================

/**
 * Response DTO for audit log entries.
 */
data class AuditLogResponse(
    val id: UUID,
    val action: AuditAction,
    val entityType: String,
    val entityId: UUID,
    val userId: UUID?,
    val userEmail: String?,
    val description: String?,
    val ipAddress: String?,
    val createdAt: Instant
)

/**
 * Extension function to convert AuditLog entity to response DTO.
 */
fun AuditLog.toResponse() = AuditLogResponse(
    id = this.id,
    action = this.action,
    entityType = this.entityType,
    entityId = this.entityId,
    userId = this.userId,
    userEmail = this.userEmail,
    description = this.description,
    ipAddress = this.ipAddress,
    createdAt = this.createdAt
)
