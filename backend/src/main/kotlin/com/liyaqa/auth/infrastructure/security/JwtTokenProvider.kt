package com.liyaqa.auth.infrastructure.security

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.platform.domain.model.PlatformUser
import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.security.MessageDigest
import java.time.Instant
import java.util.Base64
import java.util.Date
import java.util.UUID
import javax.crypto.SecretKey

@Component
class JwtTokenProvider(
    @Value("\${jwt.secret}")
    private val secret: String,

    @Value("\${jwt.access-token-expiration}")
    private val accessTokenExpiration: Long,

    @Value("\${jwt.refresh-token-expiration}")
    private val refreshTokenExpiration: Long,

    @Value("\${jwt.absolute-session-timeout}")
    private val absoluteSessionTimeout: Long
) {
    private val logger = LoggerFactory.getLogger(JwtTokenProvider::class.java)
    private val key: SecretKey by lazy { Keys.hmacShaKeyFor(secret.toByteArray()) }

    companion object {
        private const val CLAIM_TENANT_ID = "tenant_id"
        private const val CLAIM_ROLE = "role"
        private const val CLAIM_EMAIL = "email"
        private const val CLAIM_TOKEN_TYPE = "type"
        private const val CLAIM_IS_PLATFORM_USER = "is_platform_user"
        private const val CLAIM_PLATFORM_ORG_ID = "platform_org_id"
        private const val CLAIM_PERMISSIONS = "permissions"
        private const val CLAIM_SCOPE = "scope"
        private const val CLAIM_IS_IMPERSONATION = "is_impersonation"
        private const val CLAIM_IMPERSONATOR_ID = "impersonator_id"
        private const val CLAIM_READ_ONLY = "read_only"
        private const val TOKEN_TYPE_ACCESS = "access"
        private const val TOKEN_TYPE_REFRESH = "refresh"
    }

    /**
     * Generates an access token for the given user.
     */
    fun generateAccessToken(user: User): String {
        return generateAccessToken(user, emptyList())
    }

    /**
     * Generates an access token for the given user with permissions.
     */
    fun generateAccessToken(user: User, permissions: List<String>): String {
        val now = Instant.now()
        val expiry = now.plusMillis(accessTokenExpiration)

        val scope = if (user.role == Role.MEMBER) "client" else "facility"

        val builder = Jwts.builder()
            .subject(user.id.toString())
            .claim(CLAIM_TENANT_ID, user.tenantId.toString())
            .claim(CLAIM_ROLE, user.role.name)
            .claim(CLAIM_EMAIL, user.email)
            .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS)
            .claim(CLAIM_IS_PLATFORM_USER, user.isPlatformUser)
            .claim(CLAIM_PERMISSIONS, permissions)
            .claim(CLAIM_SCOPE, scope)

        // Add platform organization ID if user is a platform user
        if (user.isPlatformUser && user.platformOrganizationId != null) {
            builder.claim(CLAIM_PLATFORM_ORG_ID, user.platformOrganizationId.toString())
        }

        return builder
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(key)
            .compact()
    }

    /**
     * Generates a refresh token for the given user.
     * Returns a pair of (token, tokenHash) where tokenHash should be stored in the database.
     */
    fun generateRefreshToken(user: User): Pair<String, String> {
        val now = Instant.now()
        val expiry = now.plusMillis(refreshTokenExpiration)

        val token = Jwts.builder()
            .subject(user.id.toString())
            .claim(CLAIM_TENANT_ID, user.tenantId.toString())
            .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_REFRESH)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(key)
            .compact()

        val tokenHash = hashToken(token)
        return Pair(token, tokenHash)
    }

    /**
     * Generates an access token for a platform user.
     */
    fun generatePlatformAccessToken(user: PlatformUser): String {
        val now = Instant.now()
        val expiry = now.plusMillis(accessTokenExpiration)

        val permissions = com.liyaqa.platform.domain.model.PlatformRolePermissions
            .permissionsFor(user.role)
            .map { it.name }

        return Jwts.builder()
            .subject(user.id.toString())
            .claim(CLAIM_TENANT_ID, user.id.toString()) // Platform users use their own ID
            .claim(CLAIM_ROLE, user.role.name)
            .claim(CLAIM_EMAIL, user.email)
            .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS)
            .claim(CLAIM_IS_PLATFORM_USER, true)
            .claim(CLAIM_PERMISSIONS, permissions)
            .claim(CLAIM_SCOPE, "platform")
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(key)
            .compact()
    }

    /**
     * Generates a refresh token for a platform user.
     * Returns a pair of (token, tokenHash) where tokenHash should be stored in the database.
     */
    fun generatePlatformRefreshToken(user: PlatformUser): Pair<String, String> {
        val now = Instant.now()
        val expiry = now.plusMillis(refreshTokenExpiration)

        val token = Jwts.builder()
            .subject(user.id.toString())
            .claim(CLAIM_TENANT_ID, user.id.toString())
            .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_REFRESH)
            .claim(CLAIM_SCOPE, "platform")
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(key)
            .compact()

        val tokenHash = hashToken(token)
        return Pair(token, tokenHash)
    }

    /**
     * Validates the given JWT token.
     */
    fun validateToken(token: String): Boolean {
        return try {
            val claims = parseToken(token)
            !isTokenExpired(claims)
        } catch (e: JwtException) {
            logger.debug("Invalid JWT token: ${e.message}")
            false
        } catch (e: IllegalArgumentException) {
            logger.debug("JWT token is empty or malformed")
            false
        }
    }

    /**
     * Validates that the token is an access token.
     */
    fun validateAccessToken(token: String): Boolean {
        return try {
            val claims = parseToken(token)
            !isTokenExpired(claims) && claims[CLAIM_TOKEN_TYPE] == TOKEN_TYPE_ACCESS
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Validates that the token is a refresh token.
     */
    fun validateRefreshToken(token: String): Boolean {
        return try {
            val claims = parseToken(token)
            !isTokenExpired(claims) && claims[CLAIM_TOKEN_TYPE] == TOKEN_TYPE_REFRESH
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Extracts the user ID from the token.
     */
    fun extractUserId(token: String): UUID {
        val claims = parseToken(token)
        return UUID.fromString(claims.subject)
    }

    /**
     * Extracts the tenant ID from the token.
     */
    fun extractTenantId(token: String): UUID {
        val claims = parseToken(token)
        return UUID.fromString(claims[CLAIM_TENANT_ID] as String)
    }

    /**
     * Extracts the role from the token.
     */
    fun extractRole(token: String): Role {
        val claims = parseToken(token)
        return Role.valueOf(claims[CLAIM_ROLE] as String)
    }

    /**
     * Extracts the email from the token.
     */
    fun extractEmail(token: String): String {
        val claims = parseToken(token)
        return claims[CLAIM_EMAIL] as String
    }

    /**
     * Extracts whether the user is a platform user from the token.
     */
    fun extractIsPlatformUser(token: String): Boolean {
        val claims = parseToken(token)
        return claims[CLAIM_IS_PLATFORM_USER] as? Boolean ?: false
    }

    /**
     * Extracts the platform organization ID from the token.
     * Returns null if not present or if not a platform user.
     */
    fun extractPlatformOrganizationId(token: String): UUID? {
        val claims = parseToken(token)
        val platformOrgId = claims[CLAIM_PLATFORM_ORG_ID] as? String
        return platformOrgId?.let { UUID.fromString(it) }
    }

    /**
     * Extracts the permissions from the token.
     */
    @Suppress("UNCHECKED_CAST")
    fun extractPermissions(token: String): List<String> {
        val claims = parseToken(token)
        return claims[CLAIM_PERMISSIONS] as? List<String> ?: emptyList()
    }

    /**
     * Gets the expiration time of the token.
     */
    fun getExpiration(token: String): Instant {
        val claims = parseToken(token)
        return claims.expiration.toInstant()
    }

    /**
     * Gets the access token expiration duration in milliseconds.
     */
    fun getAccessTokenExpirationMs(): Long = accessTokenExpiration

    /**
     * Gets the refresh token expiration duration in milliseconds.
     */
    fun getRefreshTokenExpirationMs(): Long = refreshTokenExpiration

    /**
     * Gets the absolute session timeout duration in milliseconds.
     * This enforces a maximum session duration regardless of token refreshes.
     */
    fun getAbsoluteSessionTimeoutMs(): Long = absoluteSessionTimeout

    /**
     * Hashes a token for secure storage.
     */
    fun hashToken(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(token.toByteArray())
        return Base64.getEncoder().encodeToString(hash)
    }

    /**
     * Extracts the scope from the token.
     * Returns "facility" if the claim is missing (backward compatibility).
     */
    fun extractScope(token: String): String {
        val claims = parseToken(token)
        return claims[CLAIM_SCOPE] as? String ?: "facility"
    }

    /**
     * Extracts the raw role string from the token without parsing to enum.
     */
    fun extractRoleString(token: String): String {
        val claims = parseToken(token)
        return claims[CLAIM_ROLE] as String
    }

    /**
     * Generates a special impersonation token for viewing a facility as the target user.
     * The token includes impersonation markers and is read-only.
     */
    fun generateImpersonationToken(
        targetUser: User,
        impersonatorId: UUID,
        expirationMs: Long
    ): String {
        val now = Instant.now()
        val expiry = now.plusMillis(expirationMs)

        return Jwts.builder()
            .subject(targetUser.id.toString())
            .claim(CLAIM_TENANT_ID, targetUser.tenantId.toString())
            .claim(CLAIM_ROLE, targetUser.role.name)
            .claim(CLAIM_EMAIL, targetUser.email)
            .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS)
            .claim(CLAIM_IS_PLATFORM_USER, false)
            .claim(CLAIM_PERMISSIONS, emptyList<String>())
            .claim(CLAIM_SCOPE, "facility")
            .claim(CLAIM_IS_IMPERSONATION, true)
            .claim(CLAIM_IMPERSONATOR_ID, impersonatorId.toString())
            .claim(CLAIM_READ_ONLY, true)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(key)
            .compact()
    }

    /**
     * Extracts whether this token is an impersonation token.
     */
    fun extractIsImpersonation(token: String): Boolean {
        val claims = parseToken(token)
        return claims[CLAIM_IS_IMPERSONATION] as? Boolean ?: false
    }

    /**
     * Extracts the impersonator's platform user ID from an impersonation token.
     */
    fun extractImpersonatorId(token: String): UUID? {
        val claims = parseToken(token)
        val id = claims[CLAIM_IMPERSONATOR_ID] as? String
        return id?.let { UUID.fromString(it) }
    }

    private fun parseToken(token: String): Claims {
        return try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .payload
        } catch (e: ExpiredJwtException) {
            throw e
        }
    }

    private fun isTokenExpired(claims: Claims): Boolean {
        return claims.expiration.before(Date())
    }
}