package com.liyaqa.accounts.infrastructure.persistence

import com.liyaqa.accounts.domain.model.AccountStatus
import com.liyaqa.accounts.domain.model.CorporateAccount
import com.liyaqa.accounts.domain.ports.CorporateAccountRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.*

interface SpringDataCorporateAccountRepository : JpaRepository<CorporateAccount, UUID> {
    fun findByStatus(status: AccountStatus, pageable: Pageable): Page<CorporateAccount>
    fun findByContractEndDateBefore(date: LocalDate, pageable: Pageable): Page<CorporateAccount>

    @Query("SELECT ca FROM CorporateAccount ca JOIN ca.members m WHERE m.memberId = :memberId AND m.status = 'ACTIVE'")
    fun findByMemberId(@Param("memberId") memberId: UUID): Optional<CorporateAccount>

    @Query("SELECT ca FROM CorporateAccount ca WHERE LOWER(ca.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(ca.companyNameAr) LIKE LOWER(CONCAT('%', :query, '%'))")
    fun search(@Param("query") query: String, pageable: Pageable): Page<CorporateAccount>
}

@Repository
class JpaCorporateAccountRepository(
    private val springDataRepository: SpringDataCorporateAccountRepository
) : CorporateAccountRepository {

    override fun save(account: CorporateAccount): CorporateAccount =
        springDataRepository.save(account)

    override fun findById(id: UUID): Optional<CorporateAccount> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<CorporateAccount> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: AccountStatus, pageable: Pageable): Page<CorporateAccount> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByMemberId(memberId: UUID): Optional<CorporateAccount> =
        springDataRepository.findByMemberId(memberId)

    override fun findByContractEndDateBefore(date: LocalDate, pageable: Pageable): Page<CorporateAccount> =
        springDataRepository.findByContractEndDateBefore(date, pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun search(query: String, pageable: Pageable): Page<CorporateAccount> =
        springDataRepository.search(query, pageable)
}
