package com.liyaqa.auth.infrastructure.persistence

import com.liyaqa.auth.domain.model.MfaBackupCode
import com.liyaqa.auth.domain.ports.MfaBackupCodeRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface JpaMfaBackupCodeRepository : JpaRepository<MfaBackupCode, UUID>, MfaBackupCodeRepository {
    override fun findByUserId(userId: UUID): List<MfaBackupCode>
    override fun findByUserIdAndCodeHash(userId: UUID, codeHash: String): MfaBackupCode?
    override fun deleteByUserId(userId: UUID)

    /**
     * Counts backup codes by user and used status.
     */
    fun countByUserIdAndUsed(userId: UUID, used: Boolean): Long

    /**
     * Counts unused backup codes for a user.
     */
    override fun countUnusedByUserId(userId: UUID): Long {
        return countByUserIdAndUsed(userId, false)
    }
}
