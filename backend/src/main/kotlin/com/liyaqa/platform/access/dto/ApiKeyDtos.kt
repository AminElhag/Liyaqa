package com.liyaqa.platform.access.dto

import com.liyaqa.platform.access.model.TenantApiKey
import jakarta.validation.constraints.NotBlank
import java.time.Instant
import java.util.UUID

data class CreateApiKeyRequest(
    @field:NotBlank(message = "Name is required")
    val name: String,

    val permissions: List<String> = emptyList(),

    val rateLimit: Int = 60,

    val expiresInDays: Int? = null
)

data class ApiKeyCreatedResponse(
    val id: UUID,
    val name: String,
    val key: String,
    val keyPrefix: String,
    val tenantId: UUID,
    val permissions: List<String>,
    val rateLimit: Int,
    val expiresAt: Instant?,
    val createdAt: Instant
)

data class ApiKeySummaryResponse(
    val id: UUID,
    val name: String,
    val keyMasked: String,
    val tenantId: UUID,
    val permissions: List<String>,
    val rateLimit: Int,
    val isActive: Boolean,
    val expiresAt: Instant?,
    val lastUsedAt: Instant?,
    val createdAt: Instant,
    val revokedAt: Instant?
) {
    companion object {
        fun from(key: TenantApiKey): ApiKeySummaryResponse {
            return ApiKeySummaryResponse(
                id = key.id,
                name = key.name,
                keyMasked = "lqa_${key.keyPrefix}_****",
                tenantId = key.tenantId,
                permissions = key.getPermissions(),
                rateLimit = key.rateLimit,
                isActive = key.isActive,
                expiresAt = key.expiresAt,
                lastUsedAt = key.lastUsedAt,
                createdAt = key.createdAt,
                revokedAt = key.revokedAt
            )
        }
    }
}

data class ApiKeyUsageResponse(
    val totalKeys: Long,
    val activeKeys: Long,
    val keysByTenant: List<TenantKeyCount>
)

data class TenantKeyCount(
    val tenantId: UUID,
    val activeCount: Long
)
