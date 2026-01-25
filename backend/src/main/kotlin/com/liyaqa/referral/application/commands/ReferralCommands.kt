package com.liyaqa.referral.application.commands

import com.liyaqa.referral.domain.model.RewardType
import java.math.BigDecimal
import java.util.UUID

/**
 * Command to update referral program configuration.
 */
data class UpdateReferralConfigCommand(
    val isEnabled: Boolean,
    val codePrefix: String = "REF",
    val referrerRewardType: RewardType,
    val referrerRewardAmount: BigDecimal? = null,
    val referrerRewardCurrency: String = "SAR",
    val referrerFreeDays: Int? = null,
    val minSubscriptionDays: Int = 30,
    val maxReferralsPerMember: Int? = null
)

/**
 * Command to track a referral click.
 */
data class TrackReferralClickCommand(
    val code: String,
    val visitorId: String? = null
)

/**
 * Command to convert a referral.
 */
data class ConvertReferralCommand(
    val refereeMemberId: UUID,
    val subscriptionId: UUID
)
