package com.liyaqa.platform.access.repository

import com.liyaqa.platform.access.model.PlatformInviteToken
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataPlatformInviteTokenRepository : JpaRepository<PlatformInviteToken, UUID> {
    fun findByTokenHash(tokenHash: String): Optional<PlatformInviteToken>
    fun findByEmailAndTypeAndIsUsedFalse(email: String, type: PlatformInviteToken.TokenType): List<PlatformInviteToken>

    @Modifying
    @Query("DELETE FROM PlatformInviteToken t WHERE t.expiresAt < :cutoff")
    fun deleteByExpiresAtBefore(cutoff: Instant)
}

@Repository
class JpaPlatformInviteTokenRepository(
    private val springDataRepository: SpringDataPlatformInviteTokenRepository
) : PlatformInviteTokenRepository {

    override fun save(token: PlatformInviteToken): PlatformInviteToken =
        springDataRepository.save(token)

    override fun findByTokenHash(tokenHash: String): Optional<PlatformInviteToken> =
        springDataRepository.findByTokenHash(tokenHash)

    override fun findByEmailAndTypeAndIsUsedFalse(email: String, type: PlatformInviteToken.TokenType): List<PlatformInviteToken> =
        springDataRepository.findByEmailAndTypeAndIsUsedFalse(email, type)

    override fun deleteByExpiresAtBefore(cutoff: Instant) =
        springDataRepository.deleteByExpiresAtBefore(cutoff)
}
