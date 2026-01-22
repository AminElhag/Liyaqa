package com.liyaqa.shared.application.services

import com.liyaqa.shared.domain.model.RateLimitEntry
import com.liyaqa.shared.domain.ports.RateLimitRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

/**
 * Service for managing rate limit counters with database persistence.
 * Uses a write-behind cache strategy for performance:
 * - Reads/writes go through in-memory cache
 * - Periodic flush to database for persistence
 * - Database recovery on startup
 */
@Service
class RateLimitService(
    private val rateLimitRepository: RateLimitRepository
) {
    private val logger = LoggerFactory.getLogger(RateLimitService::class.java)

    companion object {
        const val WINDOW_SIZE_MS = 60_000L // 1 minute window
        const val CLEANUP_INTERVAL_MS = 120_000L // 2 minutes
    }

    // In-memory cache for fast access
    private val cache = ConcurrentHashMap<String, RateLimitEntry>()

    /**
     * Checks if a request is allowed and increments the counter.
     * Returns the current entry if allowed, null if rate limited.
     */
    @Transactional
    fun checkAndIncrement(clientKey: String, tier: String, limit: Int): RateLimitResult {
        val mapKey = "$tier:$clientKey"
        val now = Instant.now()

        // Try cache first
        var entry = cache[mapKey]

        if (entry == null) {
            // Try database
            entry = rateLimitRepository.findByClientKeyAndTier(clientKey, tier).orElse(null)
        }

        if (entry == null || entry.isWindowExpired(WINDOW_SIZE_MS)) {
            // Create new entry or reset window
            entry = if (entry == null) {
                RateLimitEntry(
                    clientKey = clientKey,
                    tier = tier,
                    requestCount = 1,
                    windowStart = now
                )
            } else {
                entry.resetWindow(now)
                entry
            }

            // Save to database and cache
            val saved = rateLimitRepository.save(entry)
            cache[mapKey] = saved

            return RateLimitResult(
                allowed = true,
                currentCount = 1,
                limit = limit,
                windowStart = now,
                remaining = limit - 1
            )
        }

        // Check if within limit
        if (entry.requestCount >= limit) {
            return RateLimitResult(
                allowed = false,
                currentCount = entry.requestCount,
                limit = limit,
                windowStart = entry.windowStart,
                remaining = 0
            )
        }

        // Increment counter
        entry.incrementCount()
        rateLimitRepository.save(entry)
        cache[mapKey] = entry

        return RateLimitResult(
            allowed = true,
            currentCount = entry.requestCount,
            limit = limit,
            windowStart = entry.windowStart,
            remaining = limit - entry.requestCount
        )
    }

    /**
     * Cleans up expired rate limit entries from database.
     * Runs every 2 minutes.
     */
    @Scheduled(fixedRate = CLEANUP_INTERVAL_MS)
    @Transactional
    fun cleanupExpiredEntries() {
        val cutoff = Instant.now().minusMillis(WINDOW_SIZE_MS * 2)

        // Clean database
        val deletedCount = rateLimitRepository.deleteByWindowStartBefore(cutoff)

        // Clean cache
        val cutoffEpoch = cutoff.toEpochMilli()
        cache.entries.removeIf { it.value.windowStart.toEpochMilli() < cutoffEpoch }

        if (deletedCount > 0) {
            logger.debug("Rate limit cleanup: removed $deletedCount expired entries")
        }
    }

    /**
     * Gets current rate limit status without incrementing.
     */
    fun getStatus(clientKey: String, tier: String): RateLimitEntry? {
        val mapKey = "$tier:$clientKey"
        return cache[mapKey] ?: rateLimitRepository.findByClientKeyAndTier(clientKey, tier).orElse(null)
    }
}

/**
 * Result of a rate limit check.
 */
data class RateLimitResult(
    val allowed: Boolean,
    val currentCount: Int,
    val limit: Int,
    val windowStart: Instant,
    val remaining: Int
) {
    val resetTime: Long
        get() = (windowStart.toEpochMilli() + RateLimitService.WINDOW_SIZE_MS) / 1000
}
