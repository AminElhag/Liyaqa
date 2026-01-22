package com.liyaqa.platform.api

import com.liyaqa.platform.api.dto.ClubAuditLogResponse
import com.liyaqa.platform.api.dto.ClubEmployeeResponse
import com.liyaqa.platform.api.dto.ClubEmployeeStats
import com.liyaqa.platform.api.dto.ClubSubscriptionResponse
import com.liyaqa.platform.api.dto.ClubSubscriptionStats
import com.liyaqa.platform.api.dto.ClubUserResponse
import com.liyaqa.platform.api.dto.ClubUserStats
import com.liyaqa.platform.api.dto.ClientClubResponse
import com.liyaqa.platform.api.dto.PageResponse
import com.liyaqa.platform.api.dto.PlatformClubDetailResponse
import com.liyaqa.platform.api.dto.PlatformResetPasswordRequest
import com.liyaqa.platform.application.services.PlatformClubService
import com.liyaqa.shared.domain.AuditAction
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * REST controller for platform-level club management.
 * Allows platform admins to view and manage club data for troubleshooting.
 *
 * Endpoints:
 * - GET    /api/platform/clubs/{clubId}                    - Get club details with stats
 * - GET    /api/platform/clubs/{clubId}/users              - List users in club
 * - GET    /api/platform/clubs/{clubId}/users/stats        - Get user statistics
 * - GET    /api/platform/clubs/{clubId}/employees          - List employees in club
 * - GET    /api/platform/clubs/{clubId}/employees/stats    - Get employee statistics
 * - GET    /api/platform/clubs/{clubId}/subscriptions      - List subscriptions in club
 * - GET    /api/platform/clubs/{clubId}/subscriptions/stats- Get subscription statistics
 * - GET    /api/platform/clubs/{clubId}/audit-logs         - List audit logs for club
 * - POST   /api/platform/clubs/{clubId}/users/{userId}/reset-password - Reset user password
 */
