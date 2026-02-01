package com.liyaqa.auth.domain.ports

import com.liyaqa.auth.domain.model.UserSession
import java.time.Instant
import java.util.UUID

/**
 * Repository interface for user sessions.
 */
interface UserSessionRepository {
    /**
     * Saves a user session.
     */
    fun save(session: UserSession): UserSession

    /**
     * Finds a session by session ID.
     */
    fun findBySessionId(sessionId: UUID): UserSession?

    /**
     * Finds all active sessions for a user.
     */
    fun findActiveSessionsByUserId(userId: UUID): List<UserSession>

    /**
     * Finds all sessions for a user (including inactive).
     */
    fun findAllByUserId(userId: UUID): List<UserSession>

    /**
     * Counts active sessions for a user.
     */
    fun countActiveSessionsByUserId(userId: UUID): Long

    /**
     * Revokes all active sessions for a user except the specified session.
     */
    fun revokeAllExcept(userId: UUID, exceptSessionId: UUID?)

    /**
     * Revokes all active sessions for a user.
     */
    fun revokeAllByUserId(userId: UUID)

    /**
     * Deletes expired sessions (cleanup).
     */
    fun deleteExpiredSessions(before: Instant): Int
}
