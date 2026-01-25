package com.liyaqa.accounts.domain.ports

import com.liyaqa.accounts.domain.model.AccountStatus
import com.liyaqa.accounts.domain.model.CorporateAccount
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.*

interface CorporateAccountRepository {
    fun save(account: CorporateAccount): CorporateAccount
    fun findById(id: UUID): Optional<CorporateAccount>
    fun findAll(pageable: Pageable): Page<CorporateAccount>
    fun findByStatus(status: AccountStatus, pageable: Pageable): Page<CorporateAccount>
    fun findByMemberId(memberId: UUID): Optional<CorporateAccount>
    fun findByContractEndDateBefore(date: LocalDate, pageable: Pageable): Page<CorporateAccount>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun search(query: String, pageable: Pageable): Page<CorporateAccount>
}
