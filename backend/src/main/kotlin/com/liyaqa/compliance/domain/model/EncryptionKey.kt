package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Version
import java.time.Instant
import java.util.UUID

/**
 * Encryption key metadata (actual keys stored in vault).
 */
@Entity
@Table(name = "encryption_keys")
class EncryptionKey(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    @Column(name = "key_alias", nullable = false)
    val keyAlias: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "key_type", nullable = false)
    val keyType: KeyType,

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false)
    val purpose: KeyPurpose,

    @Column(name = "vault_reference")
    var vaultReference: String? = null,

    @Column(name = "algorithm", nullable = false)
    val algorithm: String,

    @Column(name = "key_size", nullable = false)
    val keySize: Int,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "rotated_at")
    var rotatedAt: Instant? = null,

    @Column(name = "expires_at")
    var expiresAt: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    var status: KeyStatus = KeyStatus.ACTIVE,

    @Column(name = "created_by")
    val createdBy: UUID? = null,

    @Version
    @Column(name = "version")
    var version: Long = 0
) {
    /**
     * Mark key as being rotated.
     */
    fun startRotation() {
        status = KeyStatus.ROTATING
    }

    /**
     * Complete key rotation.
     */
    fun completeRotation(newVaultReference: String) {
        vaultReference = newVaultReference
        rotatedAt = Instant.now()
        status = KeyStatus.ACTIVE
    }

    /**
     * Expire the key.
     */
    fun expire() {
        status = KeyStatus.EXPIRED
        expiresAt = Instant.now()
    }

    /**
     * Revoke the key.
     */
    fun revoke() {
        status = KeyStatus.REVOKED
    }

    /**
     * Check if key is active and valid.
     */
    fun isValid(): Boolean {
        return status == KeyStatus.ACTIVE &&
                (expiresAt == null || expiresAt!!.isAfter(Instant.now()))
    }

    /**
     * Check if key needs rotation.
     */
    fun needsRotation(maxAgeDays: Int = 365): Boolean {
        val lastRotation = rotatedAt ?: createdAt
        val ageDays = java.time.Duration.between(lastRotation, Instant.now()).toDays()
        return ageDays >= maxAgeDays
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is EncryptionKey) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
