package com.liyaqa.scheduling.domain.ports

import com.liyaqa.scheduling.domain.model.MemberCategoryBalance
import java.util.Optional
import java.util.UUID

interface MemberCategoryBalanceRepository {
    fun save(balance: MemberCategoryBalance): MemberCategoryBalance
    fun saveAll(balances: List<MemberCategoryBalance>): List<MemberCategoryBalance>
    fun findById(id: UUID): Optional<MemberCategoryBalance>
    fun findByBalanceId(balanceId: UUID): List<MemberCategoryBalance>
    fun findByBalanceIdAndCategoryId(balanceId: UUID, categoryId: UUID): Optional<MemberCategoryBalance>
    fun deleteById(id: UUID)
}
