package com.liyaqa.webhook.infrastructure.crypto

import org.springframework.stereotype.Service
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Service for generating and verifying webhook signatures.
 * Uses HMAC-SHA256 for signature generation.
 */
@Service
class WebhookSignatureService {

    companion object {
        private const val ALGORITHM = "HmacSHA256"
        private const val SECRET_LENGTH = 32
    }

    /**
     * Generate a new random secret for a webhook.
     */
    fun generateSecret(): String {
        val bytes = ByteArray(SECRET_LENGTH)
        SecureRandom().nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    /**
     * Generate a signature for the given payload using the webhook secret.
     * Returns a signature in the format: sha256=<hex_signature>
     */
    fun generateSignature(payload: String, secret: String): String {
        val mac = Mac.getInstance(ALGORITHM)
        val secretKey = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), ALGORITHM)
        mac.init(secretKey)
        val hash = mac.doFinal(payload.toByteArray(Charsets.UTF_8))
        val hexSignature = hash.joinToString("") { "%02x".format(it) }
        return "sha256=$hexSignature"
    }

    /**
     * Verify that the provided signature matches the expected signature for the payload.
     */
    fun verifySignature(payload: String, secret: String, signature: String): Boolean {
        val expectedSignature = generateSignature(payload, secret)
        return constantTimeEquals(expectedSignature, signature)
    }

    /**
     * Constant-time comparison to prevent timing attacks.
     */
    private fun constantTimeEquals(a: String, b: String): Boolean {
        if (a.length != b.length) {
            return false
        }
        var result = 0
        for (i in a.indices) {
            result = result or (a[i].code xor b[i].code)
        }
        return result == 0
    }
}
