package com.liyaqa.auth.api

import com.liyaqa.auth.application.services.SessionService
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/auth/sessions")
@Tag(name = "Session Management", description = "Manage active user sessions across devices")
class SessionController(
    private val sessionService: SessionService
) {

    @Operation(
        summary = "List Active Sessions",
        description = "Returns all active sessions for the authenticated user across all devices"
    )
    @GetMapping
    fun listSessions(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<List<SessionResponse>> {
        val sessions = sessionService.listActiveSessions(principal.userId)
        
        // Note: We don't have the current session ID easily accessible here
        // Could be enhanced by storing session ID in JWT claims
        val response = sessions.map { SessionResponse.from(it) }
        
        return ResponseEntity.ok(response)
    }

    @Operation(
        summary = "Revoke Session",
        description = "Revokes a specific session by ID (remote logout for that device)"
    )
    @PostMapping("/{sessionId}/revoke")
    fun revokeSession(
        @PathVariable sessionId: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<Unit> {
        sessionService.revokeSession(sessionId, principal.userId)
        return ResponseEntity.noContent().build()
    }

    @Operation(
        summary = "Revoke All Other Sessions",
        description = "Revokes all sessions except the current one (logout all other devices)"
    )
    @PostMapping("/revoke-all")
    fun revokeAllOtherSessions(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @Valid @RequestBody(required = false) request: RevokeSessionRequest?
    ): ResponseEntity<Unit> {
        val exceptSessionId = request?.sessionId
        sessionService.revokeAllSessions(principal.userId, exceptSessionId)
        return ResponseEntity.noContent().build()
    }
}
