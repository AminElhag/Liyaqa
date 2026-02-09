package com.liyaqa.platform.compliance.repository

import com.liyaqa.platform.compliance.model.ContractStatus
import com.liyaqa.platform.compliance.model.TenantContract
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataTenantContractRepository : JpaRepository<TenantContract, UUID> {
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<TenantContract>
    fun findByStatus(status: ContractStatus, pageable: Pageable): Page<TenantContract>
    fun findByEndDateBetweenAndStatus(start: LocalDate, end: LocalDate, status: ContractStatus, pageable: Pageable): Page<TenantContract>
    fun existsByContractNumber(contractNumber: String): Boolean
}

@Repository
class JpaTenantContractRepository(
    private val springDataRepository: SpringDataTenantContractRepository
) : TenantContractRepository {

    override fun save(contract: TenantContract): TenantContract =
        springDataRepository.save(contract)

    override fun findById(id: UUID): Optional<TenantContract> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<TenantContract> =
        springDataRepository.findAll(pageable)

    override fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<TenantContract> =
        springDataRepository.findByTenantId(tenantId, pageable)

    override fun findByStatus(status: ContractStatus, pageable: Pageable): Page<TenantContract> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByEndDateBetweenAndStatus(start: LocalDate, end: LocalDate, status: ContractStatus, pageable: Pageable): Page<TenantContract> =
        springDataRepository.findByEndDateBetweenAndStatus(start, end, status, pageable)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun existsByContractNumber(contractNumber: String): Boolean =
        springDataRepository.existsByContractNumber(contractNumber)
}
