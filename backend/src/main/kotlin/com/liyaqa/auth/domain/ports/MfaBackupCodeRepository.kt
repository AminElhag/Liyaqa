package com.liyaqa.auth.domain.ports

import com.liyaqa.auth.domain.model.MfaBackupCode
import java.util.UUID

/**
 * Repository interface for MFA backup codes.
 */
interface MfaBackupCodeRepository {
    /**
     * Saves a backup code.
     */
    fun save(backupCode: MfaBackupCode): MfaBackupCode

    /**
     * Saves multiple backup codes.
     */
    fun saveAll(backupCodes: List<MfaBackupCode>): List<MfaBackupCode>

    /**
     * Finds all backup codes for a user.
     */
    fun findByUserId(userId: UUID): List<MfaBackupCode>

    /**
     * Finds a specific backup code by user ID and code hash.
     */
    fun findByUserIdAndCodeHash(userId: UUID, codeHash: String): MfaBackupCode?

    /**
     * Deletes all backup codes for a user.
     */
    fun deleteByUserId(userId: UUID)

    /**
     * Counts unused backup codes for a user.
     */
    fun countUnusedByUserId(userId: UUID): Long
}
