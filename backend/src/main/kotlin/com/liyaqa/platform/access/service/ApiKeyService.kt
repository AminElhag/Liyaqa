package com.liyaqa.platform.access.service

import com.liyaqa.platform.access.dto.ApiKeyCreatedResponse
import com.liyaqa.platform.access.dto.ApiKeySummaryResponse
import com.liyaqa.platform.access.dto.ApiKeyUsageResponse
import com.liyaqa.platform.access.dto.CreateApiKeyRequest
import com.liyaqa.platform.access.dto.TenantKeyCount
import com.liyaqa.platform.access.exception.ApiKeyAlreadyRevokedException
import com.liyaqa.platform.access.exception.ApiKeyNotFoundException
import com.liyaqa.platform.access.model.TenantApiKey
import com.liyaqa.platform.access.repository.TenantApiKeyRepository
import com.liyaqa.platform.events.model.PlatformEvent
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service
@Transactional
class ApiKeyService(
    private val apiKeyRepository: TenantApiKeyRepository,
    private val passwordEncoder: PasswordEncoder,
    private val auditService: AuditService,
    private val eventPublisher: ApplicationEventPublisher
) {
    private val logger = LoggerFactory.getLogger(ApiKeyService::class.java)

    fun createKey(tenantId: UUID, request: CreateApiKeyRequest, createdBy: UUID): ApiKeyCreatedResponse {
        val tenantSegment = tenantId.toString().replace("-", "").take(8)
        val randomPart = generateSecureString(32)
        val fullKey = "lqa_${tenantSegment}_$randomPart"
        val keyPrefix = tenantSegment
        val keyHash = passwordEncoder.encode(fullKey)

        val expiresAt = request.expiresInDays?.let {
            Instant.now().plus(it.toLong(), ChronoUnit.DAYS)
        }

        val apiKey = TenantApiKey.create(
            tenantId = tenantId,
            name = request.name,
            keyPrefix = keyPrefix,
            keyHash = keyHash,
            permissions = request.permissions,
            rateLimit = request.rateLimit,
            expiresAt = expiresAt,
            createdBy = createdBy
        )

        val saved = apiKeyRepository.save(apiKey)

        auditService.logAsync(
            action = AuditAction.API_KEY_CREATE,
            entityType = "TenantApiKey",
            entityId = saved.id,
            description = "Created API key '${request.name}' for tenant $tenantId"
        )

        eventPublisher.publishEvent(PlatformEvent.ApiKeyCreated(
            keyId = saved.id,
            tenantId = tenantId,
            keyName = request.name,
            createdBy = createdBy
        ))

        logger.info("API key created: {} for tenant {}", saved.id, tenantId)

        return ApiKeyCreatedResponse(
            id = saved.id,
            name = saved.name,
            key = fullKey,
            keyPrefix = keyPrefix,
            tenantId = tenantId,
            permissions = saved.getPermissions(),
            rateLimit = saved.rateLimit,
            expiresAt = saved.expiresAt,
            createdAt = saved.createdAt
        )
    }

    @Transactional(readOnly = true)
    fun listKeys(tenantId: UUID): List<ApiKeySummaryResponse> {
        return apiKeyRepository.findByTenantId(tenantId)
            .map { ApiKeySummaryResponse.from(it) }
    }

    fun revokeKey(keyId: UUID, revokedBy: UUID) {
        val key = apiKeyRepository.findById(keyId)
            .orElseThrow { ApiKeyNotFoundException(keyId) }

        if (key.isRevoked()) {
            throw ApiKeyAlreadyRevokedException(keyId)
        }

        key.revoke(revokedBy)
        apiKeyRepository.save(key)

        auditService.logAsync(
            action = AuditAction.API_KEY_REVOKE,
            entityType = "TenantApiKey",
            entityId = keyId,
            description = "Revoked API key '${key.name}'"
        )

        eventPublisher.publishEvent(PlatformEvent.ApiKeyRevoked(
            keyId = keyId,
            tenantId = key.tenantId,
            keyName = key.name,
            revokedBy = revokedBy
        ))

        logger.info("API key revoked: {}", keyId)
    }

    fun rotateKey(keyId: UUID, rotatedBy: UUID): ApiKeyCreatedResponse {
        val oldKey = apiKeyRepository.findById(keyId)
            .orElseThrow { ApiKeyNotFoundException(keyId) }

        if (!oldKey.isRevoked()) {
            oldKey.revoke(rotatedBy)
            apiKeyRepository.save(oldKey)
        }

        val request = CreateApiKeyRequest(
            name = oldKey.name,
            permissions = oldKey.getPermissions(),
            rateLimit = oldKey.rateLimit
        )

        val newKeyResponse = createKey(oldKey.tenantId, request, rotatedBy)

        auditService.logAsync(
            action = AuditAction.API_KEY_ROTATE,
            entityType = "TenantApiKey",
            entityId = keyId,
            description = "Rotated API key '${oldKey.name}', new key: ${newKeyResponse.id}"
        )

        logger.info("API key rotated: {} -> {}", keyId, newKeyResponse.id)

        return newKeyResponse
    }

    @Transactional(readOnly = true)
    fun getUsageAnalytics(): ApiKeyUsageResponse {
        val allKeys = apiKeyRepository.findAll()
        val totalKeys = allKeys.size.toLong()
        val activeKeys = allKeys.count { it.isActive }.toLong()

        val keysByTenant = allKeys
            .filter { it.isActive }
            .groupBy { it.tenantId }
            .map { (tenantId, keys) ->
                TenantKeyCount(tenantId = tenantId, activeCount = keys.size.toLong())
            }

        return ApiKeyUsageResponse(
            totalKeys = totalKeys,
            activeKeys = activeKeys,
            keysByTenant = keysByTenant
        )
    }

    fun validateKey(rawKey: String): TenantApiKey? {
        if (!rawKey.startsWith("lqa_") || rawKey.length < 13) {
            return null
        }

        val prefix = rawKey.substring(4, 12)
        val key = apiKeyRepository.findByKeyPrefix(prefix).orElse(null) ?: return null

        if (!passwordEncoder.matches(rawKey, key.keyHash)) {
            return null
        }

        if (!key.isValid()) {
            return null
        }

        key.updateLastUsed()
        apiKeyRepository.save(key)

        return key
    }

    private fun generateSecureString(length: Int): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        val random = SecureRandom()
        return (1..length).map { chars[random.nextInt(chars.length)] }.joinToString("")
    }
}
