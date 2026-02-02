package com.liyaqa.auth.infrastructure.persistence

import com.liyaqa.auth.domain.model.MfaBackupCode
import com.liyaqa.auth.domain.ports.MfaBackupCodeRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

interface SpringDataMfaBackupCodeRepository : JpaRepository<MfaBackupCode, UUID> {
    fun findByUserId(userId: UUID): List<MfaBackupCode>
    fun findByUserIdAndCodeHash(userId: UUID, codeHash: String): MfaBackupCode?
    fun deleteByUserId(userId: UUID)
    fun countByUserIdAndUsed(userId: UUID, used: Boolean): Long
}

@Repository
class JpaMfaBackupCodeRepository(
    private val springDataRepository: SpringDataMfaBackupCodeRepository
) : MfaBackupCodeRepository {

    override fun save(backupCode: MfaBackupCode): MfaBackupCode =
        springDataRepository.save(backupCode)

    override fun saveAll(backupCodes: List<MfaBackupCode>): List<MfaBackupCode> =
        springDataRepository.saveAll(backupCodes)

    override fun findByUserId(userId: UUID): List<MfaBackupCode> =
        springDataRepository.findByUserId(userId)

    override fun findByUserIdAndCodeHash(userId: UUID, codeHash: String): MfaBackupCode? =
        springDataRepository.findByUserIdAndCodeHash(userId, codeHash)

    override fun deleteByUserId(userId: UUID) =
        springDataRepository.deleteByUserId(userId)

    override fun countUnusedByUserId(userId: UUID): Long =
        springDataRepository.countByUserIdAndUsed(userId, false)
}
