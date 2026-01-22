package com.liyaqa.shared.infrastructure.persistence

import com.liyaqa.shared.domain.model.RateLimitEntry
import com.liyaqa.shared.domain.ports.RateLimitRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for rate limit entries.
 */
interface SpringDataRateLimitRepository : JpaRepository<RateLimitEntry, UUID> {
    fun findByClientKeyAndTier(clientKey: String, tier: String): Optional<RateLimitEntry>

    @Modifying
    @Query("DELETE FROM RateLimitEntry r WHERE r.windowStart < :cutoff")
    fun deleteByWindowStartBefore(cutoff: Instant): Int
}

/**
 * JPA adapter implementing the RateLimitRepository port.
 */
@Repository
class JpaRateLimitRepository(
    private val springData: SpringDataRateLimitRepository
) : RateLimitRepository {

    override fun save(entry: RateLimitEntry): RateLimitEntry = springData.save(entry)

    override fun findByClientKeyAndTier(clientKey: String, tier: String): Optional<RateLimitEntry> =
        springData.findByClientKeyAndTier(clientKey, tier)

    override fun deleteByWindowStartBefore(cutoff: Instant): Int =
        springData.deleteByWindowStartBefore(cutoff)

    override fun deleteById(id: UUID) = springData.deleteById(id)
}
