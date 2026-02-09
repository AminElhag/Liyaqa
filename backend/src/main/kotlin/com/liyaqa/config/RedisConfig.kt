package com.liyaqa.config

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.data.redis.cache.RedisCacheConfiguration
import org.springframework.data.redis.cache.RedisCacheManager
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.connection.RedisPassword
import org.springframework.data.redis.connection.RedisStandaloneConfiguration
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.RedisSerializationContext
import org.springframework.data.redis.serializer.StringRedisSerializer
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession
import java.time.Duration

/**
 * Redis configuration for distributed caching and session management.
 *
 * Features:
 * - Distributed cache (replaces local Caffeine cache in multi-instance deployments)
 * - HTTP session storage (enables session sharing across instances)
 * - Configurable TTL per cache type
 * - JSON serialization for human-readable cache values
 *
 * Configuration:
 * ```yaml
 * spring:
 *   data:
 *     redis:
 *       host: ${REDIS_HOST:localhost}
 *       port: ${REDIS_PORT:6379}
 *       password: ${REDIS_PASSWORD:}
 *       database: 0
 *   session:
 *     store-type: redis
 *     timeout: 30m
 * ```
 *
 * Disable Redis:
 * Set `liyaqa.cache.redis.enabled=false` to fall back to local Caffeine cache.
 */
@Configuration
@EnableCaching
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800) // 30 minutes
@Profile("!local") // Disable Redis for local development profile
@ConditionalOnProperty(
    prefix = "liyaqa.cache.redis",
    name = ["enabled"],
    havingValue = "true",
    matchIfMissing = true
)
class RedisConfig {

    /**
     * Redis connection factory using Lettuce (async, connection pooling).
     * Reads configuration from environment variables via Spring Boot properties.
     */
    @Bean
    fun redisConnectionFactory(
        @Value("\${spring.data.redis.host:localhost}") host: String,
        @Value("\${spring.data.redis.port:6379}") port: Int,
        @Value("\${spring.data.redis.password:}") password: String,
        @Value("\${spring.data.redis.database:0}") database: Int
    ): RedisConnectionFactory {
        val config = RedisStandaloneConfiguration(host, port)
        config.database = database
        if (password.isNotBlank()) {
            config.password = RedisPassword.of(password)
        }
        return LettuceConnectionFactory(config)
    }

    /**
     * Cache manager with predefined cache configurations.
     *
     * Cache types:
     * - membershipPlans: 1 hour TTL (infrequent changes)
     * - gymClasses: 1 hour TTL (infrequent changes)
     * - brandingConfig: 24 hours TTL (rarely changes)
     * - memberSubscriptions: 5 minutes TTL (frequent updates)
     * - sessionAvailability: 2 minutes TTL (real-time booking data)
     * - platformDashboard: 5 minutes TTL (platform metrics)
     * - default: 10 minutes TTL
     */
    @Bean("cacheManager")
    @org.springframework.context.annotation.Primary
    fun cacheManager(redisConnectionFactory: RedisConnectionFactory): CacheManager {
        val objectMapper = ObjectMapper()
            .registerKotlinModule()
            .registerModule(JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)

        val defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(StringRedisSerializer())
            )
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    GenericJackson2JsonRedisSerializer(objectMapper)
                )
            )
            .disableCachingNullValues()

        return RedisCacheManager.builder(redisConnectionFactory)
            .cacheDefaults(defaultConfig)
            // Long-lived caches (1 hour)
            .withCacheConfiguration("membershipPlans", defaultConfig.entryTtl(Duration.ofHours(1)))
            .withCacheConfiguration("gymClasses", defaultConfig.entryTtl(Duration.ofHours(1)))
            .withCacheConfiguration("trainers", defaultConfig.entryTtl(Duration.ofHours(1)))
            .withCacheConfiguration("locations", defaultConfig.entryTtl(Duration.ofHours(1)))
            .withCacheConfiguration("products", defaultConfig.entryTtl(Duration.ofHours(1)))
            .withCacheConfiguration("classPacks", defaultConfig.entryTtl(Duration.ofHours(1)))
            // Very long-lived caches (24 hours)
            .withCacheConfiguration("brandingConfig", defaultConfig.entryTtl(Duration.ofHours(24)))
            .withCacheConfiguration("organizationSettings", defaultConfig.entryTtl(Duration.ofHours(24)))
            // Medium-lived caches (5 minutes)
            .withCacheConfiguration("memberSubscriptions", defaultConfig.entryTtl(Duration.ofMinutes(5)))
            .withCacheConfiguration("memberBalance", defaultConfig.entryTtl(Duration.ofMinutes(5)))
            .withCacheConfiguration("invoices", defaultConfig.entryTtl(Duration.ofMinutes(5)))
            // Short-lived caches (2 minutes) for real-time data
            .withCacheConfiguration("sessionAvailability", defaultConfig.entryTtl(Duration.ofMinutes(2)))
            .withCacheConfiguration("waitlistPosition", defaultConfig.entryTtl(Duration.ofMinutes(2)))
            .withCacheConfiguration("checkInStatus", defaultConfig.entryTtl(Duration.ofMinutes(2)))
            // Platform dashboard cache (5 minutes)
            .withCacheConfiguration("platformDashboard", defaultConfig.entryTtl(Duration.ofMinutes(5)))
            // Feature access cache (5 minutes)
            .withCacheConfiguration("featureAccess", defaultConfig.entryTtl(Duration.ofMinutes(5)))
            .build()
    }

    /**
     * Platform dashboard cache manager.
     * Separate bean to match the naming expected by PlatformDashboardService.
     * Uses the same Redis configuration as the primary cache manager.
     */
    @Bean("platformDashboardCacheManager")
    fun platformDashboardCacheManager(redisConnectionFactory: RedisConnectionFactory): CacheManager {
        val objectMapper = ObjectMapper()
            .registerKotlinModule()
            .registerModule(JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)

        val defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(StringRedisSerializer())
            )
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    GenericJackson2JsonRedisSerializer(objectMapper)
                )
            )
            .disableCachingNullValues()

        return RedisCacheManager.builder(redisConnectionFactory)
            .cacheDefaults(defaultConfig)
            .withCacheConfiguration("platformDashboard", defaultConfig.entryTtl(Duration.ofMinutes(5)))
            .build()
    }

    /**
     * General-purpose Redis template for custom cache operations.
     */
    @Bean
    fun redisTemplate(redisConnectionFactory: RedisConnectionFactory): RedisTemplate<String, Any> {
        val objectMapper = ObjectMapper()
            .registerKotlinModule()
            .registerModule(JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)

        val template = RedisTemplate<String, Any>()
        template.connectionFactory = redisConnectionFactory
        template.keySerializer = StringRedisSerializer()
        template.valueSerializer = GenericJackson2JsonRedisSerializer(objectMapper)
        template.hashKeySerializer = StringRedisSerializer()
        template.hashValueSerializer = GenericJackson2JsonRedisSerializer(objectMapper)
        return template
    }
}

/**
 * Fallback configuration when Redis is disabled.
 * Uses local Caffeine cache (single-instance only).
 */
@Configuration
@EnableCaching
@ConditionalOnProperty(
    prefix = "liyaqa.cache.redis",
    name = ["enabled"],
    havingValue = "false"
)
class LocalCacheConfig {
    // Caffeine cache is already configured in application.yml
    // This is just a marker configuration for when Redis is disabled
}
