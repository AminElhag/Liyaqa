package com.liyaqa.referral.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.math.BigDecimal
import java.util.UUID

/**
 * Configuration for the referral program at the tenant level.
 * Each club can have its own referral program configuration.
 */
@Entity
@Table(name = "referral_configs")
class ReferralConfig(
    @Column(name = "is_enabled", nullable = false)
    var isEnabled: Boolean = false,

    @Column(name = "code_prefix", length = 10)
    var codePrefix: String = "REF",

    @Enumerated(EnumType.STRING)
    @Column(name = "referrer_reward_type", nullable = false, length = 50)
    var referrerRewardType: RewardType = RewardType.WALLET_CREDIT,

    @Column(name = "referrer_reward_amount", precision = 10, scale = 2)
    var referrerRewardAmount: BigDecimal? = null,

    @Column(name = "referrer_reward_currency", length = 3)
    var referrerRewardCurrency: String = "SAR",

    @Column(name = "referrer_free_days")
    var referrerFreeDays: Int? = null,

    @Column(name = "min_subscription_days")
    var minSubscriptionDays: Int = 30,

    @Column(name = "max_referrals_per_member")
    var maxReferralsPerMember: Int? = null,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Enable the referral program.
     */
    fun enable() {
        isEnabled = true
    }

    /**
     * Disable the referral program.
     */
    fun disable() {
        isEnabled = false
    }

    /**
     * Update the referral configuration.
     */
    fun update(
        codePrefix: String? = null,
        referrerRewardType: RewardType? = null,
        referrerRewardAmount: BigDecimal? = null,
        referrerRewardCurrency: String? = null,
        referrerFreeDays: Int? = null,
        minSubscriptionDays: Int? = null,
        maxReferralsPerMember: Int? = null
    ) {
        codePrefix?.let { this.codePrefix = it }
        referrerRewardType?.let { this.referrerRewardType = it }
        referrerRewardAmount?.let { this.referrerRewardAmount = it }
        referrerRewardCurrency?.let { this.referrerRewardCurrency = it }
        referrerFreeDays?.let { this.referrerFreeDays = it }
        minSubscriptionDays?.let { this.minSubscriptionDays = it }
        maxReferralsPerMember?.let { this.maxReferralsPerMember = it }
    }

    /**
     * Check if the reward is configured correctly.
     */
    fun hasValidRewardConfig(): Boolean {
        return when (referrerRewardType) {
            RewardType.WALLET_CREDIT, RewardType.DISCOUNT_AMOUNT -> referrerRewardAmount != null && referrerRewardAmount!! > BigDecimal.ZERO
            RewardType.FREE_DAYS -> referrerFreeDays != null && referrerFreeDays!! > 0
            RewardType.DISCOUNT_PERCENT -> referrerRewardAmount != null && referrerRewardAmount!! > BigDecimal.ZERO && referrerRewardAmount!! <= BigDecimal(100)
        }
    }
}
