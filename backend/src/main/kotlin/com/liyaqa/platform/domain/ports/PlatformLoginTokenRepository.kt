package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.PlatformLoginToken
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for PlatformLoginToken aggregate.
 */
interface PlatformLoginTokenRepository {
    /**
     * Save a login token.
     */
    fun save(token: PlatformLoginToken): PlatformLoginToken

    /**
     * Find a token by its ID.
     */
    fun findById(id: UUID): Optional<PlatformLoginToken>

    /**
     * Find a token by its code hash.
     */
    fun findByCodeHash(codeHash: String): Optional<PlatformLoginToken>

    /**
     * Find all tokens for a given email.
     */
    fun findByEmail(email: String): List<PlatformLoginToken>

    /**
     * Delete all tokens for a given email.
     * Used to clean up old tokens before creating a new one.
     */
    fun deleteByEmail(email: String)

    /**
     * Delete all tokens that expired before the given timestamp.
     * Used by the cleanup job.
     */
    fun deleteByExpiresAtBefore(timestamp: Instant)

    /**
     * Count recent tokens created for an email within a time window.
     * Used for rate limiting.
     */
    fun countByEmailAndCreatedAtAfter(email: String, timestamp: Instant): Long
}
