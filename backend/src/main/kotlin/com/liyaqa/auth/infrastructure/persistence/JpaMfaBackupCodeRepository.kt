package com.liyaqa.auth.infrastructure.persistence

import com.liyaqa.auth.domain.model.MfaBackupCode
import com.liyaqa.auth.domain.ports.MfaBackupCodeRepository
import org.springframework.context.annotation.Primary
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Component
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface JpaMfaBackupCodeRepository : JpaRepository<MfaBackupCode, UUID> {
    fun findByUserId(userId: UUID): List<MfaBackupCode>
    fun findByUserIdAndCodeHash(userId: UUID, codeHash: String): MfaBackupCode?
    fun deleteByUserId(userId: UUID)
    fun countByUserIdAndUsed(userId: UUID, used: Boolean): Long
}

@Component
@Primary
class MfaBackupCodeRepositoryAdapter(
    private val jpaRepository: JpaMfaBackupCodeRepository
) : MfaBackupCodeRepository {

    override fun save(backupCode: MfaBackupCode): MfaBackupCode =
        jpaRepository.save(backupCode)

    override fun saveAll(backupCodes: List<MfaBackupCode>): List<MfaBackupCode> =
        jpaRepository.saveAll(backupCodes)

    override fun findByUserId(userId: UUID): List<MfaBackupCode> =
        jpaRepository.findByUserId(userId)

    override fun findByUserIdAndCodeHash(userId: UUID, codeHash: String): MfaBackupCode? =
        jpaRepository.findByUserIdAndCodeHash(userId, codeHash)

    override fun deleteByUserId(userId: UUID) =
        jpaRepository.deleteByUserId(userId)

    override fun countUnusedByUserId(userId: UUID): Long =
        jpaRepository.countByUserIdAndUsed(userId, false)
}
