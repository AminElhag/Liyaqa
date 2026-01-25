package com.liyaqa.marketing.api

import com.liyaqa.marketing.application.services.TrackingService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.net.URI

/**
 * Public controller for tracking pixel and click tracking.
 * No authentication required as these endpoints are embedded in emails.
 */
@RestController
@RequestMapping("/t")
@Tag(name = "Tracking", description = "Email open and click tracking")
class TrackingController(
    private val trackingService: TrackingService
) {

    @GetMapping("/o/{token}")
    @Operation(summary = "Track email open (returns 1x1 GIF pixel)")
    fun trackOpen(
        @PathVariable token: String,
        request: HttpServletRequest
    ): ResponseEntity<ByteArray> {
        val userAgent = request.getHeader("User-Agent")
        val ipAddress = getClientIp(request)

        val pixelData = trackingService.trackOpen(token, userAgent, ipAddress)

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, "image/gif")
            .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
            .header(HttpHeaders.PRAGMA, "no-cache")
            .header(HttpHeaders.EXPIRES, "0")
            .body(pixelData)
    }

    @GetMapping("/c/{token}")
    @Operation(summary = "Track link click (redirects to target URL)")
    fun trackClick(
        @PathVariable token: String,
        request: HttpServletRequest
    ): ResponseEntity<Void> {
        val userAgent = request.getHeader("User-Agent")
        val ipAddress = getClientIp(request)

        val targetUrl = trackingService.trackClick(token, userAgent, ipAddress)

        return if (targetUrl != null) {
            ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(targetUrl))
                .build()
        } else {
            // Fallback to a default URL if click tracking fails
            ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create("https://liyaqa.com"))
                .build()
        }
    }

    private fun getClientIp(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        return if (!xForwardedFor.isNullOrBlank()) {
            xForwardedFor.split(",")[0].trim()
        } else {
            request.remoteAddr ?: "unknown"
        }
    }
}
