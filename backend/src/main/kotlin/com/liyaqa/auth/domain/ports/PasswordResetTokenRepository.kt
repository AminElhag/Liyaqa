package com.liyaqa.auth.domain.ports

import com.liyaqa.auth.domain.model.PasswordResetToken
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for PasswordResetToken entity.
 */
interface PasswordResetTokenRepository {
    fun save(token: PasswordResetToken): PasswordResetToken
    fun findByTokenHash(tokenHash: String): Optional<PasswordResetToken>
    fun findByUserId(userId: UUID): List<PasswordResetToken>
    fun deleteByUserId(userId: UUID)
    fun deleteExpiredTokens(before: Instant)
}
