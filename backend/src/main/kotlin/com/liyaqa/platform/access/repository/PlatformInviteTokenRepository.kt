package com.liyaqa.platform.access.repository

import com.liyaqa.platform.access.model.PlatformInviteToken
import java.time.Instant
import java.util.Optional

interface PlatformInviteTokenRepository {
    fun save(token: PlatformInviteToken): PlatformInviteToken
    fun findByTokenHash(tokenHash: String): Optional<PlatformInviteToken>
    fun findByEmailAndTypeAndIsUsedFalse(email: String, type: PlatformInviteToken.TokenType): List<PlatformInviteToken>
    fun deleteByExpiresAtBefore(cutoff: Instant)
}
