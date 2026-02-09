package com.liyaqa.platform.access.model

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "tenant_api_keys")
class TenantApiKey(
    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "key_prefix", nullable = false)
    val keyPrefix: String,

    @Column(name = "key_hash", nullable = false)
    val keyHash: String,

    @Column(name = "permissions", columnDefinition = "TEXT")
    var permissionsJson: String? = null,

    @Column(name = "rate_limit", nullable = false)
    var rateLimit: Int = 60,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "expires_at")
    val expiresAt: Instant? = null,

    @Column(name = "last_used_at")
    var lastUsedAt: Instant? = null,

    @Column(name = "created_by", nullable = false)
    val createdBy: UUID,

    @Column(name = "revoked_at")
    var revokedAt: Instant? = null,

    @Column(name = "revoked_by")
    var revokedBy: UUID? = null,

    id: UUID = UUID.randomUUID()
) : OrganizationLevelEntity(id) {

    fun getPermissions(): List<String> {
        val raw = permissionsJson ?: return emptyList()
        return try {
            mapper.readValue(raw)
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun setPermissions(permissions: List<String>) {
        this.permissionsJson = mapper.writeValueAsString(permissions)
    }

    fun revoke(byUserId: UUID) {
        isActive = false
        revokedAt = Instant.now()
        revokedBy = byUserId
    }

    fun isExpired(): Boolean = expiresAt != null && Instant.now().isAfter(expiresAt)

    fun isRevoked(): Boolean = revokedAt != null

    fun isValid(): Boolean = isActive && !isExpired() && !isRevoked()

    fun updateLastUsed() {
        lastUsedAt = Instant.now()
    }

    companion object {
        private val mapper = jacksonObjectMapper()

        fun create(
            tenantId: UUID,
            name: String,
            keyPrefix: String,
            keyHash: String,
            permissions: List<String>,
            rateLimit: Int,
            expiresAt: Instant? = null,
            createdBy: UUID
        ): TenantApiKey {
            val key = TenantApiKey(
                tenantId = tenantId,
                name = name,
                keyPrefix = keyPrefix,
                keyHash = keyHash,
                rateLimit = rateLimit,
                expiresAt = expiresAt,
                createdBy = createdBy
            )
            key.setPermissions(permissions)
            return key
        }
    }
}
