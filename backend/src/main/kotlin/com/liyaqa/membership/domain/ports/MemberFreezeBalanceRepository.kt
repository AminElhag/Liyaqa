package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.MemberFreezeBalance
import java.util.Optional
import java.util.UUID

interface MemberFreezeBalanceRepository {
    fun save(balance: MemberFreezeBalance): MemberFreezeBalance
    fun findById(id: UUID): Optional<MemberFreezeBalance>
    fun findBySubscriptionId(subscriptionId: UUID): Optional<MemberFreezeBalance>
    fun findByMemberId(memberId: UUID): List<MemberFreezeBalance>
    fun findByMemberIdAndSubscriptionId(memberId: UUID, subscriptionId: UUID): Optional<MemberFreezeBalance>
    fun deleteById(id: UUID)
    fun deleteBySubscriptionId(subscriptionId: UUID)
}
