package com.liyaqa.auth.domain.ports

import com.liyaqa.auth.domain.model.UserSession
import java.time.Instant
import java.util.UUID

interface UserSessionRepository {

    fun findBySessionId(sessionId: UUID): UserSession?

    fun findActiveSessionsByUserId(userId: UUID): List<UserSession>

    fun findAllByUserId(userId: UUID): List<UserSession>

    fun countActiveSessionsByUserId(userId: UUID): Long

    fun revokeAllExcept(userId: UUID, exceptSessionId: UUID?)

    fun revokeAllByUserId(userId: UUID)

    fun deleteExpiredSessions(before: Instant): Int

    fun save(session: UserSession): UserSession
}
