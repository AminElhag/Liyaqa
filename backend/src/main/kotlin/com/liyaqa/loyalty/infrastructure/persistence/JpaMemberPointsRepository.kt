package com.liyaqa.loyalty.infrastructure.persistence

import com.liyaqa.loyalty.domain.model.LoyaltyTier
import com.liyaqa.loyalty.domain.model.MemberPoints
import com.liyaqa.loyalty.domain.ports.MemberPointsRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

interface SpringDataMemberPointsRepository : JpaRepository<MemberPoints, UUID> {
    fun findByMemberId(memberId: UUID): Optional<MemberPoints>
    fun existsByMemberId(memberId: UUID): Boolean
    fun findByTier(tier: LoyaltyTier, pageable: Pageable): Page<MemberPoints>

    @Query("SELECT mp FROM MemberPoints mp ORDER BY mp.pointsBalance DESC")
    fun findTopByPointsBalance(pageable: Pageable): Page<MemberPoints>

    fun deleteByMemberId(memberId: UUID)
}

@Repository
class JpaMemberPointsRepository(
    private val springDataRepository: SpringDataMemberPointsRepository
) : MemberPointsRepository {

    override fun save(memberPoints: MemberPoints): MemberPoints =
        springDataRepository.save(memberPoints)

    override fun findById(id: UUID): Optional<MemberPoints> =
        springDataRepository.findById(id)

    override fun findByMemberId(memberId: UUID): Optional<MemberPoints> =
        springDataRepository.findByMemberId(memberId)

    override fun existsByMemberId(memberId: UUID): Boolean =
        springDataRepository.existsByMemberId(memberId)

    override fun findAll(pageable: Pageable): Page<MemberPoints> =
        springDataRepository.findAll(pageable)

    override fun findByTier(tier: LoyaltyTier, pageable: Pageable): Page<MemberPoints> =
        springDataRepository.findByTier(tier, pageable)

    override fun findTopByPointsBalance(pageable: Pageable): Page<MemberPoints> =
        springDataRepository.findTopByPointsBalance(pageable)

    override fun deleteByMemberId(memberId: UUID) =
        springDataRepository.deleteByMemberId(memberId)
}
