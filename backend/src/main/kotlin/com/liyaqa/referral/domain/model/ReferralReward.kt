package com.liyaqa.referral.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Reward earned from a successful referral.
 */
@Entity
@Table(name = "referral_rewards")
class ReferralReward(
    @Column(name = "referral_id", nullable = false)
    val referralId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_type", nullable = false, length = 50)
    val rewardType: RewardType,

    @Column(name = "amount", precision = 10, scale = 2)
    val amount: BigDecimal? = null,

    @Column(name = "currency", length = 3)
    val currency: String = "SAR",

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: RewardStatus = RewardStatus.PENDING,

    @Column(name = "distributed_at")
    var distributedAt: Instant? = null,

    @Column(name = "wallet_transaction_id")
    var walletTransactionId: UUID? = null,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Mark the reward as distributed.
     */
    fun markDistributed(walletTransactionId: UUID? = null) {
        this.status = RewardStatus.DISTRIBUTED
        this.distributedAt = Instant.now()
        this.walletTransactionId = walletTransactionId
    }

    /**
     * Mark the reward as failed.
     */
    fun markFailed() {
        this.status = RewardStatus.FAILED
    }

    /**
     * Cancel the reward.
     */
    fun cancel() {
        this.status = RewardStatus.CANCELLED
    }

    /**
     * Check if the reward can be distributed.
     */
    fun canDistribute(): Boolean {
        return status == RewardStatus.PENDING
    }

    /**
     * Check if the reward has been distributed.
     */
    fun isDistributed(): Boolean {
        return status == RewardStatus.DISTRIBUTED
    }
}
