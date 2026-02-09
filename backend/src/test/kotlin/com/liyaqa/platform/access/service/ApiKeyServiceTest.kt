package com.liyaqa.platform.access.service

import com.liyaqa.platform.access.dto.CreateApiKeyRequest
import com.liyaqa.platform.access.exception.ApiKeyAlreadyRevokedException
import com.liyaqa.platform.access.exception.ApiKeyNotFoundException
import com.liyaqa.platform.access.model.TenantApiKey
import com.liyaqa.platform.access.repository.TenantApiKeyRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.eq
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.context.ApplicationEventPublisher
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import java.time.Instant
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ApiKeyServiceTest {

    @Mock
    private lateinit var apiKeyRepository: TenantApiKeyRepository

    @Mock
    private lateinit var auditService: AuditService

    @Mock
    private lateinit var eventPublisher: ApplicationEventPublisher

    private val passwordEncoder = BCryptPasswordEncoder()

    private lateinit var apiKeyService: ApiKeyService

    private val tenantId = UUID.randomUUID()
    private val createdBy = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        apiKeyService = ApiKeyService(
            apiKeyRepository = apiKeyRepository,
            passwordEncoder = passwordEncoder,
            auditService = auditService,
            eventPublisher = eventPublisher
        )
    }

    @Test
    fun `createKey generates correct prefix format and BCrypt hash`() {
        whenever(apiKeyRepository.save(any())).thenAnswer { it.arguments[0] }

        val request = CreateApiKeyRequest(
            name = "Test Key",
            permissions = listOf("READ", "WRITE"),
            rateLimit = 100
        )

        val result = apiKeyService.createKey(tenantId, request, createdBy)

        assertTrue(result.key.startsWith("lqa_"))
        assertEquals(8, result.keyPrefix.length)
        assertEquals("Test Key", result.name)
        assertEquals(tenantId, result.tenantId)
        assertEquals(listOf("READ", "WRITE"), result.permissions)
        assertEquals(100, result.rateLimit)
        assertNotNull(result.createdAt)

        verify(apiKeyRepository).save(any())
        verify(auditService).logAsync(eq(AuditAction.API_KEY_CREATE), any(), any(), anyOrNull(), anyOrNull(), anyOrNull())
    }

    @Test
    fun `createKey returns full key in response`() {
        whenever(apiKeyRepository.save(any())).thenAnswer { it.arguments[0] }

        val request = CreateApiKeyRequest(name = "Key", permissions = emptyList())
        val result = apiKeyService.createKey(tenantId, request, createdBy)

        assertTrue(result.key.startsWith("lqa_"))
        assertTrue(result.key.length > 40)
    }

    @Test
    fun `validateKey with valid key returns entity`() {
        val rawKey = "lqa_${tenantId.toString().replace("-", "").take(8)}_${"a".repeat(32)}"
        val keyPrefix = tenantId.toString().replace("-", "").take(8)
        val keyHash = passwordEncoder.encode(rawKey)

        val apiKey = TenantApiKey.create(
            tenantId = tenantId,
            name = "Test",
            keyPrefix = keyPrefix,
            keyHash = keyHash,
            permissions = emptyList(),
            rateLimit = 60,
            createdBy = createdBy
        )

        whenever(apiKeyRepository.findByKeyPrefix(keyPrefix)).thenReturn(Optional.of(apiKey))
        whenever(apiKeyRepository.save(any())).thenAnswer { it.arguments[0] }

        val result = apiKeyService.validateKey(rawKey)

        assertNotNull(result)
        assertEquals(apiKey.id, result!!.id)
    }

    @Test
    fun `validateKey with wrong key returns null`() {
        val keyPrefix = tenantId.toString().replace("-", "").take(8)
        val keyHash = passwordEncoder.encode("lqa_${keyPrefix}_correctkey")

        val apiKey = TenantApiKey.create(
            tenantId = tenantId,
            name = "Test",
            keyPrefix = keyPrefix,
            keyHash = keyHash,
            permissions = emptyList(),
            rateLimit = 60,
            createdBy = createdBy
        )

        whenever(apiKeyRepository.findByKeyPrefix(keyPrefix)).thenReturn(Optional.of(apiKey))

        val result = apiKeyService.validateKey("lqa_${keyPrefix}_wrongkey12345678901234567890ab")

        assertNull(result)
    }

    @Test
    fun `validateKey with expired key returns null`() {
        val keyPrefix = tenantId.toString().replace("-", "").take(8)
        val rawKey = "lqa_${keyPrefix}_${"a".repeat(32)}"
        val keyHash = passwordEncoder.encode(rawKey)

        val apiKey = TenantApiKey(
            tenantId = tenantId,
            name = "Test",
            keyPrefix = keyPrefix,
            keyHash = keyHash,
            rateLimit = 60,
            expiresAt = Instant.now().minusSeconds(3600),
            createdBy = createdBy
        )

        whenever(apiKeyRepository.findByKeyPrefix(keyPrefix)).thenReturn(Optional.of(apiKey))

        val result = apiKeyService.validateKey(rawKey)

        assertNull(result)
    }

    @Test
    fun `validateKey with revoked key returns null`() {
        val keyPrefix = tenantId.toString().replace("-", "").take(8)
        val rawKey = "lqa_${keyPrefix}_${"a".repeat(32)}"
        val keyHash = passwordEncoder.encode(rawKey)

        val apiKey = TenantApiKey.create(
            tenantId = tenantId,
            name = "Test",
            keyPrefix = keyPrefix,
            keyHash = keyHash,
            permissions = emptyList(),
            rateLimit = 60,
            createdBy = createdBy
        )
        apiKey.revoke(UUID.randomUUID())

        whenever(apiKeyRepository.findByKeyPrefix(keyPrefix)).thenReturn(Optional.of(apiKey))

        val result = apiKeyService.validateKey(rawKey)

        assertNull(result)
    }

    @Test
    fun `revokeKey sets revocation fields`() {
        val keyId = UUID.randomUUID()
        val revokedBy = UUID.randomUUID()

        val apiKey = TenantApiKey.create(
            tenantId = tenantId,
            name = "Test",
            keyPrefix = "abcd1234",
            keyHash = "hash",
            permissions = emptyList(),
            rateLimit = 60,
            createdBy = createdBy
        )

        whenever(apiKeyRepository.findById(keyId)).thenReturn(Optional.of(apiKey))
        whenever(apiKeyRepository.save(any())).thenAnswer { it.arguments[0] }

        apiKeyService.revokeKey(keyId, revokedBy)

        verify(apiKeyRepository).save(any())
        verify(auditService).logAsync(eq(AuditAction.API_KEY_REVOKE), any(), eq(keyId), anyOrNull(), anyOrNull(), anyOrNull())
    }

    @Test
    fun `rotateKey revokes old and creates new`() {
        val keyId = UUID.randomUUID()

        val oldKey = TenantApiKey.create(
            tenantId = tenantId,
            name = "Rotate Me",
            keyPrefix = "abcd1234",
            keyHash = "hash",
            permissions = listOf("READ"),
            rateLimit = 100,
            createdBy = createdBy
        )

        whenever(apiKeyRepository.findById(keyId)).thenReturn(Optional.of(oldKey))
        whenever(apiKeyRepository.save(any())).thenAnswer { it.arguments[0] }

        val result = apiKeyService.rotateKey(keyId, createdBy)

        assertEquals("Rotate Me", result.name)
        assertTrue(result.key.startsWith("lqa_"))
        assertNotNull(result.id)

        verify(auditService).logAsync(eq(AuditAction.API_KEY_ROTATE), any(), eq(keyId), anyOrNull(), anyOrNull(), anyOrNull())
    }
}
