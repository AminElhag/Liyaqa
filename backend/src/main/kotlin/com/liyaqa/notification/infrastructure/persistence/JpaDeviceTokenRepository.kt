package com.liyaqa.notification.infrastructure.persistence

import com.liyaqa.notification.domain.model.DeviceToken
import com.liyaqa.notification.domain.model.DevicePlatform
import com.liyaqa.notification.domain.ports.DeviceTokenRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

@Repository
interface SpringDataDeviceTokenRepository : JpaRepository<DeviceToken, UUID> {
    fun findByToken(token: String): DeviceToken?
    fun findByMemberId(memberId: UUID): List<DeviceToken>
    fun findByMemberIdAndPlatform(memberId: UUID, platform: DevicePlatform): List<DeviceToken>
    fun findByTenantId(tenantId: UUID): List<DeviceToken>
    fun deleteByToken(token: String)
    fun deleteByMemberId(memberId: UUID)
    fun existsByToken(token: String): Boolean

    @Modifying
    @Query("DELETE FROM DeviceToken d WHERE d.lastUsedAt < :cutoffDate")
    fun deleteByLastUsedAtBefore(@Param("cutoffDate") cutoffDate: Instant)
}

@Repository
class JpaDeviceTokenRepository(
    private val springDataRepository: SpringDataDeviceTokenRepository
) : DeviceTokenRepository {

    override fun save(deviceToken: DeviceToken): DeviceToken =
        springDataRepository.save(deviceToken)

    override fun findByToken(token: String): DeviceToken? =
        springDataRepository.findByToken(token)

    override fun findByMemberId(memberId: UUID): List<DeviceToken> =
        springDataRepository.findByMemberId(memberId)

    override fun findByMemberIdAndPlatform(memberId: UUID, platform: DevicePlatform): List<DeviceToken> =
        springDataRepository.findByMemberIdAndPlatform(memberId, platform)

    override fun findByTenantId(tenantId: UUID): List<DeviceToken> =
        springDataRepository.findByTenantId(tenantId)

    override fun deleteByToken(token: String) =
        springDataRepository.deleteByToken(token)

    override fun deleteByMemberId(memberId: UUID) =
        springDataRepository.deleteByMemberId(memberId)

    override fun deleteStaleTokens(daysOld: Int) {
        val cutoffDate = Instant.now().minusSeconds(daysOld * 24L * 60 * 60)
        springDataRepository.deleteByLastUsedAtBefore(cutoffDate)
    }

    override fun existsByToken(token: String): Boolean =
        springDataRepository.existsByToken(token)
}
