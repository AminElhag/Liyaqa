package com.liyaqa.auth.domain.ports

import com.liyaqa.auth.domain.model.AccountTypeSession
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for AccountTypeSession entity.
 */
interface AccountTypeSessionRepository {
    fun save(session: AccountTypeSession): AccountTypeSession
    fun findByTokenHash(tokenHash: String): Optional<AccountTypeSession>
    fun deleteByUserId(userId: UUID)
    fun deleteExpiredBefore(timestamp: Instant): Int
}
