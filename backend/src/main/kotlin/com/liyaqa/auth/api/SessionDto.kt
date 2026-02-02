package com.liyaqa.auth.api

import com.liyaqa.auth.domain.model.UserSession
import java.time.Instant
import java.util.UUID

data class SessionResponse(
    val id: UUID,
    val sessionId: UUID,
    val deviceName: String?,
    val os: String?,
    val browser: String?,
    val ipAddress: String,
    val country: String?,
    val city: String?,
    val createdAt: Instant,
    val lastActiveAt: Instant,
    val expiresAt: Instant,
    val isActive: Boolean,
    val isCurrent: Boolean = false
) {
    companion object {
        fun from(session: UserSession, currentSessionId: UUID? = null): SessionResponse {
            return SessionResponse(
                id = session.id!!,
                sessionId = session.sessionId,
                deviceName = session.deviceName,
                os = session.os,
                browser = session.browser,
                ipAddress = session.ipAddress,
                country = session.country,
                city = session.city,
                createdAt = session.createdAt,
                lastActiveAt = session.lastActiveAt,
                expiresAt = session.expiresAt,
                isActive = session.isActive,
                isCurrent = currentSessionId != null && session.sessionId == currentSessionId
            )
        }
    }
}

data class RevokeSessionRequest(
    val sessionId: UUID
)
