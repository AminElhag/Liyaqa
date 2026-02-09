package com.liyaqa.config

import com.github.benmanes.caffeine.cache.Caffeine
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.EnableCaching
import org.springframework.cache.caffeine.CaffeineCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import java.time.Duration

/**
 * Cache configuration for the application.
 * Uses Caffeine as the caching provider for high-performance in-memory caching.
 * Only active when Redis is disabled (single-instance deployment).
 */
@Configuration
@EnableCaching
@ConditionalOnProperty(
    prefix = "liyaqa.cache.redis",
    name = ["enabled"],
    havingValue = "false",
    matchIfMissing = true
)
class CacheConfig {

    /**
     * Cache manager for platform dashboard metrics.
     * Caches dashboard data for 5 minutes to reduce database load.
     *
     * Cache Strategy:
     * - TTL: 5 minutes (balance between freshness and performance)
     * - Max Size: 100 entries
     * - Eviction: LRU (Least Recently Used)
     * - Stats: Enabled for monitoring
     */
    @Bean
    fun platformDashboardCacheManager(): CacheManager {
        val caffeine = Caffeine.newBuilder()
            .maximumSize(100) // Max 100 cache entries
            .expireAfterWrite(Duration.ofMinutes(5)) // 5-minute TTL
            .recordStats() // Enable metrics for monitoring

        return CaffeineCacheManager("platformDashboard").apply {
            setCaffeine(caffeine)
        }
    }

    /**
     * Cache manager for feature access checks.
     * Caches feature access results for 5 minutes per tenant+feature key.
     */
    @Bean
    fun featureAccessCacheManager(): CacheManager {
        val caffeine = Caffeine.newBuilder()
            .maximumSize(500)
            .expireAfterWrite(Duration.ofMinutes(5))
            .recordStats()

        return CaffeineCacheManager("featureAccess").apply {
            setCaffeine(caffeine)
        }
    }

    /**
     * Default cache manager for general application caching.
     * Uses a 10-minute TTL for less frequently changing data.
     */
    @Bean("cacheManager")
    @Primary
    fun defaultCacheManager(): CacheManager {
        val caffeine = Caffeine.newBuilder()
            .maximumSize(1000) // Larger capacity for general caching
            .expireAfterWrite(Duration.ofMinutes(10)) // 10-minute TTL
            .recordStats()

        return CaffeineCacheManager().apply {
            setCaffeine(caffeine)
        }
    }
}
