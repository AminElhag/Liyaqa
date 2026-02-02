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
interface JpaUserSessionRepository : JpaRepository<UserSession, UUID> {

    fun findBySessionId(sessionId: UUID): UserSession?

    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId AND s.isActive = true ORDER BY s.lastActiveAt DESC")
    fun findActiveSessionsByUserId(@Param("userId") userId: UUID): List<UserSession>

    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId ORDER BY s.lastActiveAt DESC")
    fun findAllByUserId(@Param("userId") userId: UUID): List<UserSession>

    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.userId = :userId AND s.isActive = true")
    fun countActiveSessionsByUserId(@Param("userId") userId: UUID): Long

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

    @Modifying
    @Transactional
    @Query("UPDATE UserSession s SET s.isActive = false, s.revokedAt = :now WHERE s.userId = :userId AND s.isActive = true")
    fun revokeAllByUserIdQuery(@Param("userId") userId: UUID, @Param("now") now: Instant): Int

    @Modifying
    @Transactional
    @Query("DELETE FROM UserSession s WHERE s.expiresAt < :before")
    fun deleteExpiredSessions(@Param("before") before: Instant): Int
}

@org.springframework.stereotype.Component
class UserSessionRepositoryAdapter(
    private val jpaRepository: JpaUserSessionRepository
) : UserSessionRepository {

    override fun save(session: UserSession): UserSession =
        jpaRepository.save(session)

    override fun findBySessionId(sessionId: UUID): UserSession? =
        jpaRepository.findBySessionId(sessionId)

    override fun findActiveSessionsByUserId(userId: UUID): List<UserSession> =
        jpaRepository.findActiveSessionsByUserId(userId)

    override fun findAllByUserId(userId: UUID): List<UserSession> =
        jpaRepository.findAllByUserId(userId)

    override fun countActiveSessionsByUserId(userId: UUID): Long =
        jpaRepository.countActiveSessionsByUserId(userId)

    override fun revokeAllExcept(userId: UUID, exceptSessionId: UUID?) {
        jpaRepository.revokeAllExceptQuery(userId, exceptSessionId, Instant.now())
    }

    override fun revokeAllByUserId(userId: UUID) {
        jpaRepository.revokeAllByUserIdQuery(userId, Instant.now())
    }

    override fun deleteExpiredSessions(before: Instant): Int =
        jpaRepository.deleteExpiredSessions(before)
}
