package com.liyaqa.platform.compliance.model

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.util.UUID

class TenantContractTest {

    private fun createContract(
        status: ContractStatus = ContractStatus.DRAFT,
        startDate: LocalDate = LocalDate.now(),
        endDate: LocalDate = LocalDate.now().plusYears(1)
    ): TenantContract {
        val contract = TenantContract.create(
            tenantId = UUID.randomUUID(),
            contractNumber = "CT-${System.nanoTime()}",
            type = ContractType.SERVICE_AGREEMENT,
            startDate = startDate,
            endDate = endDate
        )
        // Progress to requested status
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
            ContractStatus.TERMINATED -> {
                contract.sign(UUID.randomUUID())
                contract.activate()
                contract.terminate()
            }
            else -> {} // DRAFT or SENT
        }
        return contract
    }

    @Test
    fun `create factory sets DRAFT status by default`() {
        val contract = TenantContract.create(
            tenantId = UUID.randomUUID(),
            contractNumber = "CT-001",
            type = ContractType.SERVICE_AGREEMENT,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusYears(1)
        )
        assertEquals(ContractStatus.DRAFT, contract.status)
    }

    @Test
    fun `create factory sets all fields correctly`() {
        val tenantId = UUID.randomUUID()
        val contract = TenantContract.create(
            tenantId = tenantId,
            contractNumber = "CT-002",
            type = ContractType.SLA,
            startDate = LocalDate.of(2026, 1, 1),
            endDate = LocalDate.of(2027, 1, 1),
            autoRenew = true,
            documentUrl = "https://docs.example.com/contract.pdf",
            terms = mutableMapOf("payment" to "monthly")
        )
        assertEquals(tenantId, contract.tenantId)
        assertEquals("CT-002", contract.contractNumber)
        assertEquals(ContractType.SLA, contract.type)
        assertEquals(LocalDate.of(2026, 1, 1), contract.startDate)
        assertEquals(LocalDate.of(2027, 1, 1), contract.endDate)
        assertTrue(contract.autoRenew)
        assertEquals("https://docs.example.com/contract.pdf", contract.documentUrl)
        assertEquals("monthly", contract.terms["payment"])
    }

    @Test
    fun `sign sets signedAt, signedBy, and SIGNED status`() {
        val contract = createContract()
        val signedBy = UUID.randomUUID()
        contract.sign(signedBy)

        assertEquals(ContractStatus.SIGNED, contract.status)
        assertNotNull(contract.signedAt)
        assertEquals(signedBy, contract.signedBy)
    }

    @Test
    fun `activate requires SIGNED status`() {
        val contract = createContract(ContractStatus.SIGNED)
        contract.activate()
        assertEquals(ContractStatus.ACTIVE, contract.status)
    }

    @Test
    fun `activate on DRAFT throws IllegalArgumentException`() {
        val contract = createContract(ContractStatus.DRAFT)
        assertThrows(IllegalArgumentException::class.java) {
            contract.activate()
        }
    }

    @Test
    fun `expire sets EXPIRED status`() {
        val contract = createContract(ContractStatus.ACTIVE)
        contract.expire()
        assertEquals(ContractStatus.EXPIRED, contract.status)
    }

    @Test
    fun `terminate sets TERMINATED status`() {
        val contract = createContract(ContractStatus.ACTIVE)
        contract.terminate()
        assertEquals(ContractStatus.TERMINATED, contract.status)
    }

    @Test
    fun `renew sets new end date and ACTIVE status`() {
        val contract = createContract(ContractStatus.ACTIVE)
        val newEndDate = LocalDate.now().plusYears(2)
        contract.renew(newEndDate)

        assertEquals(ContractStatus.ACTIVE, contract.status)
        assertEquals(newEndDate, contract.endDate)
    }

    @Test
    fun `renew on DRAFT throws IllegalArgumentException`() {
        val contract = createContract(ContractStatus.DRAFT)
        assertThrows(IllegalArgumentException::class.java) {
            contract.renew(LocalDate.now().plusYears(1))
        }
    }

    @Test
    fun `isExpiringSoon returns true within threshold`() {
        val contract = createContract(
            status = ContractStatus.ACTIVE,
            endDate = LocalDate.now().plusDays(15)
        )
        assertTrue(contract.isExpiringSoon(30))
    }

    @Test
    fun `isExpiringSoon returns false for non-ACTIVE contracts`() {
        val contract = createContract(
            status = ContractStatus.DRAFT,
            endDate = LocalDate.now().plusDays(15)
        )
        assertFalse(contract.isExpiringSoon(30))
    }

    @Test
    fun `daysUntilExpiry returns correct count`() {
        val endDate = LocalDate.now().plusDays(45)
        val contract = createContract(endDate = endDate)
        assertEquals(45L, contract.daysUntilExpiry())
    }
}
