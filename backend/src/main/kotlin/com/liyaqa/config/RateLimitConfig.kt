package com.liyaqa.config

import io.github.resilience4j.ratelimiter.RateLimiter
import io.github.resilience4j.ratelimiter.RateLimiterConfig
import io.github.resilience4j.ratelimiter.RateLimiterRegistry
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.time.Duration

/**
 * Rate limiting configuration using Resilience4j.
 * Prevents brute force attacks on authentication endpoints.
 *
 * Rate limiters:
 * - auth: 5 requests per minute for login/register
 * - passwordReset: 3 requests per 15 minutes for password reset
 * - api: 100 requests per minute for general API calls
 */
@Configuration
class RateLimitConfig {

    /**
     * Rate limiter for authentication endpoints (login, register).
     * Limit: 5 requests per minute per IP/user
     */
    @Bean
    fun authRateLimiter(): RateLimiter {
        val config = RateLimiterConfig.custom()
            .limitForPeriod(5)                      // 5 requests
            .limitRefreshPeriod(Duration.ofMinutes(1)) // per minute
            .timeoutDuration(Duration.ofSeconds(0))  // fail immediately if limit exceeded
            .build()

        return RateLimiterRegistry.of(config).rateLimiter("auth")
    }

    /**
     * Rate limiter for password reset endpoints.
     * Limit: 3 requests per 15 minutes per IP/email
     * More restrictive to prevent abuse of password reset mechanism.
     */
    @Bean
    fun passwordResetRateLimiter(): RateLimiter {
        val config = RateLimiterConfig.custom()
            .limitForPeriod(3)                         // 3 requests
            .limitRefreshPeriod(Duration.ofMinutes(15)) // per 15 minutes
            .timeoutDuration(Duration.ofSeconds(0))     // fail immediately
            .build()

        return RateLimiterRegistry.of(config).rateLimiter("passwordReset")
    }

    /**
     * Rate limiter for general API endpoints.
     * Limit: 100 requests per minute per user
     */
    @Bean
    fun apiRateLimiter(): RateLimiter {
        val config = RateLimiterConfig.custom()
            .limitForPeriod(100)                        // 100 requests
            .limitRefreshPeriod(Duration.ofMinutes(1))  // per minute
            .timeoutDuration(Duration.ofSeconds(0))     // fail immediately
            .build()

        return RateLimiterRegistry.of(config).rateLimiter("api")
    }
}
