package com.liyaqa.auth.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Represents a backup code for MFA recovery.
 * Backup codes are one-time use codes that can be used when the user loses access to their authenticator device.
 */
@Entity
@Table(name = "mfa_backup_codes")
class MfaBackupCode(
    id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "code_hash", nullable = false)
    val codeHash: String,

    @Column(name = "used", nullable = false)
    var used: Boolean = false,

    @Column(name = "used_at")
    var usedAt: Instant? = null

) : BaseEntity(id) {

    /**
     * Marks this backup code as used.
     */
    fun markAsUsed() {
        used = true
        usedAt = Instant.now()
    }

    /**
     * Checks if this backup code can still be used.
     */
    fun canBeUsed(): Boolean = !used
}
