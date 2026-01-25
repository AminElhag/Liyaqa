package com.liyaqa.notification.application.services

import com.liyaqa.notification.domain.model.DeviceToken
import com.liyaqa.notification.domain.model.DevicePlatform
import com.liyaqa.notification.domain.ports.DeviceTokenRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class DeviceTokenService(
    private val deviceTokenRepository: DeviceTokenRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun registerToken(
        memberId: UUID,
        token: String,
        platform: DevicePlatform,
        tenantId: UUID,
        deviceName: String? = null,
        appVersion: String? = null
    ): DeviceToken {
        // Check if token already exists
        val existingToken = deviceTokenRepository.findByToken(token)

        return if (existingToken != null) {
            // Update last used timestamp
            existingToken.updateLastUsed()
            deviceTokenRepository.save(existingToken)
        } else {
            // Create new token
            val newToken = DeviceToken(
                memberId = memberId,
                token = token,
                platform = platform,
                tenantId = tenantId,
                deviceName = deviceName,
                appVersion = appVersion
            )
            deviceTokenRepository.save(newToken)
        }
    }

    @Transactional
    fun unregisterToken(token: String) {
        if (deviceTokenRepository.existsByToken(token)) {
            deviceTokenRepository.deleteByToken(token)
            logger.info("Unregistered device token")
        }
    }

    @Transactional
    fun unregisterAllTokensForMember(memberId: UUID) {
        deviceTokenRepository.deleteByMemberId(memberId)
        logger.info("Unregistered all device tokens for member: $memberId")
    }

    fun getTokensForMember(memberId: UUID): List<DeviceToken> =
        deviceTokenRepository.findByMemberId(memberId)

    fun getTokensForTenant(tenantId: UUID): List<DeviceToken> =
        deviceTokenRepository.findByTenantId(tenantId)

    /**
     * Clean up stale tokens that haven't been used in 90 days
     */
    @Scheduled(cron = "0 0 3 * * *") // Run daily at 3 AM
    @Transactional
    fun cleanupStaleTokens() {
        logger.info("Starting stale device token cleanup")
        deviceTokenRepository.deleteStaleTokens(90)
        logger.info("Completed stale device token cleanup")
    }
}
