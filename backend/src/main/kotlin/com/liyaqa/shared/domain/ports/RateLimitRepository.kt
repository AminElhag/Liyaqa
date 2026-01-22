package com.liyaqa.shared.domain.ports

import com.liyaqa.shared.domain.model.RateLimitEntry
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for rate limit persistence operations.
 */
interface RateLimitRepository {
    fun save(entry: RateLimitEntry): RateLimitEntry
    fun findByClientKeyAndTier(clientKey: String, tier: String): Optional<RateLimitEntry>
    fun deleteByWindowStartBefore(cutoff: Instant): Int
    fun deleteById(id: UUID)
}
