package com.liyaqa.scheduling.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.MemberCategoryBalance
import com.liyaqa.scheduling.domain.ports.MemberCategoryBalanceRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataMemberCategoryBalanceRepository : JpaRepository<MemberCategoryBalance, UUID> {
    fun findByBalanceId(balanceId: UUID): List<MemberCategoryBalance>
    fun findByBalanceIdAndCategoryId(balanceId: UUID, categoryId: UUID): Optional<MemberCategoryBalance>
}

@Repository
class JpaMemberCategoryBalanceRepository(
    private val springDataRepository: SpringDataMemberCategoryBalanceRepository
) : MemberCategoryBalanceRepository {

    override fun save(balance: MemberCategoryBalance): MemberCategoryBalance =
        springDataRepository.save(balance)

    override fun saveAll(balances: List<MemberCategoryBalance>): List<MemberCategoryBalance> =
        springDataRepository.saveAll(balances)

    override fun findById(id: UUID): Optional<MemberCategoryBalance> =
        springDataRepository.findById(id)

    override fun findByBalanceId(balanceId: UUID): List<MemberCategoryBalance> =
        springDataRepository.findByBalanceId(balanceId)

    override fun findByBalanceIdAndCategoryId(balanceId: UUID, categoryId: UUID): Optional<MemberCategoryBalance> =
        springDataRepository.findByBalanceIdAndCategoryId(balanceId, categoryId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)
}
