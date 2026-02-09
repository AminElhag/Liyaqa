package com.liyaqa.auth.infrastructure.security

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.shared.domain.LocalizedText
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class JwtTokenProviderScopeTest {

    private lateinit var jwtTokenProvider: JwtTokenProvider

    private val secret = "supersecretkeythatisatleast256bitslong0123456789abcdef"

    @BeforeEach
    fun setUp() {
        jwtTokenProvider = JwtTokenProvider(
            secret = secret,
            accessTokenExpiration = 900000, // 15 min
            refreshTokenExpiration = 604800000, // 7 days
            absoluteSessionTimeout = 2592000000 // 30 days
        )
    }

    // === Helper methods ===

    private fun createUser(role: Role): User {
        return User(
            email = "test@example.com",
            passwordHash = "hashed",
            displayName = LocalizedText(en = "Test User"),
            role = role
        )
    }

    private fun createPlatformUser(role: PlatformUserRole): PlatformUser {
        return PlatformUser.create(
            email = "platform@liyaqa.com",
            passwordHash = "hashed",
            displayName = LocalizedText(en = "Test Admin"),
            role = role
        )
    }

    // === Test cases ===

    @Test
    fun `generatePlatformAccessToken includes scope=platform`() {
        val user = createPlatformUser(PlatformUserRole.PLATFORM_SUPER_ADMIN)

        val token = jwtTokenProvider.generatePlatformAccessToken(user)
        val scope = jwtTokenProvider.extractScope(token)

        assertEquals("platform", scope)
    }

    @Test
    fun `generateAccessToken for MEMBER includes scope=client`() {
        val user = createUser(Role.MEMBER)

        val token = jwtTokenProvider.generateAccessToken(user)
        val scope = jwtTokenProvider.extractScope(token)

        assertEquals("client", scope)
    }

    @Test
    fun `generateAccessToken for CLUB_ADMIN includes scope=facility`() {
        val user = createUser(Role.CLUB_ADMIN)

        val token = jwtTokenProvider.generateAccessToken(user)
        val scope = jwtTokenProvider.extractScope(token)

        assertEquals("facility", scope)
    }

    @Test
    fun `generateAccessToken for STAFF includes scope=facility`() {
        val user = createUser(Role.STAFF)

        val token = jwtTokenProvider.generateAccessToken(user)
        val scope = jwtTokenProvider.extractScope(token)

        assertEquals("facility", scope)
    }

    @Test
    fun `generateAccessToken for SUPER_ADMIN includes scope=facility`() {
        val user = createUser(Role.SUPER_ADMIN)

        val token = jwtTokenProvider.generateAccessToken(user)
        val scope = jwtTokenProvider.extractScope(token)

        assertEquals("facility", scope)
    }

    @Test
    fun `platform access token contains correct role`() {
        val user = createPlatformUser(PlatformUserRole.ACCOUNT_MANAGER)

        val token = jwtTokenProvider.generatePlatformAccessToken(user)
        val roleString = jwtTokenProvider.extractRoleString(token)

        assertEquals("ACCOUNT_MANAGER", roleString)
    }

    @Test
    fun `platform access token contains permissions`() {
        val user = createPlatformUser(PlatformUserRole.PLATFORM_SUPER_ADMIN)

        val token = jwtTokenProvider.generatePlatformAccessToken(user)
        val permissions = jwtTokenProvider.extractPermissions(token)

        assertTrue(permissions.isNotEmpty())
        assertTrue(permissions.contains("SYSTEM_SETTINGS"))
        assertTrue(permissions.contains("IMPERSONATE_USER"))
    }

    @Test
    fun `platform refresh token includes scope=platform`() {
        val user = createPlatformUser(PlatformUserRole.SUPPORT_AGENT)

        val (token, _) = jwtTokenProvider.generatePlatformRefreshToken(user)
        val scope = jwtTokenProvider.extractScope(token)

        assertEquals("platform", scope)
    }

    @Test
    fun `facility refresh token defaults to facility scope`() {
        val user = createUser(Role.CLUB_ADMIN)

        val (token, _) = jwtTokenProvider.generateRefreshToken(user)
        val scope = jwtTokenProvider.extractScope(token)

        // Refresh token for facility users doesn't include scope claim, defaults to "facility"
        assertEquals("facility", scope)
    }

    @Test
    fun `PLATFORM_VIEWER access token has limited permissions`() {
        val user = createPlatformUser(PlatformUserRole.PLATFORM_VIEWER)

        val token = jwtTokenProvider.generatePlatformAccessToken(user)
        val permissions = jwtTokenProvider.extractPermissions(token)

        assertTrue(permissions.isNotEmpty())
        // All permissions should end with _VIEW
        permissions.forEach { perm ->
            assertTrue(perm.endsWith("_VIEW"), "Viewer permission $perm should end with _VIEW")
        }
    }
}
