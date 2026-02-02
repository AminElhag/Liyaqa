package com.liyaqa.config

import org.springframework.stereotype.Component
import java.time.Duration
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

@Component
class CsrfTokenProvider {

    companion object {
        private val TOKEN_EXPIRY = Duration.ofHours(24)
    }

    private val tokenStore = ConcurrentHashMap<String, CsrfToken>()

    data class CsrfToken(
        val token: String,
        val expiresAt: Instant
    )

    fun generateToken(sessionId: String): String {
        val token = UUID.randomUUID().toString()
        val expiresAt = Instant.now().plus(TOKEN_EXPIRY)

        tokenStore[sessionId] = CsrfToken(token, expiresAt)
        cleanupExpiredTokens()

        return token
    }

    fun validateToken(sessionId: String, token: String): Boolean {
        val storedToken = tokenStore[sessionId] ?: return false

        if (Instant.now().isAfter(storedToken.expiresAt)) {
            tokenStore.remove(sessionId)
            return false
        }

        return storedToken.token == token
    }

    fun removeToken(sessionId: String) {
        tokenStore.remove(sessionId)
    }

    private fun cleanupExpiredTokens() {
        val now = Instant.now()
        tokenStore.entries.removeIf { (_, csrfToken) ->
            now.isAfter(csrfToken.expiresAt)
        }
    }

    fun getActiveTokenCount(): Int {
        cleanupExpiredTokens()
        return tokenStore.size
    }
}
