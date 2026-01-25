package com.liyaqa.notification.domain.ports

import com.liyaqa.notification.domain.model.DeviceToken
import com.liyaqa.notification.domain.model.DevicePlatform
import java.util.UUID

interface DeviceTokenRepository {
    fun save(deviceToken: DeviceToken): DeviceToken
    fun findByToken(token: String): DeviceToken?
    fun findByMemberId(memberId: UUID): List<DeviceToken>
    fun findByMemberIdAndPlatform(memberId: UUID, platform: DevicePlatform): List<DeviceToken>
    fun findByTenantId(tenantId: UUID): List<DeviceToken>
    fun deleteByToken(token: String)
    fun deleteByMemberId(memberId: UUID)
    fun deleteStaleTokens(daysOld: Int)
    fun existsByToken(token: String): Boolean
}
