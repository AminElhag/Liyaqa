package com.liyaqa.platform.compliance.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.platform.compliance.dto.ContractResponse
import com.liyaqa.platform.compliance.dto.CreateContractRequest
import com.liyaqa.platform.compliance.dto.RenewContractRequest
import com.liyaqa.platform.compliance.dto.UpdateContractRequest
import com.liyaqa.platform.compliance.exception.ContractNotFoundException
import com.liyaqa.platform.compliance.exception.DuplicateContractNumberException
import com.liyaqa.platform.compliance.model.ContractStatus
import com.liyaqa.platform.compliance.model.TenantContract
import com.liyaqa.platform.compliance.repository.TenantContractRepository
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.repository.TenantRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service("platformContractService")
class ContractService(
    private val contractRepository: TenantContractRepository,
    private val tenantRepository: TenantRepository,
    private val auditService: AuditService,
    private val objectMapper: ObjectMapper
) {

    private fun resolveTenantNames(tenantIds: Collection<UUID>): Map<UUID, Tenant> {
        if (tenantIds.isEmpty()) return emptyMap()
        return tenantRepository.findAllById(tenantIds.toSet()).associateBy { it.id }
    }

    private fun toResponse(contract: TenantContract, tenantMap: Map<UUID, Tenant>): ContractResponse {
        val tenant = tenantMap[contract.tenantId]
        return ContractResponse.from(contract, tenant?.facilityName, tenant?.facilityNameAr)
    }

    @Transactional
    fun createContract(request: CreateContractRequest): ContractResponse {
        if (contractRepository.existsByContractNumber(request.contractNumber)) {
            throw DuplicateContractNumberException(request.contractNumber)
        }

        val contract = TenantContract.create(
            tenantId = request.tenantId,
            contractNumber = request.contractNumber,
            type = request.type,
            startDate = request.startDate,
            endDate = request.endDate,
            autoRenew = request.autoRenew,
            documentUrl = request.documentUrl,
            value = request.value,
            currency = request.currency,
            terms = request.terms.toMutableMap()
        )

        val saved = contractRepository.save(contract)

        auditService.logAsync(
            action = AuditAction.CREATE,
            entityType = "TenantContract",
            entityId = saved.id,
            description = "Contract created: ${saved.contractNumber}"
        )

        val tenantMap = resolveTenantNames(listOf(saved.tenantId))
        return toResponse(saved, tenantMap)
    }

    @Transactional(readOnly = true)
    fun getContract(id: UUID): ContractResponse {
        val contract = contractRepository.findById(id)
            .orElseThrow { ContractNotFoundException(id) }
        val tenantMap = resolveTenantNames(listOf(contract.tenantId))
        return toResponse(contract, tenantMap)
    }

    @Transactional(readOnly = true)
    fun listContracts(pageable: Pageable): Page<ContractResponse> {
        val page = contractRepository.findAll(pageable)
        val tenantMap = resolveTenantNames(page.content.map { it.tenantId })
        return page.map { toResponse(it, tenantMap) }
    }

    @Transactional
    fun updateContract(id: UUID, request: UpdateContractRequest): ContractResponse {
        val contract = contractRepository.findById(id)
            .orElseThrow { ContractNotFoundException(id) }

        val oldValue = objectMapper.writeValueAsString(ContractResponse.from(contract))

        request.type?.let { contract.type = it }
        request.status?.let { contract.status = it }
        request.startDate?.let { contract.startDate = it }
        request.endDate?.let { contract.endDate = it }
        request.autoRenew?.let { contract.autoRenew = it }
        request.documentUrl?.let { contract.documentUrl = it }
        request.value?.let { contract.value = it }
        request.currency?.let { contract.currency = it }
        request.terms?.let { contract.terms = it.toMutableMap() }

        val saved = contractRepository.save(contract)
        val tenantMap = resolveTenantNames(listOf(saved.tenantId))
        val newValue = objectMapper.writeValueAsString(toResponse(saved, tenantMap))

        auditService.logAsync(
            action = AuditAction.UPDATE,
            entityType = "TenantContract",
            entityId = saved.id,
            description = "Contract updated: ${saved.contractNumber}",
            oldValue = oldValue,
            newValue = newValue
        )

        return toResponse(saved, tenantMap)
    }

    @Transactional
    fun deleteContract(id: UUID) {
        val contract = contractRepository.findById(id)
            .orElseThrow { ContractNotFoundException(id) }

        contractRepository.deleteById(id)

        auditService.logAsync(
            action = AuditAction.DELETE,
            entityType = "TenantContract",
            entityId = contract.id,
            description = "Contract deleted: ${contract.contractNumber}"
        )
    }

    @Transactional(readOnly = true)
    fun getExpiringContracts(days: Int, pageable: Pageable): Page<ContractResponse> {
        val start = LocalDate.now()
        val end = start.plusDays(days.toLong())
        val page = contractRepository.findByEndDateBetweenAndStatus(start, end, ContractStatus.ACTIVE, pageable)
        val tenantMap = resolveTenantNames(page.content.map { it.tenantId })
        return page.map { toResponse(it, tenantMap) }
    }

    @Transactional
    fun renewContract(id: UUID, request: RenewContractRequest): ContractResponse {
        val contract = contractRepository.findById(id)
            .orElseThrow { ContractNotFoundException(id) }

        val newEndDate = request.newEndDate ?: run {
            val duration = ChronoUnit.DAYS.between(contract.startDate, contract.endDate)
            contract.endDate.plusDays(duration)
        }

        contract.renew(newEndDate)
        val saved = contractRepository.save(contract)

        auditService.logAsync(
            action = AuditAction.STATUS_CHANGE,
            entityType = "TenantContract",
            entityId = saved.id,
            description = "Contract renewed: ${saved.contractNumber}, new end date: $newEndDate"
        )

        val tenantMap = resolveTenantNames(listOf(saved.tenantId))
        return toResponse(saved, tenantMap)
    }
}