@RestController
@RequestMapping("/api/platform/clubs")
@Tag(name = "Platform Club Management", description = "Platform admin endpoints for club troubleshooting")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
class PlatformClubController(
    private val platformClubService: PlatformClubService
) {

    // ========================================
    // Club Detail
    // ========================================

    /**
     * Gets detailed information about a club including statistics.
     */
    @GetMapping("/{clubId}")
    @Operation(summary = "Get club details", description = "Get detailed club information with statistics for troubleshooting")
    fun getClubDetails(@PathVariable clubId: UUID): ResponseEntity<PlatformClubDetailResponse> {
        val club = platformClubService.getClub(clubId)
        val stats = platformClubService.getClubStats(clubId)
        return ResponseEntity.ok(PlatformClubDetailResponse.from(club, stats))
    }

    // ========================================
    // Users
    // ========================================

    /**
     * Gets all users for a club with pagination.
     */
    @GetMapping("/{clubId}/users")
    @Operation(summary = "Get club users", description = "Get paginated list of users in the club")
    fun getClubUsers(
        @PathVariable clubId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDirection: String
    ): ResponseEntity<PageResponse<ClubUserResponse>> {
        val sort = if (sortDirection.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size.coerceAtMost(100), sort)
        val usersPage = platformClubService.getUsersByClub(clubId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = usersPage.content.map { ClubUserResponse.from(it) },
                page = usersPage.number,
                size = usersPage.size,
                totalElements = usersPage.totalElements,
                totalPages = usersPage.totalPages,
                first = usersPage.isFirst,
                last = usersPage.isLast
            )
        )
    }

    /**
     * Gets user statistics for a club.
     */
    @GetMapping("/{clubId}/users/stats")
    @Operation(summary = "Get user statistics", description = "Get user count statistics for the club")
    fun getClubUserStats(@PathVariable clubId: UUID): ResponseEntity<ClubUserStats> {
        val stats = platformClubService.getUserStatsByClub(clubId)
        return ResponseEntity.ok(stats)
    }

    /**
     * Resets a user's password.
     * Only PLATFORM_ADMIN can reset passwords.
     */
    @PostMapping("/{clubId}/users/{userId}/reset-password")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Reset user password", description = "Reset password for a user in the club (admin action)")
    fun resetUserPassword(
        @PathVariable clubId: UUID,
        @PathVariable userId: UUID,
        @Valid @RequestBody request: PlatformResetPasswordRequest
    ): ResponseEntity<ClubUserResponse> {
        val user = platformClubService.resetUserPassword(clubId, userId, request.newPassword)
        return ResponseEntity.ok(ClubUserResponse.from(user))
    }

    // ========================================
    // Employees
    // ========================================

    /**
     * Gets all employees for a club with pagination.
     */
    @GetMapping("/{clubId}/employees")
    @Operation(summary = "Get club employees", description = "Get paginated list of employees in the club")
    fun getClubEmployees(
        @PathVariable clubId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDirection: String
    ): ResponseEntity<PageResponse<ClubEmployeeResponse>> {
        val sort = if (sortDirection.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size.coerceAtMost(100), sort)
        val employeesPage = platformClubService.getEmployeesByClub(clubId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = employeesPage.content.map { ClubEmployeeResponse.from(it) },
                page = employeesPage.number,
                size = employeesPage.size,
                totalElements = employeesPage.totalElements,
                totalPages = employeesPage.totalPages,
                first = employeesPage.isFirst,
                last = employeesPage.isLast
            )
        )
    }

    /**
     * Gets employee statistics for a club.
     */
    @GetMapping("/{clubId}/employees/stats")
    @Operation(summary = "Get employee statistics", description = "Get employee count statistics for the club")
    fun getClubEmployeeStats(@PathVariable clubId: UUID): ResponseEntity<ClubEmployeeStats> {
        val stats = platformClubService.getEmployeeStatsByClub(clubId)
        return ResponseEntity.ok(stats)
    }

    // ========================================
    // Subscriptions
    // ========================================

    /**
     * Gets all subscriptions for a club with pagination.
     */
    @GetMapping("/{clubId}/subscriptions")
    @Operation(summary = "Get club subscriptions", description = "Get paginated list of member subscriptions in the club")
    fun getClubSubscriptions(
        @PathVariable clubId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDirection: String
    ): ResponseEntity<PageResponse<ClubSubscriptionResponse>> {
        val sort = if (sortDirection.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size.coerceAtMost(100), sort)
        val subscriptionsPage = platformClubService.getSubscriptionsByClub(clubId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = subscriptionsPage.content.map { ClubSubscriptionResponse.from(it) },
                page = subscriptionsPage.number,
                size = subscriptionsPage.size,
                totalElements = subscriptionsPage.totalElements,
                totalPages = subscriptionsPage.totalPages,
                first = subscriptionsPage.isFirst,
                last = subscriptionsPage.isLast
            )
        )
    }

    /**
     * Gets subscription statistics for a club.
     */
    @GetMapping("/{clubId}/subscriptions/stats")
    @Operation(summary = "Get subscription statistics", description = "Get subscription count statistics for the club")
    fun getClubSubscriptionStats(@PathVariable clubId: UUID): ResponseEntity<ClubSubscriptionStats> {
        val stats = platformClubService.getSubscriptionStatsByClub(clubId)
        return ResponseEntity.ok(stats)
    }

    // ========================================
    // Audit Logs
    // ========================================

    /**
     * Gets audit logs for a club with pagination and optional filtering.
     */
    @GetMapping("/{clubId}/audit-logs")
    @Operation(summary = "Get club audit logs", description = "Get paginated audit logs for the club")
    fun getClubAuditLogs(
        @PathVariable clubId: UUID,
        @RequestParam(required = false) action: AuditAction?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDirection: String
    ): ResponseEntity<PageResponse<ClubAuditLogResponse>> {
        val sort = if (sortDirection.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size.coerceAtMost(100), sort)
        val logsPage = platformClubService.getAuditLogsByClub(clubId, action, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = logsPage.content.map { ClubAuditLogResponse.from(it) },
                page = logsPage.number,
                size = logsPage.size,
                totalElements = logsPage.totalElements,
                totalPages = logsPage.totalPages,
                first = logsPage.isFirst,
                last = logsPage.isLast
            )
        )
    }

    /**
     * Gets available audit actions for filter dropdown.
     */
    @GetMapping("/audit-actions")
    @Operation(summary = "Get audit actions", description = "Get list of available audit action types for filtering")
    fun getAuditActions(): ResponseEntity<List<String>> {
        return ResponseEntity.ok(AuditAction.entries.map { it.name })
    }
}
