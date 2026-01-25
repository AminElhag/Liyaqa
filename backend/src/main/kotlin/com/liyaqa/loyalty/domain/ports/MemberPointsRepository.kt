package com.liyaqa.loyalty.domain.ports

import com.liyaqa.loyalty.domain.model.LoyaltyTier
import com.liyaqa.loyalty.domain.model.MemberPoints
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.*

interface MemberPointsRepository {
    fun save(memberPoints: MemberPoints): MemberPoints
    fun findById(id: UUID): Optional<MemberPoints>
    fun findByMemberId(memberId: UUID): Optional<MemberPoints>
    fun existsByMemberId(memberId: UUID): Boolean
    fun findAll(pageable: Pageable): Page<MemberPoints>
    fun findByTier(tier: LoyaltyTier, pageable: Pageable): Page<MemberPoints>
    fun findTopByPointsBalance(pageable: Pageable): Page<MemberPoints>
    fun deleteByMemberId(memberId: UUID)
}
