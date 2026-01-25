package com.liyaqa.referral.application.services

import com.liyaqa.membership.application.services.WalletService
import com.liyaqa.referral.domain.model.Referral
import com.liyaqa.referral.domain.model.ReferralReward
import com.liyaqa.referral.domain.model.RewardType
import com.liyaqa.referral.domain.ports.ReferralConfigRepository
import com.liyaqa.referral.domain.ports.ReferralRewardRepository
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for creating and distributing referral rewards.
 */
@Service
@Transactional
class ReferralRewardService(
    private val rewardRepository: ReferralRewardRepository,
    private val configRepository: ReferralConfigRepository,
    private val walletService: WalletService
) {
    private val logger = LoggerFactory.getLogger(ReferralRewardService::class.java)

    /**
     * Create a reward for a successful referral conversion.
     */
    fun createReward(referral: Referral): ReferralReward? {
        val tenantId = TenantContext.getCurrentTenant().value
        val config = configRepository.findByTenantId(tenantId).orElse(null)
            ?: return null

        if (!config.isEnabled || !config.hasValidRewardConfig()) {
            return null
        }

        val reward = ReferralReward(
            referralId = referral.id,
            memberId = referral.referrerMemberId,
            rewardType = config.referrerRewardType,
            amount = config.referrerRewardAmount,
            currency = config.referrerRewardCurrency
        )

        val saved = rewardRepository.save(reward)
        logger.info("Created reward ${saved.id} for referral ${referral.id}")
        return saved
    }

    /**
     * Distribute a pending reward.
     */
    fun distributeReward(rewardId: UUID): ReferralReward {
        val reward = rewardRepository.findById(rewardId)
            .orElseThrow { NoSuchElementException("Reward not found: $rewardId") }

        require(reward.canDistribute()) {
            "Reward cannot be distributed from status ${reward.status}"
        }

        try {
            when (reward.rewardType) {
                RewardType.WALLET_CREDIT -> {
                    walletService.addCredit(
                        memberId = reward.memberId,
                        amount = Money.of(reward.amount!!, reward.currency),
                        description = "Referral reward for successful referral"
                    )
                    reward.markDistributed()
                }
                RewardType.FREE_DAYS -> {
                    // Free days would be applied when creating the next subscription
                    reward.markDistributed()
                }
                RewardType.DISCOUNT_PERCENT, RewardType.DISCOUNT_AMOUNT -> {
                    // Discounts would be applied at checkout
                    reward.markDistributed()
                }
            }

            val saved = rewardRepository.save(reward)
            logger.info("Distributed reward $rewardId of type ${reward.rewardType}")
            return saved
        } catch (e: Exception) {
            logger.error("Failed to distribute reward $rewardId: ${e.message}", e)
            reward.markFailed()
            rewardRepository.save(reward)
            throw e
        }
    }

    /**
     * Process all pending rewards.
     */
    fun processPendingRewards(batchSize: Int = 100): Int {
        val rewards = rewardRepository.findPendingRewards(batchSize)
        var processedCount = 0

        for (reward in rewards) {
            try {
                distributeReward(reward.id)
                processedCount++
            } catch (e: Exception) {
                logger.error("Error distributing reward ${reward.id}: ${e.message}")
            }
        }

        return processedCount
    }

    /**
     * Get rewards for a member.
     */
    @Transactional(readOnly = true)
    fun getMemberRewards(memberId: UUID, pageable: Pageable): Page<ReferralReward> {
        return rewardRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Get rewards for a referral.
     */
    @Transactional(readOnly = true)
    fun getReferralRewards(referralId: UUID): List<ReferralReward> {
        return rewardRepository.findByReferralId(referralId)
    }

    /**
     * Cancel a pending reward.
     */
    fun cancelReward(rewardId: UUID): ReferralReward {
        val reward = rewardRepository.findById(rewardId)
            .orElseThrow { NoSuchElementException("Reward not found: $rewardId") }

        require(reward.canDistribute()) {
            "Cannot cancel a reward that has already been distributed"
        }

        reward.cancel()
        val saved = rewardRepository.save(reward)
        logger.info("Cancelled reward $rewardId")
        return saved
    }
}
