package com.liyaqa.platform.access.service

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.shared.domain.LocalizedText
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

class ImpersonationTokenTest {

    private lateinit var jwtTokenProvider: JwtTokenProvider

    private val impersonatorId = UUID.randomUUID()
    private val targetTenantId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        jwtTokenProvider = JwtTokenProvider(
            secret = "test-secret-key-that-is-at-least-32-bytes-long-for-hmac-sha256!",
            accessTokenExpiration = 900000, // 15 min
            refreshTokenExpiration = 604800000, // 7 days
            absoluteSessionTimeout = 86400000 // 24 hours
        )
    }

    private fun createTargetUser(): User {
        val user = User(
            email = "admin@facility.com",
            passwordHash = "hashed",
            displayName = LocalizedText(en = "Facility Admin", ar = "مدير"),
            role = Role.SUPER_ADMIN
        )
        // Set tenantId via reflection since it's normally set by TenantContext
        val tenantIdField = user.javaClass.superclass.getDeclaredField("tenantId")
        tenantIdField.isAccessible = true
        tenantIdField.set(user, targetTenantId)
        return user
    }

    @Test
    fun `generates impersonation token with correct claims`() {
        val user = createTargetUser()
        val token = jwtTokenProvider.generateImpersonationToken(user, impersonatorId, 1800000)

        assertNotNull(token)
        assertTrue(jwtTokenProvider.validateAccessToken(token))

        val userId = jwtTokenProvider.extractUserId(token)
        assertEquals(user.id, userId)

        val email = jwtTokenProvider.extractEmail(token)
        assertEquals("admin@facility.com", email)

        val role = jwtTokenProvider.extractRoleString(token)
        assertEquals("SUPER_ADMIN", role)
    }

    @Test
    fun `impersonation token has facility scope`() {
        val user = createTargetUser()
        val token = jwtTokenProvider.generateImpersonationToken(user, impersonatorId, 1800000)

        val scope = jwtTokenProvider.extractScope(token)
        assertEquals("facility", scope)
    }

    @Test
    fun `impersonation token includes impersonator_id`() {
        val user = createTargetUser()
        val token = jwtTokenProvider.generateImpersonationToken(user, impersonatorId, 1800000)

        val extractedImpersonatorId = jwtTokenProvider.extractImpersonatorId(token)
        assertEquals(impersonatorId, extractedImpersonatorId)
    }

    @Test
    fun `impersonation token expires in configured duration`() {
        val user = createTargetUser()
        val before = Instant.now()
        val token = jwtTokenProvider.generateImpersonationToken(user, impersonatorId, 1800000)
        val after = Instant.now()

        val expiration = jwtTokenProvider.getExpiration(token)
        // Expiration should be approximately 30 minutes from now
        val expectedMin = before.plusMillis(1800000).minusSeconds(1)
        val expectedMax = after.plusMillis(1800000).plusSeconds(1)

        assertTrue(!expiration.isBefore(expectedMin), "Expiration $expiration should be >= $expectedMin")
        assertTrue(expiration.isBefore(expectedMax), "Expiration $expiration should be < $expectedMax")
    }

    @Test
    fun `impersonation token is detectable via is_impersonation claim`() {
        val user = createTargetUser()
        val token = jwtTokenProvider.generateImpersonationToken(user, impersonatorId, 1800000)

        assertTrue(jwtTokenProvider.extractIsImpersonation(token))
    }

    @Test
    fun `regular token is not detected as impersonation`() {
        val user = createTargetUser()
        val token = jwtTokenProvider.generateAccessToken(user)

        assertFalse(jwtTokenProvider.extractIsImpersonation(token))
    }

    @Test
    fun `impersonation token has correct tenant_id`() {
        val user = createTargetUser()
        val token = jwtTokenProvider.generateImpersonationToken(user, impersonatorId, 1800000)

        val tenantId = jwtTokenProvider.extractTenantId(token)
        assertEquals(targetTenantId, tenantId)
    }

    @Test
    fun `impersonation token is not a platform user token`() {
        val user = createTargetUser()
        val token = jwtTokenProvider.generateImpersonationToken(user, impersonatorId, 1800000)

        assertFalse(jwtTokenProvider.extractIsPlatformUser(token))
    }
}
