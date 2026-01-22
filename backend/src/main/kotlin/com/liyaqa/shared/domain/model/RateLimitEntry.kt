package com.liyaqa.shared.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Persistent rate limit entry for tracking API request counts.
 * Stored in database for consistency across application restarts
 * and multi-instance deployments.
 */
@Entity
@Table(name = "rate_limits")
class RateLimitEntry(
    @Id
    val id: UUID = UUID.randomUUID(),

    /**
     * Client identifier: "user:{userId}" for authenticated users,
     * "ip:{ipAddress}" for anonymous users.
     */
    @Column(name = "client_key", nullable = false)
    val clientKey: String,

    /**
     * Rate limit tier (AUTH_LOGIN, WRITE, READ, etc.)
     */
    @Column(name = "tier", nullable = false)
    val tier: String,

    /**
     * Number of requests in the current window.
     */
    @Column(name = "request_count", nullable = false)
    var requestCount: Int = 1,

    /**
     * Start time of the current rate limit window.
     */
    @Column(name = "window_start", nullable = false)
    var windowStart: Instant = Instant.now(),

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
) {
    /**
     * Increments the request count and updates the timestamp.
     */
    fun incrementCount() {
        requestCount++
        updatedAt = Instant.now()
    }

    /**
     * Resets the window with a new start time and count of 1.
     */
    fun resetWindow(newWindowStart: Instant) {
        windowStart = newWindowStart
        requestCount = 1
        updatedAt = Instant.now()
    }

    /**
     * Checks if the current window has expired.
     */
    fun isWindowExpired(windowSizeMs: Long): Boolean {
        val now = Instant.now()
        return now.toEpochMilli() - windowStart.toEpochMilli() >= windowSizeMs
    }
}
