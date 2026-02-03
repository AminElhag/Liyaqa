package com.liyaqa.platform.application.tasks

import com.liyaqa.platform.application.services.PlatformPasswordlessAuthService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

/**
 * Scheduled task to clean up expired platform login tokens.
 * Runs every 30 minutes to keep the database clean and prevent token table bloat.
 */
@Component
class PlatformLoginTokenCleanupTask(
    private val passwordlessAuthService: PlatformPasswordlessAuthService
) {
    private val logger = LoggerFactory.getLogger(PlatformLoginTokenCleanupTask::class.java)

    /**
     * Clean up expired tokens every 30 minutes.
     * Deletes tokens that expired more than 1 hour ago.
     */
    @Scheduled(fixedRate = 30 * 60 * 1000) // 30 minutes in milliseconds
    fun cleanupExpiredTokens() {
        try {
            logger.debug("Starting platform login token cleanup...")
            passwordlessAuthService.cleanupExpiredTokens()
            logger.debug("Platform login token cleanup completed")
        } catch (e: Exception) {
            logger.error("Error during platform login token cleanup", e)
        }
    }

    /**
     * Clean up rate limit cache every hour.
     * Removes old entries from the in-memory rate limit cache.
     */
    @Scheduled(fixedRate = 60 * 60 * 1000) // 1 hour in milliseconds
    fun cleanupRateLimitCache() {
        try {
            logger.debug("Starting rate limit cache cleanup...")
            passwordlessAuthService.cleanupRateLimitCache()
            logger.debug("Rate limit cache cleanup completed")
        } catch (e: Exception) {
            logger.error("Error during rate limit cache cleanup", e)
        }
    }
}
