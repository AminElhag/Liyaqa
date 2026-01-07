package com.liyaqa.auth.infrastructure.persistence

import com.liyaqa.auth.domain.model.RefreshToken
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataRefreshTokenRepository : JpaRepository<RefreshToken, UUID> {
    fun findByTokenHash(tokenHash: String): Optional<RefreshToken>
    fun findByUserId(userId: UUID): List<RefreshToken>

    @Query("SELECT rt FROM RefreshToken rt WHERE rt.userId = :userId AND rt.revokedAt IS NULL AND rt.expiresAt > :now")
    fun findActiveByUserId(@Param("userId") userId: UUID, @Param("now") now: Instant): List<RefreshToken>

    fun deleteByUserId(userId: UUID)

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :timestamp")
    fun deleteExpiredBefore(@Param("timestamp") timestamp: Instant): Int

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revokedAt = :now WHERE rt.userId = :userId AND rt.revokedAt IS NULL")
    fun revokeAllByUserId(@Param("userId") userId: UUID, @Param("now") now: Instant)
}

@Repository
class JpaRefreshTokenRepository(
    private val springDataRepository: SpringDataRefreshTokenRepository
) : RefreshTokenRepository {

    override fun save(token: RefreshToken): RefreshToken =
        springDataRepository.save(token)

    override fun findById(id: UUID): Optional<RefreshToken> =
        springDataRepository.findById(id)

    override fun findByTokenHash(tokenHash: String): Optional<RefreshToken> =
        springDataRepository.findByTokenHash(tokenHash)

    override fun findByUserId(userId: UUID): List<RefreshToken> =
        springDataRepository.findByUserId(userId)

    override fun findActiveByUserId(userId: UUID): List<RefreshToken> =
        springDataRepository.findActiveByUserId(userId, Instant.now())

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun deleteByUserId(userId: UUID) =
        springDataRepository.deleteByUserId(userId)

    override fun deleteExpiredBefore(timestamp: Instant): Int =
        springDataRepository.deleteExpiredBefore(timestamp)

    override fun revokeAllByUserId(userId: UUID) =
        springDataRepository.revokeAllByUserId(userId, Instant.now())
}