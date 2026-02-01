package com.liyaqa.auth.infrastructure.persistence

import com.liyaqa.auth.domain.model.UserSession
import com.liyaqa.auth.domain.ports.UserSessionRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Repository
interface JpaUserSessionRepository : JpaRepository<UserSession, UUID>, UserSessionRepository {

    override fun findBySessionId(sessionId: UUID): UserSession?

    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId AND s.isActive = true ORDER BY s.lastActiveAt DESC")
    override fun findActiveSessionsByUserId(@Param("userId") userId: UUID): List<UserSession>

    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId ORDER BY s.lastActiveAt DESC")
    override fun findAllByUserId(@Param("userId") userId: UUID): List<UserSession>

    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.userId = :userId AND s.isActive = true")
    override fun countActiveSessionsByUserId(@Param("userId") userId: UUID): Long

    @Modifying
    @Transactional
    @Query("""
        UPDATE UserSession s
        SET s.isActive = false, s.revokedAt = :now
        WHERE s.userId = :userId
        AND s.isActive = true
        AND (:exceptSessionId IS NULL OR s.sessionId != :exceptSessionId)
    """)
    fun revokeAllExceptQuery(
        @Param("userId") userId: UUID,
        @Param("exceptSessionId") exceptSessionId: UUID?,
        @Param("now") now: Instant
    ): Int

    override fun revokeAllExcept(userId: UUID, exceptSessionId: UUID?) {
        revokeAllExceptQuery(userId, exceptSessionId, Instant.now())
    }

    @Modifying
    @Transactional
    @Query("UPDATE UserSession s SET s.isActive = false, s.revokedAt = :now WHERE s.userId = :userId AND s.isActive = true")
    fun revokeAllByUserIdQuery(@Param("userId") userId: UUID, @Param("now") now: Instant): Int

    override fun revokeAllByUserId(userId: UUID) {
        revokeAllByUserIdQuery(userId, Instant.now())
    }

    @Modifying
    @Transactional
    @Query("DELETE FROM UserSession s WHERE s.expiresAt < :before")
    override fun deleteExpiredSessions(@Param("before") before: Instant): Int
}
