package com.liyaqa.config

import com.liyaqa.shared.infrastructure.TenantInterceptor
import com.liyaqa.shared.infrastructure.security.CurrentUserArgumentResolver
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebConfig(
    private val tenantInterceptor: TenantInterceptor,
    private val mobileCacheControlInterceptor: MobileCacheControlInterceptor,
    private val currentUserArgumentResolver: CurrentUserArgumentResolver,

    @Value("\${liyaqa.cors.allowed-origins:http://localhost:3000}")
    private val allowedOrigins: String,

    @Value("\${liyaqa.cors.allowed-origin-patterns:}")
    private val allowedOriginPatterns: String
) : WebMvcConfigurer {

    override fun addArgumentResolvers(resolvers: MutableList<HandlerMethodArgumentResolver>) {
        resolvers.add(currentUserArgumentResolver)
    }

    override fun addInterceptors(registry: InterceptorRegistry) {
        // Tenant interceptor first
        registry.addInterceptor(tenantInterceptor)
            .addPathPatterns("/api/**")
            .excludePathPatterns(
                "/api/public/**",
                "/api/health/**",
                "/api/organizations/**",  // Orgs don't require tenant context
                "/api/clubs/**",          // Clubs are accessed via organization context
                "/api/platform/**"        // Platform endpoints don't require tenant context
            )

        // Mobile cache control interceptor for all API endpoints
        registry.addInterceptor(mobileCacheControlInterceptor)
            .addPathPatterns("/api/**")
            .excludePathPatterns(
                "/api/public/**",
                "/api/health/**"
            )
    }

    override fun addCorsMappings(registry: CorsRegistry) {
        // Parse comma-separated origins and patterns
        val origins = allowedOrigins.split(",").map { it.trim() }.filter { it.isNotBlank() }.toTypedArray()
        val patterns = allowedOriginPatterns.split(",").map { it.trim() }.filter { it.isNotBlank() }

        val mapping = registry.addMapping("/api/**")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            .allowedHeaders(
                "Content-Type",
                "Authorization",
                "X-Tenant-ID",
                "X-Organization-ID",
                "X-Super-Tenant",
                "Accept",
                "Accept-Language",
                "Cache-Control"
            )
            .exposedHeaders(
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                "X-RateLimit-Reset"
            )
            .allowCredentials(true)
            .maxAge(3600)

        // Use pattern-based origins for subdomain support (e.g., https://*.liyaqa.com)
        if (patterns.isNotEmpty()) {
            mapping.allowedOriginPatterns(*patterns.toTypedArray())
        } else if (origins.isNotEmpty()) {
            mapping.allowedOrigins(*origins)
        }
    }
}
