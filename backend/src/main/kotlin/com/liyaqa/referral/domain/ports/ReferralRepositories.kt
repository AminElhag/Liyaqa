package com.liyaqa.referral.domain.ports

import com.liyaqa.referral.domain.model.Referral
import com.liyaqa.referral.domain.model.ReferralCode
import com.liyaqa.referral.domain.model.ReferralConfig
import com.liyaqa.referral.domain.model.ReferralReward
import com.liyaqa.referral.domain.model.ReferralStatus
import com.liyaqa.referral.domain.model.RewardStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository for referral program configuration.
 */
interface ReferralConfigRepository {
    fun save(config: ReferralConfig): ReferralConfig
    fun findByTenantId(tenantId: UUID): Optional<ReferralConfig>
    fun existsByTenantId(tenantId: UUID): Boolean
}

/**
 * Repository for referral codes.
 */
interface ReferralCodeRepository {
    fun save(code: ReferralCode): ReferralCode
    fun findById(id: UUID): Optional<ReferralCode>
    fun findByMemberId(memberId: UUID): Optional<ReferralCode>
    fun findByCode(code: String): Optional<ReferralCode>
    fun existsByCode(code: String): Boolean
    fun findAll(pageable: Pageable): Page<ReferralCode>
    fun findTopReferrers(limit: Int): List<ReferralCode>
}

/**
 * Repository for referral tracking.
 */
interface ReferralRepository {
    fun save(referral: Referral): Referral
    fun findById(id: UUID): Optional<Referral>
    fun findAll(pageable: Pageable): Page<Referral>
    fun findByReferralCodeId(referralCodeId: UUID, pageable: Pageable): Page<Referral>
    fun findByReferrerMemberId(referrerMemberId: UUID, pageable: Pageable): Page<Referral>
    fun findByRefereeMemberId(refereeMemberId: UUID): Optional<Referral>
    fun findByStatus(status: ReferralStatus, pageable: Pageable): Page<Referral>
    fun countByReferrerMemberId(referrerMemberId: UUID): Long
    fun countByReferrerMemberIdAndStatus(referrerMemberId: UUID, status: ReferralStatus): Long
    fun countByStatus(status: ReferralStatus): Long
}

/**
 * Repository for referral rewards.
 */
interface ReferralRewardRepository {
    fun save(reward: ReferralReward): ReferralReward
    fun findById(id: UUID): Optional<ReferralReward>
    fun findAll(pageable: Pageable): Page<ReferralReward>
    fun findByReferralId(referralId: UUID): List<ReferralReward>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<ReferralReward>
    fun findByStatus(status: RewardStatus, pageable: Pageable): Page<ReferralReward>
    fun findPendingRewards(limit: Int): List<ReferralReward>
    fun countByStatus(status: RewardStatus): Long
    fun sumDistributedAmount(): java.math.BigDecimal?
}
