package com.liyaqa.platform.compliance.repository

import com.liyaqa.platform.compliance.model.ContractStatus
import com.liyaqa.platform.compliance.model.TenantContract
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface TenantContractRepository {
    fun save(contract: TenantContract): TenantContract
    fun findById(id: UUID): Optional<TenantContract>
    fun findAll(pageable: Pageable): Page<TenantContract>
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<TenantContract>
    fun findByStatus(status: ContractStatus, pageable: Pageable): Page<TenantContract>
    fun findByEndDateBetweenAndStatus(start: LocalDate, end: LocalDate, status: ContractStatus, pageable: Pageable): Page<TenantContract>
    fun deleteById(id: UUID)
    fun existsByContractNumber(contractNumber: String): Boolean
}
