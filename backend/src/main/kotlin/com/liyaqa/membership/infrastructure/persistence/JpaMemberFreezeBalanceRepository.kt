package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.MemberFreezeBalance
import com.liyaqa.membership.domain.ports.MemberFreezeBalanceRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

@Repository
class JpaMemberFreezeBalanceRepository(
    private val springData: SpringDataMemberFreezeBalanceRepository
) : MemberFreezeBalanceRepository {

    override fun save(balance: MemberFreezeBalance): MemberFreezeBalance = springData.save(balance)

    override fun findById(id: UUID): Optional<MemberFreezeBalance> = springData.findById(id)

    override fun findBySubscriptionId(subscriptionId: UUID): Optional<MemberFreezeBalance> =
        springData.findBySubscriptionId(subscriptionId)

    override fun findByMemberId(memberId: UUID): List<MemberFreezeBalance> =
        springData.findByMemberId(memberId)

    override fun findByMemberIdAndSubscriptionId(memberId: UUID, subscriptionId: UUID): Optional<MemberFreezeBalance> =
        springData.findByMemberIdAndSubscriptionId(memberId, subscriptionId)

    override fun deleteById(id: UUID) = springData.deleteById(id)

    override fun deleteBySubscriptionId(subscriptionId: UUID) =
        springData.deleteBySubscriptionId(subscriptionId)
}

interface SpringDataMemberFreezeBalanceRepository : JpaRepository<MemberFreezeBalance, UUID> {
    fun findBySubscriptionId(subscriptionId: UUID): Optional<MemberFreezeBalance>
    fun findByMemberId(memberId: UUID): List<MemberFreezeBalance>
    fun findByMemberIdAndSubscriptionId(memberId: UUID, subscriptionId: UUID): Optional<MemberFreezeBalance>
    fun deleteBySubscriptionId(subscriptionId: UUID)
}
