package com.liyaqa.referral.application.services

import com.liyaqa.referral.application.commands.UpdateReferralConfigCommand
import com.liyaqa.referral.domain.model.ReferralConfig
import com.liyaqa.referral.domain.ports.ReferralConfigRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Service for managing referral program configuration.
 */
@Service
@Transactional
class ReferralConfigService(
    private val configRepository: ReferralConfigRepository
) {
    private val logger = LoggerFactory.getLogger(ReferralConfigService::class.java)

    /**
     * Get the referral configuration for the current tenant.
     * Creates a default disabled config if none exists.
     */
    fun getConfig(): ReferralConfig {
        val tenantId = TenantContext.getCurrentTenant().value
        return configRepository.findByTenantId(tenantId).orElseGet {
            val newConfig = ReferralConfig()
            configRepository.save(newConfig)
        }
    }

    /**
     * Update the referral configuration.
     */
    fun updateConfig(command: UpdateReferralConfigCommand): ReferralConfig {
        val config = getConfig()

        config.isEnabled = command.isEnabled
        config.update(
            codePrefix = command.codePrefix,
            referrerRewardType = command.referrerRewardType,
            referrerRewardAmount = command.referrerRewardAmount,
            referrerRewardCurrency = command.referrerRewardCurrency,
            referrerFreeDays = command.referrerFreeDays,
            minSubscriptionDays = command.minSubscriptionDays,
            maxReferralsPerMember = command.maxReferralsPerMember
        )

        val saved = configRepository.save(config)
        logger.info("Updated referral config for tenant ${TenantContext.getCurrentTenant()}")
        return saved
    }

    /**
     * Enable the referral program.
     */
    fun enable(): ReferralConfig {
        val config = getConfig()
        require(config.hasValidRewardConfig()) {
            "Cannot enable referral program without valid reward configuration"
        }
        config.enable()
        return configRepository.save(config)
    }

    /**
     * Disable the referral program.
     */
    fun disable(): ReferralConfig {
        val config = getConfig()
        config.disable()
        return configRepository.save(config)
    }

    /**
     * Check if the referral program is enabled.
     */
    @Transactional(readOnly = true)
    fun isEnabled(): Boolean {
        val tenantId = TenantContext.getCurrentTenant().value
        return configRepository.findByTenantId(tenantId)
            .map { it.isEnabled }
            .orElse(false)
    }
}
