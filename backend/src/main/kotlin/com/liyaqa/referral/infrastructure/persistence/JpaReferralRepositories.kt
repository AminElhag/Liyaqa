package com.liyaqa.referral.infrastructure.persistence

import com.liyaqa.referral.domain.model.Referral
import com.liyaqa.referral.domain.model.ReferralCode
import com.liyaqa.referral.domain.model.ReferralConfig
import com.liyaqa.referral.domain.model.ReferralReward
import com.liyaqa.referral.domain.model.ReferralStatus
import com.liyaqa.referral.domain.model.RewardStatus
import com.liyaqa.referral.domain.ports.ReferralCodeRepository
import com.liyaqa.referral.domain.ports.ReferralConfigRepository
import com.liyaqa.referral.domain.ports.ReferralRepository
import com.liyaqa.referral.domain.ports.ReferralRewardRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

// ============ Spring Data Interfaces ============

interface SpringDataReferralConfigRepository : JpaRepository<ReferralConfig, UUID> {
    fun findByTenantId(tenantId: UUID): Optional<ReferralConfig>
    fun existsByTenantId(tenantId: UUID): Boolean
}

interface SpringDataReferralCodeRepository : JpaRepository<ReferralCode, UUID> {
    fun findByMemberId(memberId: UUID): Optional<ReferralCode>
    fun findByCode(code: String): Optional<ReferralCode>
    fun existsByCode(code: String): Boolean

    @Query("""
        SELECT rc FROM ReferralCode rc
        WHERE rc.isActive = true
        ORDER BY rc.conversionCount DESC
    """)
    fun findTopReferrers(pageable: Pageable): List<ReferralCode>
}

interface SpringDataReferralRepository : JpaRepository<Referral, UUID> {
    fun findByReferralCodeId(referralCodeId: UUID, pageable: Pageable): Page<Referral>
    fun findByReferrerMemberId(referrerMemberId: UUID, pageable: Pageable): Page<Referral>
    fun findByRefereeMemberId(refereeMemberId: UUID): Optional<Referral>
    fun findByStatus(status: ReferralStatus, pageable: Pageable): Page<Referral>
    fun countByReferrerMemberId(referrerMemberId: UUID): Long
    fun countByReferrerMemberIdAndStatus(referrerMemberId: UUID, status: ReferralStatus): Long
    fun countByStatus(status: ReferralStatus): Long
}

interface SpringDataReferralRewardRepository : JpaRepository<ReferralReward, UUID> {
    fun findByReferralId(referralId: UUID): List<ReferralReward>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<ReferralReward>
    fun findByStatus(status: RewardStatus, pageable: Pageable): Page<ReferralReward>
    fun countByStatus(status: RewardStatus): Long

    @Query("""
        SELECT rr FROM ReferralReward rr
        WHERE rr.status = 'PENDING'
        ORDER BY rr.createdAt ASC
    """)
    fun findPendingRewards(pageable: Pageable): List<ReferralReward>

    @Query("""
        SELECT COALESCE(SUM(rr.amount), 0) FROM ReferralReward rr
        WHERE rr.status = 'DISTRIBUTED'
    """)
    fun sumDistributedAmount(): java.math.BigDecimal?
}

// ============ Repository Implementations ============

@Repository
class JpaReferralConfigRepository(
    private val springDataRepository: SpringDataReferralConfigRepository
) : ReferralConfigRepository {

    override fun save(config: ReferralConfig): ReferralConfig {
        return springDataRepository.save(config)
    }

    override fun findByTenantId(tenantId: UUID): Optional<ReferralConfig> {
        return springDataRepository.findByTenantId(tenantId)
    }

    override fun existsByTenantId(tenantId: UUID): Boolean {
        return springDataRepository.existsByTenantId(tenantId)
    }
}

