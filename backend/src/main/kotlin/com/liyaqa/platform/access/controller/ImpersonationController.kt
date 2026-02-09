package com.liyaqa.platform.access.controller

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.access.dto.ActiveSessionsResponse
import com.liyaqa.platform.access.dto.ImpersonationSessionResponse
import com.liyaqa.platform.access.dto.ImpersonationTokenResponse
import com.liyaqa.platform.access.dto.StartImpersonationRequest
import com.liyaqa.platform.access.service.ImpersonationService
import com.liyaqa.platform.api.dto.PageResponse
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/access")
@PlatformSecured
@Tag(name = "Impersonation", description = "Impersonate tenant users for support")
class ImpersonationController(
    private val impersonationService: ImpersonationService
) {

    @PostMapping("/impersonate")
    @PlatformSecured(permissions = [PlatformPermission.IMPERSONATE_USER])
    @Operation(summary = "Start impersonation session", description = "Begins an impersonation session to act as a tenant user for support purposes")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Impersonation session started successfully"),
        ApiResponse(responseCode = "404", description = "Target tenant or user not found"),
        ApiResponse(responseCode = "409", description = "An active impersonation session already exists for this user")
    )
    fun startImpersonation(
        @Valid @RequestBody request: StartImpersonationRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        httpRequest: HttpServletRequest
    ): ResponseEntity<ImpersonationTokenResponse> {
        val ipAddress = getClientIp(httpRequest)
        val userAgent = httpRequest.getHeader("User-Agent")

        val response = impersonationService.startImpersonation(request, principal, ipAddress, userAgent)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/impersonate/end")
    @PlatformSecured(permissions = [PlatformPermission.IMPERSONATE_USER])
    @Operation(summary = "End impersonation session", description = "Terminates the current impersonation session and returns to the platform user context")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Impersonation session ended successfully"),
        ApiResponse(responseCode = "404", description = "No active impersonation session found")
    )
    fun endImpersonation(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<ImpersonationSessionResponse> {
        val response = impersonationService.endImpersonation(principal.userId)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/impersonate/active")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.SUPPORT_LEAD])
    @Operation(summary = "Get active impersonation sessions", description = "Retrieves all currently active impersonation sessions across the platform")
    @ApiResponse(responseCode = "200", description = "Active sessions retrieved successfully")
    fun getActiveSessions(): ResponseEntity<ActiveSessionsResponse> {
        val sessions = impersonationService.getActiveSessions()
        return ResponseEntity.ok(ActiveSessionsResponse(sessions))
    }

    @GetMapping("/impersonate/history")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.SUPPORT_LEAD])
    @Operation(summary = "Get impersonation history", description = "Retrieves a paginated history of impersonation sessions with optional filters")
    @ApiResponse(responseCode = "200", description = "Impersonation history retrieved successfully")
    fun getHistory(
        @RequestParam(required = false) platformUserId: UUID?,
        @RequestParam(required = false) targetTenantId: UUID?,
        @RequestParam(required = false) dateFrom: Instant?,
        @RequestParam(required = false) dateTo: Instant?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ImpersonationSessionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"))
        val historyPage = impersonationService.getHistory(platformUserId, targetTenantId, dateFrom, dateTo, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = historyPage.content,
                page = historyPage.number,
                size = historyPage.size,
                totalElements = historyPage.totalElements,
                totalPages = historyPage.totalPages,
                first = historyPage.isFirst,
                last = historyPage.isLast
            )
        )
    }

    @PostMapping("/impersonate/{sessionId}/force-end")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.SUPPORT_LEAD])
    @Operation(summary = "Force end impersonation session", description = "Forcefully terminates another user's impersonation session by session ID")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Impersonation session forcefully ended"),
        ApiResponse(responseCode = "404", description = "Impersonation session not found")
    )
    fun forceEndSession(
        @PathVariable sessionId: UUID
    ): ResponseEntity<ImpersonationSessionResponse> {
        val response = impersonationService.forceEndSession(sessionId)
        return ResponseEntity.ok(response)
    }

    private fun getClientIp(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (!xForwardedFor.isNullOrBlank()) {
            return xForwardedFor.split(",").first().trim()
        }
        val xRealIp = request.getHeader("X-Real-IP")
        if (!xRealIp.isNullOrBlank()) {
            return xRealIp.trim()
        }
        return request.remoteAddr ?: "unknown"
    }
}
