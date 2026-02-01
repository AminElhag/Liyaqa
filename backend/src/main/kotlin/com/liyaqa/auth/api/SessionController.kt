package com.liyaqa.auth.api

import com.liyaqa.auth.application.services.SessionService
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for session management.
 * Allows users to view and manage their active sessions across devices.
 */
@RestController
@RequestMapping("/api/auth/sessions")
class SessionController(
    private val sessionService: SessionService
) {

    /**
     * Lists all active sessions for the authenticated user.
     */
    @GetMapping
    fun listActiveSessions(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<SessionListResponse> {
        val sessions = sessionService.listActiveSessions(principal.userId)
        val sessionDtos = sessions.map { SessionDto.from(it) }
        return ResponseEntity.ok(SessionListResponse(sessionDtos, sessionDtos.size))
    }

    /**
     * Lists all sessions (including inactive) for the authenticated user.
     */
    @GetMapping("/all")
    fun listAllSessions(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<SessionListResponse> {
        val sessions = sessionService.listAllSessions(principal.userId)
        val sessionDtos = sessions.map { SessionDto.from(it) }
        return ResponseEntity.ok(SessionListResponse(sessionDtos, sessionDtos.size))
    }

    /**
     * Revokes a specific session.
     * User can only revoke their own sessions.
     */
    @PostMapping("/{sessionId}/revoke")
    fun revokeSession(
        @PathVariable sessionId: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MessageResponse> {
        sessionService.revokeSession(sessionId, principal.userId)
        return ResponseEntity.ok(MessageResponse("Session revoked successfully"))
    }

    /**
     * Revokes all sessions except the current one.
     * Useful for "logout from all other devices" functionality.
     */
    @PostMapping("/revoke-all")
    fun revokeAllSessions(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestBody request: RevokeAllSessionsRequest
    ): ResponseEntity<MessageResponse> {
        sessionService.revokeAllSessions(principal.userId, request.exceptSessionId)
        return ResponseEntity.ok(MessageResponse("All other sessions revoked successfully"))
    }

    /**
     * Gets the count of active sessions for the authenticated user.
     */
    @GetMapping("/count")
    fun getActiveSessionCount(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<SessionCountResponse> {
        val count = sessionService.countActiveSessions(principal.userId)
        return ResponseEntity.ok(SessionCountResponse(count))
    }
}

/**
 * DTO for session information.
 */
data class SessionDto(
    val sessionId: UUID,
    val deviceName: String?,
    val os: String?,
    val browser: String?,
    val deviceDescription: String,
    val ipAddress: String?,
    val country: String?,
    val city: String?,
    val locationDescription: String,
    val lastActiveAt: String,
    val expiresAt: String,
    val isActive: Boolean,
    val createdAt: String
) {
    companion object {
        fun from(session: com.liyaqa.auth.domain.model.UserSession): SessionDto {
            return SessionDto(
                sessionId = session.sessionId,
                deviceName = session.deviceName,
                os = session.os,
                browser = session.browser,
                deviceDescription = session.getDeviceDescription(),
                ipAddress = session.ipAddress,
                country = session.country,
                city = session.city,
                locationDescription = session.getLocationDescription(),
                lastActiveAt = session.lastActiveAt.toString(),
                expiresAt = session.expiresAt.toString(),
                isActive = session.isActive,
                createdAt = session.createdAt.toString()
            )
        }
    }
}

/**
 * Response for session list endpoint.
 */
data class SessionListResponse(
    val sessions: List<SessionDto>,
    val count: Int
)

/**
 * Response for session count endpoint.
 */
data class SessionCountResponse(
    val count: Long
)

/**
 * Request for revoking all sessions except one.
 */
data class RevokeAllSessionsRequest(
    val exceptSessionId: UUID?
)
