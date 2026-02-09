package com.liyaqa.platform.compliance.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.platform.compliance.dto.CreateContractRequest
import com.liyaqa.platform.compliance.dto.RenewContractRequest
import com.liyaqa.platform.compliance.dto.UpdateContractRequest
import com.liyaqa.platform.compliance.exception.ContractNotFoundException
import com.liyaqa.platform.compliance.exception.DuplicateContractNumberException
import com.liyaqa.platform.compliance.model.ContractStatus
import com.liyaqa.platform.compliance.model.ContractType
import com.liyaqa.platform.compliance.model.TenantContract
import com.liyaqa.platform.compliance.repository.TenantContractRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.eq
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ContractServiceTest {

    @Mock
    private lateinit var contractRepository: TenantContractRepository

    @Mock
    private lateinit var auditService: AuditService

    private val objectMapper = ObjectMapper().apply {
        findAndRegisterModules()
    }

    private lateinit var contractService: ContractService

    @BeforeEach
    fun setUp() {
        contractService = ContractService(contractRepository, auditService, objectMapper)
    }

    private fun createTestContract(
        status: ContractStatus = ContractStatus.DRAFT,
        startDate: LocalDate = LocalDate.of(2026, 1, 1),
        endDate: LocalDate = LocalDate.of(2027, 1, 1)
    ): TenantContract {
        val contract = TenantContract.create(
            tenantId = UUID.randomUUID(),
            contractNumber = "CT-${System.nanoTime()}",
            type = ContractType.SERVICE_AGREEMENT,
            startDate = startDate,
            endDate = endDate
        )
        when (status) {
            ContractStatus.SIGNED -> contract.sign(UUID.randomUUID())
            ContractStatus.ACTIVE -> {
                contract.sign(UUID.randomUUID())
                contract.activate()
            }
            ContractStatus.EXPIRED -> {
                contract.sign(UUID.randomUUID())
                contract.activate()
                contract.expire()
            }
            else -> {}
        }
        return contract
    }

    // ============================================
    // Create
    // ============================================

    @Test
    fun `createContract creates and returns response`() {
        val request = CreateContractRequest(
            tenantId = UUID.randomUUID(),
            contractNumber = "CT-001",
            type = ContractType.SERVICE_AGREEMENT,
            startDate = LocalDate.of(2026, 1, 1),
            endDate = LocalDate.of(2027, 1, 1)
        )

        whenever(contractRepository.existsByContractNumber("CT-001")) doReturn false
        whenever(contractRepository.save(any<TenantContract>())).thenAnswer { it.arguments[0] }

        val result = contractService.createContract(request)
        assertNotNull(result)
        assertEquals("CT-001", result.contractNumber)
        assertEquals(ContractStatus.DRAFT, result.status)
    }

    @Test
    fun `createContract throws DuplicateContractNumberException`() {
        val request = CreateContractRequest(
            tenantId = UUID.randomUUID(),
            contractNumber = "CT-DUP",
            type = ContractType.SERVICE_AGREEMENT,
            startDate = LocalDate.of(2026, 1, 1),
            endDate = LocalDate.of(2027, 1, 1)
        )

        whenever(contractRepository.existsByContractNumber("CT-DUP")) doReturn true

        assertThrows(DuplicateContractNumberException::class.java) {
            contractService.createContract(request)
        }
    }

    @Test
    fun `createContract calls audit with CREATE`() {
        val request = CreateContractRequest(
            tenantId = UUID.randomUUID(),
            contractNumber = "CT-AUDIT",
            type = ContractType.SLA,
            startDate = LocalDate.of(2026, 1, 1),
            endDate = LocalDate.of(2027, 1, 1)
        )

        whenever(contractRepository.existsByContractNumber("CT-AUDIT")) doReturn false
        whenever(contractRepository.save(any<TenantContract>())).thenAnswer { it.arguments[0] }

        contractService.createContract(request)

        verify(auditService).logAsync(
            action = eq(AuditAction.CREATE),
            entityType = eq("TenantContract"),
            entityId = any(),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    // ============================================
    // Get
    // ============================================

    @Test
    fun `getContract returns response`() {
        val contract = createTestContract()
        whenever(contractRepository.findById(contract.id)) doReturn Optional.of(contract)

        val result = contractService.getContract(contract.id)
        assertEquals(contract.id, result.id)
    }

    @Test
    fun `getContract throws ContractNotFoundException`() {
        val id = UUID.randomUUID()
        whenever(contractRepository.findById(id)) doReturn Optional.empty()

        assertThrows(ContractNotFoundException::class.java) {
            contractService.getContract(id)
        }
    }

    // ============================================
    // Update
    // ============================================

    @Test
    fun `updateContract partial update`() {
        val contract = createTestContract()
        whenever(contractRepository.findById(contract.id)) doReturn Optional.of(contract)
        whenever(contractRepository.save(any<TenantContract>())).thenAnswer { it.arguments[0] }

        val request = UpdateContractRequest(autoRenew = true)
        val result = contractService.updateContract(contract.id, request)

        assertEquals(true, result.autoRenew)
    }

    @Test
    fun `updateContract logs audit with oldValue and newValue`() {
        val contract = createTestContract()
        whenever(contractRepository.findById(contract.id)) doReturn Optional.of(contract)
        whenever(contractRepository.save(any<TenantContract>())).thenAnswer { it.arguments[0] }

        contractService.updateContract(contract.id, UpdateContractRequest(autoRenew = true))

        verify(auditService).logAsync(
            action = eq(AuditAction.UPDATE),
            entityType = eq("TenantContract"),
            entityId = eq(contract.id),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `updateContract throws ContractNotFoundException`() {
        val id = UUID.randomUUID()
        whenever(contractRepository.findById(id)) doReturn Optional.empty()

        assertThrows(ContractNotFoundException::class.java) {
            contractService.updateContract(id, UpdateContractRequest(autoRenew = true))
        }
    }

    // ============================================
    // Delete
    // ============================================

    @Test
    fun `deleteContract deletes and logs audit`() {
        val contract = createTestContract()
        whenever(contractRepository.findById(contract.id)) doReturn Optional.of(contract)

        contractService.deleteContract(contract.id)

        verify(contractRepository).deleteById(contract.id)
        verify(auditService).logAsync(
            action = eq(AuditAction.DELETE),
            entityType = eq("TenantContract"),
            entityId = eq(contract.id),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `deleteContract throws ContractNotFoundException`() {
        val id = UUID.randomUUID()
        whenever(contractRepository.findById(id)) doReturn Optional.empty()

        assertThrows(ContractNotFoundException::class.java) {
            contractService.deleteContract(id)
        }
    }

    // ============================================
    // Expiring
    // ============================================

    @Test
    fun `getExpiringContracts returns within date range`() {
        val pageable = PageRequest.of(0, 10)
        val contracts = listOf(createTestContract(ContractStatus.ACTIVE))
        val page = PageImpl(contracts, pageable, 1)

        whenever(contractRepository.findByEndDateBetweenAndStatus(
            any<LocalDate>(), any<LocalDate>(), eq(ContractStatus.ACTIVE), eq(pageable)
        )) doReturn page

        val result = contractService.getExpiringContracts(30, pageable)
        assertEquals(1, result.content.size)
    }

    // ============================================
    // Renew
    // ============================================

    @Test
    fun `renewContract calculates new end date and sets ACTIVE`() {
        val contract = createTestContract(
            status = ContractStatus.ACTIVE,
            startDate = LocalDate.of(2026, 1, 1),
            endDate = LocalDate.of(2027, 1, 1)
        )
        whenever(contractRepository.findById(contract.id)) doReturn Optional.of(contract)
        whenever(contractRepository.save(any<TenantContract>())).thenAnswer { it.arguments[0] }

        val result = contractService.renewContract(contract.id, RenewContractRequest(newEndDate = null))

        assertEquals(ContractStatus.ACTIVE, result.status)
        // Same duration (365 or 366 days) added to original end date
        assertEquals(LocalDate.of(2028, 1, 1), result.endDate)
    }

    @Test
    fun `renewContract throws ContractNotFoundException`() {
        val id = UUID.randomUUID()
        whenever(contractRepository.findById(id)) doReturn Optional.empty()

        assertThrows(ContractNotFoundException::class.java) {
            contractService.renewContract(id, RenewContractRequest())
        }
    }

    @Test
    fun `renewContract with explicit newEndDate uses provided date`() {
        val contract = createTestContract(ContractStatus.ACTIVE)
        val newEndDate = LocalDate.of(2029, 6, 15)
        whenever(contractRepository.findById(contract.id)) doReturn Optional.of(contract)
        whenever(contractRepository.save(any<TenantContract>())).thenAnswer { it.arguments[0] }

        val result = contractService.renewContract(contract.id, RenewContractRequest(newEndDate = newEndDate))
        assertEquals(newEndDate, result.endDate)
    }
}
