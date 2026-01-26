package com.liyaqa.branding.api

import com.liyaqa.branding.application.services.BrandingService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/branding")
@Tag(name = "Branding", description = "White-label branding configuration")
class BrandingController(
    private val brandingService: BrandingService
) {

    @Operation(
        summary = "Get branding configuration",
        description = "Returns the branding configuration for the current tenant. Creates default config if none exists."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Branding configuration retrieved"),
        ApiResponse(responseCode = "401", description = "Not authenticated")
    ])
    @GetMapping("/config")
    @PreAuthorize("hasAuthority('branding_read')")
    fun getConfig(): ResponseEntity<BrandingConfigResponse> {
        val config = brandingService.getOrCreateConfig()
        return ResponseEntity.ok(BrandingConfigResponse.from(config))
    }

    @Operation(
        summary = "Update branding configuration",
        description = "Updates the branding configuration for the current tenant."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Branding configuration updated"),
        ApiResponse(responseCode = "400", description = "Invalid request"),
        ApiResponse(responseCode = "401", description = "Not authenticated"),
        ApiResponse(responseCode = "403", description = "Not authorized")
    ])
    @PutMapping("/config")
    @PreAuthorize("hasAuthority('branding_update')")
    fun updateConfig(
        @Valid @RequestBody request: UpdateBrandingRequest
    ): ResponseEntity<BrandingConfigResponse> {
        val config = brandingService.updateConfig(request.toCommand())
        return ResponseEntity.ok(BrandingConfigResponse.from(config))
    }
}

/**
 * Public controller for mobile app to fetch branding.
 */
@RestController
@RequestMapping("/api/mobile")
@Tag(name = "Mobile Branding", description = "Public branding endpoint for mobile apps")
class MobileBrandingController(
    private val brandingService: BrandingService
) {

    @Operation(
        summary = "Get branding for mobile app",
        description = "Returns lightweight branding configuration for mobile app theming. " +
                "Requires X-Tenant-Id header to identify the tenant."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Branding configuration retrieved"),
        ApiResponse(responseCode = "400", description = "Missing X-Tenant-Id header")
    ])
    @GetMapping("/branding")
    fun getBrandingForMobile(
        @RequestHeader("X-Tenant-Id") tenantId: UUID
    ): ResponseEntity<MobileBrandingResponse> {
        val config = brandingService.getBrandingForMobile(tenantId)
        return ResponseEntity.ok(MobileBrandingResponse.from(config))
    }
}
