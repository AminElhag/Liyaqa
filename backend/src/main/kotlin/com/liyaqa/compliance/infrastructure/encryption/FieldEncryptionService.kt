package com.liyaqa.compliance.infrastructure.encryption

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.nio.ByteBuffer
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

/**
 * AES-256-GCM encryption service for field-level encryption.
 * Used to encrypt sensitive data at rest.
 */
@Service
class FieldEncryptionService(
    @Value("\${liyaqa.security.encryption.master-key:#{null}}")
    private val masterKey: String?,

    @Value("\${liyaqa.security.encryption.salt:liyaqa-security-salt}")
    private val salt: String
) {
    private val logger = LoggerFactory.getLogger(FieldEncryptionService::class.java)

    companion object {
        private const val ALGORITHM = "AES/GCM/NoPadding"
        private const val KEY_ALGORITHM = "AES"
        private const val KEY_DERIVATION_ALGORITHM = "PBKDF2WithHmacSHA256"
        private const val KEY_LENGTH = 256
        private const val GCM_IV_LENGTH = 12
        private const val GCM_TAG_LENGTH = 128
        private const val ITERATION_COUNT = 65536
        private const val ENCRYPTION_PREFIX = "ENC:"
    }

    private val secureRandom = SecureRandom()
    private val secretKey: SecretKey by lazy { deriveKey() }

    /**
     * Derive encryption key from master key using PBKDF2.
     */
    private fun deriveKey(): SecretKey {
        val effectiveKey = masterKey ?: run {
            logger.warn("No master encryption key configured, using default. This is NOT secure for production!")
            "default-insecure-key-change-me"
        }

        val factory = SecretKeyFactory.getInstance(KEY_DERIVATION_ALGORITHM)
        val spec = PBEKeySpec(effectiveKey.toCharArray(), salt.toByteArray(), ITERATION_COUNT, KEY_LENGTH)
        val tmp = factory.generateSecret(spec)
        return SecretKeySpec(tmp.encoded, KEY_ALGORITHM)
    }

    /**
     * Encrypt a string value.
     * Returns the encrypted value prefixed with "ENC:" to identify encrypted data.
     */
    fun encrypt(plaintext: String?): String? {
        if (plaintext.isNullOrEmpty()) return plaintext
        if (plaintext.startsWith(ENCRYPTION_PREFIX)) return plaintext // Already encrypted

        return try {
            val iv = ByteArray(GCM_IV_LENGTH)
            secureRandom.nextBytes(iv)

            val cipher = Cipher.getInstance(ALGORITHM)
            val gcmSpec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec)

            val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))

            // Combine IV + ciphertext
            val combined = ByteBuffer.allocate(iv.size + ciphertext.size)
                .put(iv)
                .put(ciphertext)
                .array()

            ENCRYPTION_PREFIX + Base64.getEncoder().encodeToString(combined)
        } catch (e: Exception) {
            logger.error("Encryption failed", e)
            throw EncryptionException("Failed to encrypt data", e)
        }
    }

    /**
     * Decrypt a string value.
     * Only processes values prefixed with "ENC:".
     */
    fun decrypt(ciphertext: String?): String? {
        if (ciphertext.isNullOrEmpty()) return ciphertext
        if (!ciphertext.startsWith(ENCRYPTION_PREFIX)) return ciphertext // Not encrypted

        return try {
            val encryptedData = ciphertext.removePrefix(ENCRYPTION_PREFIX)
            val combined = Base64.getDecoder().decode(encryptedData)

            val buffer = ByteBuffer.wrap(combined)
            val iv = ByteArray(GCM_IV_LENGTH)
            buffer.get(iv)
            val encrypted = ByteArray(buffer.remaining())
            buffer.get(encrypted)

            val cipher = Cipher.getInstance(ALGORITHM)
            val gcmSpec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec)

            String(cipher.doFinal(encrypted), Charsets.UTF_8)
        } catch (e: Exception) {
            logger.error("Decryption failed", e)
            throw EncryptionException("Failed to decrypt data", e)
        }
    }

    /**
     * Check if a value is encrypted.
     */
    fun isEncrypted(value: String?): Boolean {
        return value?.startsWith(ENCRYPTION_PREFIX) == true
    }

    /**
     * Encrypt sensitive fields in a map.
     */
    fun encryptFields(data: Map<String, Any?>, fieldsToEncrypt: Set<String>): Map<String, Any?> {
        return data.mapValues { (key, value) ->
            if (key in fieldsToEncrypt && value is String) {
                encrypt(value)
            } else {
                value
            }
        }
    }

    /**
     * Decrypt sensitive fields in a map.
     */
    fun decryptFields(data: Map<String, Any?>, fieldsToDecrypt: Set<String>): Map<String, Any?> {
        return data.mapValues { (key, value) ->
            if (key in fieldsToDecrypt && value is String) {
                decrypt(value)
            } else {
                value
            }
        }
    }
}

/**
 * Exception thrown when encryption/decryption operations fail.
 */
class EncryptionException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
