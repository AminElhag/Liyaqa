package com.liyaqa.auth.infrastructure.persistence

import com.liyaqa.auth.domain.model.AccountTypeSession
import com.liyaqa.auth.domain.ports.AccountTypeSessionRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataAccountTypeSessionRepository : JpaRepository<AccountTypeSession, UUID> {
    fun findByTokenHash(tokenHash: String): Optional<AccountTypeSession>
    fun deleteByUserId(userId: UUID)

    @Modifying
    @Query("DELETE FROM AccountTypeSession s WHERE s.expiresAt < :timestamp")
    fun deleteExpiredBefore(@Param("timestamp") timestamp: Instant): Int
}

@Repository
class JpaAccountTypeSessionRepository(
    private val springDataRepository: SpringDataAccountTypeSessionRepository
) : AccountTypeSessionRepository {

    override fun save(session: AccountTypeSession): AccountTypeSession =
        springDataRepository.save(session)

    override fun findByTokenHash(tokenHash: String): Optional<AccountTypeSession> =
        springDataRepository.findByTokenHash(tokenHash)

    override fun deleteByUserId(userId: UUID) =
        springDataRepository.deleteByUserId(userId)

    override fun deleteExpiredBefore(timestamp: Instant): Int =
        springDataRepository.deleteExpiredBefore(timestamp)
}
