package com.liyaqa.config

import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.util.Base64
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

/**
 * Provides CSRF token generation and validation for cookie-based authentication.
 * Tokens are stored in-memory with automatic expiration.
 */
@Component
class CsrfTokenProvider {
    private val tokens = ConcurrentHashMap<String, CsrfToken>()
    private val secureRandom = SecureRandom()

    companion object {
        private const val TOKEN_VALIDITY_MINUTES = 30L
        private const val CLEANUP_INTERVAL_MINUTES = 5L
        private var lastCleanup = System.currentTimeMillis()
    }

    data class CsrfToken(
        val token: String,
        val expiresAt: Long
    ) {
        fun isValid(): Boolean = System.currentTimeMillis() < expiresAt
    }

    /**
     * Generates a new CSRF token for a user session.
     * @param sessionId Unique session identifier
     * @return The generated CSRF token
     */
    fun generateToken(sessionId: String): String {
        cleanupExpiredTokens()

        val tokenBytes = ByteArray(32)
        secureRandom.nextBytes(tokenBytes)
        val token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes)

        val expiresAt = System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(TOKEN_VALIDITY_MINUTES)
        tokens[sessionId] = CsrfToken(token, expiresAt)

        return token
    }

    /**
     * Validates a CSRF token for a given session.
     * @param sessionId The session identifier
     * @param token The CSRF token to validate
     * @return true if the token is valid, false otherwise
     */
    fun validateToken(sessionId: String, token: String?): Boolean {
        if (token.isNullOrBlank()) return false

        val csrfToken = tokens[sessionId] ?: return false

        if (!csrfToken.isValid()) {
            tokens.remove(sessionId)
            return false
        }

        return csrfToken.token == token
    }

    /**
     * Removes the CSRF token for a session (e.g., on logout).
     * @param sessionId The session identifier
     */
    fun removeToken(sessionId: String) {
        tokens.remove(sessionId)
    }

    /**
     * Cleans up expired tokens to prevent memory leaks.
     * Runs automatically but can be called manually.
     */
    fun cleanupExpiredTokens() {
        val now = System.currentTimeMillis()

        // Only cleanup every CLEANUP_INTERVAL_MINUTES to avoid overhead
        if (now - lastCleanup < TimeUnit.MINUTES.toMillis(CLEANUP_INTERVAL_MINUTES)) {
            return
        }

        tokens.entries.removeIf { !it.value.isValid() }
        lastCleanup = now
    }

    /**
     * Gets the current number of active tokens (for monitoring).
     */
    fun getActiveTokenCount(): Int = tokens.size
}
