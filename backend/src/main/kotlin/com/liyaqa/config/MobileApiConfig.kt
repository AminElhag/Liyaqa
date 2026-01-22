package com.liyaqa.config

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.CacheControl
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor
import java.util.concurrent.TimeUnit

/**
 * Interceptor that adds appropriate cache control headers for mobile API endpoints.
 * Different endpoints have different caching strategies based on data volatility.
 */
@Component
class MobileCacheControlInterceptor : HandlerInterceptor {

    companion object {
        // Cache durations
        private const val STATIC_DATA_CACHE_SECONDS = 3600L      // 1 hour for static data
        private const val REFERENCE_DATA_CACHE_SECONDS = 1800L  // 30 min for reference data
        private const val DYNAMIC_DATA_CACHE_SECONDS = 60L      // 1 min for dynamic data
        private const val REALTIME_DATA_CACHE_SECONDS = 5L      // 5 sec for real-time data

        // Path patterns for different cache strategies
        private val STATIC_PATHS = listOf(
            "/api/mobile/init",
            "/api/membership-plans"
        )

        private val REFERENCE_PATHS = listOf(
            "/api/classes",
            "/api/locations"
        )

        private val DYNAMIC_PATHS = listOf(
            "/api/mobile/home",
            "/api/mobile/quick-stats",
            "/api/mobile/sessions/available",
            "/api/me/subscription",
            "/api/me/bookings",
            "/api/me/attendance"
        )

        private val REALTIME_PATHS = listOf(
            "/api/me/notifications",
            "/api/qr"
        )

        private val NO_CACHE_PATHS = listOf(
            "/api/auth",
            "/api/exports"
        )
    }

    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any
    ): Boolean {
        // Only apply to GET requests
        if (request.method != "GET") {
            // No caching for mutation requests
            response.setHeader("Cache-Control", CacheControl.noStore().headerValue)
            return true
        }

        val path = request.requestURI
        val cacheControl = getCacheControlForPath(path)

        response.setHeader("Cache-Control", cacheControl.headerValue)

        // Add ETag support hint for conditional requests
        if (cacheControl != CacheControl.noStore()) {
            response.setHeader("Vary", "Accept, Accept-Encoding, Authorization, X-Tenant-ID")
        }

        return true
    }

    private fun getCacheControlForPath(path: String): CacheControl {
        return when {
            // No caching for sensitive endpoints
            NO_CACHE_PATHS.any { path.startsWith(it) } ->
                CacheControl.noStore()

            // Static data: long cache, must revalidate
            STATIC_PATHS.any { path.startsWith(it) } ->
                CacheControl.maxAge(STATIC_DATA_CACHE_SECONDS, TimeUnit.SECONDS)
                    .mustRevalidate()
                    .cachePrivate()

            // Reference data: medium cache
            REFERENCE_PATHS.any { path.startsWith(it) } ->
                CacheControl.maxAge(REFERENCE_DATA_CACHE_SECONDS, TimeUnit.SECONDS)
                    .mustRevalidate()
                    .cachePrivate()

            // Dynamic data: short cache
            DYNAMIC_PATHS.any { path.startsWith(it) } ->
                CacheControl.maxAge(DYNAMIC_DATA_CACHE_SECONDS, TimeUnit.SECONDS)
                    .mustRevalidate()
                    .cachePrivate()

            // Real-time data: very short cache
            REALTIME_PATHS.any { path.startsWith(it) } ->
                CacheControl.maxAge(REALTIME_DATA_CACHE_SECONDS, TimeUnit.SECONDS)
                    .mustRevalidate()
                    .cachePrivate()

            // Default: short cache for other GET requests
            else ->
                CacheControl.maxAge(DYNAMIC_DATA_CACHE_SECONDS, TimeUnit.SECONDS)
                    .mustRevalidate()
                    .cachePrivate()
        }
    }
}

/**
 * Configuration for mobile-specific response optimizations.
 */
data class MobileResponseConfig(
    val compressionEnabled: Boolean = true,
    val minResponseSizeForCompression: Int = 1024, // 1KB minimum for compression
    val defaultPageSize: Int = 20,
    val maxPageSize: Int = 100,
    val cursorPaginationEnabled: Boolean = true
)