@Repository
class JpaReferralCodeRepository(
    private val springDataRepository: SpringDataReferralCodeRepository
) : ReferralCodeRepository {

    override fun save(code: ReferralCode): ReferralCode {
        return springDataRepository.save(code)
    }

    override fun findById(id: UUID): Optional<ReferralCode> {
        return springDataRepository.findById(id)
    }

    override fun findByMemberId(memberId: UUID): Optional<ReferralCode> {
        return springDataRepository.findByMemberId(memberId)
    }

    override fun findByCode(code: String): Optional<ReferralCode> {
        return springDataRepository.findByCode(code)
    }

    override fun existsByCode(code: String): Boolean {
        return springDataRepository.existsByCode(code)
    }

    override fun findAll(pageable: Pageable): Page<ReferralCode> {
        return springDataRepository.findAll(pageable)
    }

    override fun findTopReferrers(limit: Int): List<ReferralCode> {
        return springDataRepository.findTopReferrers(PageRequest.of(0, limit))
    }
}

@Repository
class JpaReferralRepository(
    private val springDataRepository: SpringDataReferralRepository
) : ReferralRepository {

    override fun save(referral: Referral): Referral {
        return springDataRepository.save(referral)
    }

    override fun findById(id: UUID): Optional<Referral> {
        return springDataRepository.findById(id)
    }

    override fun findByReferralCodeId(referralCodeId: UUID, pageable: Pageable): Page<Referral> {
        return springDataRepository.findByReferralCodeId(referralCodeId, pageable)
    }

    override fun findByReferrerMemberId(referrerMemberId: UUID, pageable: Pageable): Page<Referral> {
        return springDataRepository.findByReferrerMemberId(referrerMemberId, pageable)
    }

    override fun findByRefereeMemberId(refereeMemberId: UUID): Optional<Referral> {
        return springDataRepository.findByRefereeMemberId(refereeMemberId)
    }

    override fun findByStatus(status: ReferralStatus, pageable: Pageable): Page<Referral> {
        return springDataRepository.findByStatus(status, pageable)
    }

    override fun countByReferrerMemberId(referrerMemberId: UUID): Long {
        return springDataRepository.countByReferrerMemberId(referrerMemberId)
    }

    override fun countByReferrerMemberIdAndStatus(referrerMemberId: UUID, status: ReferralStatus): Long {
        return springDataRepository.countByReferrerMemberIdAndStatus(referrerMemberId, status)
    }

    override fun findAll(pageable: Pageable): Page<Referral> {
        return springDataRepository.findAll(pageable)
    }

    override fun countByStatus(status: ReferralStatus): Long {
        return springDataRepository.countByStatus(status)
    }
}

@Repository
class JpaReferralRewardRepository(
    private val springDataRepository: SpringDataReferralRewardRepository
) : ReferralRewardRepository {

    override fun save(reward: ReferralReward): ReferralReward {
        return springDataRepository.save(reward)
    }

    override fun findById(id: UUID): Optional<ReferralReward> {
        return springDataRepository.findById(id)
    }

    override fun findByReferralId(referralId: UUID): List<ReferralReward> {
        return springDataRepository.findByReferralId(referralId)
    }

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<ReferralReward> {
        return springDataRepository.findByMemberId(memberId, pageable)
    }

    override fun findByStatus(status: RewardStatus, pageable: Pageable): Page<ReferralReward> {
        return springDataRepository.findByStatus(status, pageable)
    }

    override fun findPendingRewards(limit: Int): List<ReferralReward> {
        return springDataRepository.findPendingRewards(PageRequest.of(0, limit))
    }

    override fun findAll(pageable: Pageable): Page<ReferralReward> {
        return springDataRepository.findAll(pageable)
    }

    override fun countByStatus(status: RewardStatus): Long {
        return springDataRepository.countByStatus(status)
    }

    override fun sumDistributedAmount(): java.math.BigDecimal? {
        return springDataRepository.sumDistributedAmount()
    }
}
