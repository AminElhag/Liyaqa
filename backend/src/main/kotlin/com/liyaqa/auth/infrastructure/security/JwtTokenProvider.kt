package com.liyaqa.auth.infrastructure.security

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
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
    private val refreshTokenExpiration: Long
) {
    private val logger = LoggerFactory.getLogger(JwtTokenProvider::class.java)
    private val key: SecretKey by lazy { Keys.hmacShaKeyFor(secret.toByteArray()) }

    companion object {
        private const val CLAIM_TENANT_ID = "tenant_id"
        private const val CLAIM_ROLE = "role"
        private const val CLAIM_EMAIL = "email"
        private const val CLAIM_TOKEN_TYPE = "type"
        private const val TOKEN_TYPE_ACCESS = "access"
        private const val TOKEN_TYPE_REFRESH = "refresh"
    }

    /**
     * Generates an access token for the given user.
     */
    fun generateAccessToken(user: User): String {
        val now = Instant.now()
        val expiry = now.plusMillis(accessTokenExpiration)

        return Jwts.builder()
            .subject(user.id.toString())
            .claim(CLAIM_TENANT_ID, user.tenantId.toString())
            .claim(CLAIM_ROLE, user.role.name)
            .claim(CLAIM_EMAIL, user.email)
            .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS)
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
     * Hashes a token for secure storage.
     */
    fun hashToken(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(token.toByteArray())
        return Base64.getEncoder().encodeToString(hash)
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