package com.liyaqa.platform.access.dto

import com.fasterxml.jackson.annotation.JsonProperty
import com.liyaqa.platform.access.model.ImpersonationSession
import java.time.Instant
import java.util.UUID

// ============================================
// Requests
// ============================================

data class StartImpersonationRequest(
    val tenantId: UUID,
    val targetUserId: UUID? = null,
    val purpose: String
)

data class EndImpersonationRequest(
    val sessionId: UUID? = null
)

// ============================================
// Responses
// ============================================

data class ImpersonationTokenResponse(
    val accessToken: String,
    val sessionId: UUID,
    val impersonatedUserId: UUID,
    val impersonatedUserEmail: String,
    val tenantId: UUID,
    val expiresAt: Instant,
    @get:JsonProperty("isReadOnly")
    val readOnly: Boolean = true
)

data class ImpersonationSessionResponse(
    val id: UUID,
    val platformUserId: UUID,
    val platformUserEmail: String?,
    val targetTenantId: UUID,
    val targetUserId: UUID,
    val purpose: String,
    val startedAt: Instant,
    val endedAt: Instant?,
    val actionsPerformed: List<String>,
    val ipAddress: String?,
    val userAgent: String?,
    @get:JsonProperty("isActive")
    val isActive: Boolean
) {
    companion object {
        fun from(session: ImpersonationSession, platformUserEmail: String? = null): ImpersonationSessionResponse {
            return ImpersonationSessionResponse(
                id = session.id,
                platformUserId = session.platformUserId,
                platformUserEmail = platformUserEmail,
                targetTenantId = session.targetTenantId,
                targetUserId = session.targetUserId,
                purpose = session.purpose,
                startedAt = session.startedAt,
                endedAt = session.endedAt,
                actionsPerformed = session.getActionsList(),
                ipAddress = session.ipAddress,
                userAgent = session.userAgent,
                isActive = session.isActive
            )
        }
    }
}

data class ActiveSessionsResponse(
    val sessions: List<ImpersonationSessionResponse>
)
