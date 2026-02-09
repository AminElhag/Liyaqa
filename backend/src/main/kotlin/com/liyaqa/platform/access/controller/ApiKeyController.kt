package com.liyaqa.platform.access.controller

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.access.dto.ApiKeyCreatedResponse
import com.liyaqa.platform.access.dto.ApiKeySummaryResponse
import com.liyaqa.platform.access.dto.ApiKeyUsageResponse
import com.liyaqa.platform.access.dto.CreateApiKeyRequest
import com.liyaqa.platform.access.service.ApiKeyService
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/api-keys")
@PlatformSecured
@Tag(name = "Platform API Keys", description = "Tenant API key management")
class ApiKeyController(
    private val apiKeyService: ApiKeyService
) {

    @Operation(summary = "Generate a new API key for a tenant")
    @PostMapping("/tenants/{tenantId}/keys")
    @PlatformSecured(permissions = [PlatformPermission.API_KEYS_MANAGE])
    fun createKey(
        @PathVariable tenantId: UUID,
        @Valid @RequestBody request: CreateApiKeyRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<ApiKeyCreatedResponse> {
        return ResponseEntity.ok(apiKeyService.createKey(tenantId, request, principal.userId))
    }

    @Operation(summary = "List API keys for a tenant")
    @GetMapping("/tenants/{tenantId}/keys")
    @PlatformSecured(permissions = [PlatformPermission.API_KEYS_VIEW])
    fun listKeys(
        @PathVariable tenantId: UUID
    ): ResponseEntity<List<ApiKeySummaryResponse>> {
        return ResponseEntity.ok(apiKeyService.listKeys(tenantId))
    }

    @Operation(summary = "Revoke an API key")
    @PutMapping("/keys/{id}/revoke")
    @PlatformSecured(permissions = [PlatformPermission.API_KEYS_MANAGE])
    fun revokeKey(
        @PathVariable id: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<Map<String, String>> {
        apiKeyService.revokeKey(id, principal.userId)
        return ResponseEntity.ok(mapOf("message" to "API key revoked successfully"))
    }

    @Operation(summary = "Rotate an API key (revoke old + generate new)")
    @PutMapping("/keys/{id}/rotate")
    @PlatformSecured(permissions = [PlatformPermission.API_KEYS_MANAGE])
    fun rotateKey(
        @PathVariable id: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<ApiKeyCreatedResponse> {
        return ResponseEntity.ok(apiKeyService.rotateKey(id, principal.userId))
    }

    @Operation(summary = "Get API key usage analytics")
    @GetMapping("/keys/usage")
    @PlatformSecured(permissions = [PlatformPermission.API_KEYS_VIEW])
    fun getUsageAnalytics(): ResponseEntity<ApiKeyUsageResponse> {
        return ResponseEntity.ok(apiKeyService.getUsageAnalytics())
    }
}
