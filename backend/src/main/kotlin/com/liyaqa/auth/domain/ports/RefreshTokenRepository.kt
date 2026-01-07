package com.liyaqa.auth.domain.ports

import com.liyaqa.auth.domain.model.RefreshToken
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for RefreshToken entity.
 */
interface RefreshTokenRepository {
    fun save(token: RefreshToken): RefreshToken
    fun findById(id: UUID): Optional<RefreshToken>
    fun findByTokenHash(tokenHash: String): Optional<RefreshToken>
    fun findByUserId(userId: UUID): List<RefreshToken>
    fun findActiveByUserId(userId: UUID): List<RefreshToken>
    fun deleteById(id: UUID)
    fun deleteByUserId(userId: UUID)
    fun deleteExpiredBefore(timestamp: Instant): Int
    fun revokeAllByUserId(userId: UUID)
}