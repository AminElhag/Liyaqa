package com.liyaqa.auth.infrastructure.persistence

import com.liyaqa.auth.domain.model.PasswordResetToken
import com.liyaqa.auth.domain.ports.PasswordResetTokenRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataPasswordResetTokenRepository : JpaRepository<PasswordResetToken, UUID> {
    fun findByTokenHash(tokenHash: String): Optional<PasswordResetToken>
    fun findByUserId(userId: UUID): List<PasswordResetToken>

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.userId = :userId")
    fun deleteByUserId(@Param("userId") userId: UUID)

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :before")
    fun deleteExpiredTokens(@Param("before") before: Instant)
}

@Repository
class JpaPasswordResetTokenRepository(
    private val springDataRepository: SpringDataPasswordResetTokenRepository
) : PasswordResetTokenRepository {

    override fun save(token: PasswordResetToken): PasswordResetToken =
        springDataRepository.save(token)

    override fun findByTokenHash(tokenHash: String): Optional<PasswordResetToken> =
        springDataRepository.findByTokenHash(tokenHash)

    override fun findByUserId(userId: UUID): List<PasswordResetToken> =
        springDataRepository.findByUserId(userId)

    override fun deleteByUserId(userId: UUID) =
        springDataRepository.deleteByUserId(userId)

    override fun deleteExpiredTokens(before: Instant) =
        springDataRepository.deleteExpiredTokens(before)
}
