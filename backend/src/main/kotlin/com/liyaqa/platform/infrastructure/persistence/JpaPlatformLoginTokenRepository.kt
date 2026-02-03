package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.PlatformLoginToken
import com.liyaqa.platform.domain.ports.PlatformLoginTokenRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA interface for PlatformLoginToken.
 */
interface SpringDataPlatformLoginTokenRepository : JpaRepository<PlatformLoginToken, UUID> {
    fun findByCodeHash(codeHash: String): Optional<PlatformLoginToken>
    fun findByEmail(email: String): List<PlatformLoginToken>
    fun countByEmailAndCreatedAtAfter(email: String, timestamp: Instant): Long

    @Modifying
    @Transactional
    fun deleteByEmail(email: String)

    @Modifying
    @Transactional
    fun deleteByExpiresAtBefore(timestamp: Instant)
}

/**
 * JPA adapter implementation for PlatformLoginTokenRepository.
 */
@Repository
class JpaPlatformLoginTokenRepository(
    private val springDataRepository: SpringDataPlatformLoginTokenRepository
) : PlatformLoginTokenRepository {

    override fun save(token: PlatformLoginToken): PlatformLoginToken =
        springDataRepository.save(token)

    override fun findById(id: UUID): Optional<PlatformLoginToken> =
        springDataRepository.findById(id)

    override fun findByCodeHash(codeHash: String): Optional<PlatformLoginToken> =
        springDataRepository.findByCodeHash(codeHash)

    override fun findByEmail(email: String): List<PlatformLoginToken> =
        springDataRepository.findByEmail(email)

    override fun deleteByEmail(email: String) =
        springDataRepository.deleteByEmail(email)

    override fun deleteByExpiresAtBefore(timestamp: Instant) =
        springDataRepository.deleteByExpiresAtBefore(timestamp)

    override fun countByEmailAndCreatedAtAfter(email: String, timestamp: Instant): Long =
        springDataRepository.countByEmailAndCreatedAtAfter(email, timestamp)
}
