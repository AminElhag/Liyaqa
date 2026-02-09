package com.liyaqa.platform.tenant.model

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.util.UUID

class TenantTest {

    @Test
    fun `create factory sets defaults correctly`() {
        val tenant = Tenant.create(
            facilityName = "Test Gym",
            contactEmail = "test@gym.com"
        )

        assertEquals("Test Gym", tenant.facilityName)
        assertEquals("test@gym.com", tenant.contactEmail)
        assertEquals(TenantStatus.PROVISIONING, tenant.status)
        assertEquals("SA", tenant.country)
        assertNull(tenant.dealId)
        assertNull(tenant.onboardedBy)
    }

    @Test
    fun `create factory with optional fields`() {
        val userId = UUID.randomUUID()
        val dealId = UUID.randomUUID()

        val tenant = Tenant.create(
            facilityName = "Fitness Club",
            contactEmail = "info@fitness.com",
            onboardedBy = userId,
            dealId = dealId
        )

        assertEquals(userId, tenant.onboardedBy)
        assertEquals(dealId, tenant.dealId)
    }

    // ============================================
    // Valid Status Transitions
    // ============================================

    @Test
    fun `PROVISIONING to ACTIVE sets onboardedAt`() {
        val tenant = createTestTenant()
        assertNull(tenant.onboardedAt)

        tenant.changeStatus(TenantStatus.ACTIVE)

        assertEquals(TenantStatus.ACTIVE, tenant.status)
        assertNotNull(tenant.onboardedAt)
    }

    @Test
    fun `PROVISIONING to DEACTIVATED sets deactivatedAt`() {
        val tenant = createTestTenant()
        assertNull(tenant.deactivatedAt)

        tenant.changeStatus(TenantStatus.DEACTIVATED)

        assertEquals(TenantStatus.DEACTIVATED, tenant.status)
        assertNotNull(tenant.deactivatedAt)
    }

    @Test
    fun `ACTIVE to SUSPENDED`() {
        val tenant = createTestTenant()
        tenant.changeStatus(TenantStatus.ACTIVE)

        tenant.changeStatus(TenantStatus.SUSPENDED)

        assertEquals(TenantStatus.SUSPENDED, tenant.status)
    }

    @Test
    fun `ACTIVE to DEACTIVATED`() {
        val tenant = createTestTenant()
        tenant.changeStatus(TenantStatus.ACTIVE)

        tenant.changeStatus(TenantStatus.DEACTIVATED)

        assertEquals(TenantStatus.DEACTIVATED, tenant.status)
        assertNotNull(tenant.deactivatedAt)
    }

    @Test
    fun `SUSPENDED to ACTIVE`() {
        val tenant = createTestTenant()
        tenant.changeStatus(TenantStatus.ACTIVE)
        tenant.changeStatus(TenantStatus.SUSPENDED)

        tenant.changeStatus(TenantStatus.ACTIVE)

        assertEquals(TenantStatus.ACTIVE, tenant.status)
    }

    @Test
    fun `SUSPENDED to DEACTIVATED`() {
        val tenant = createTestTenant()
        tenant.changeStatus(TenantStatus.ACTIVE)
        tenant.changeStatus(TenantStatus.SUSPENDED)

        tenant.changeStatus(TenantStatus.DEACTIVATED)

        assertEquals(TenantStatus.DEACTIVATED, tenant.status)
    }

    @Test
    fun `DEACTIVATED to ARCHIVED`() {
        val tenant = createTestTenant()
        tenant.changeStatus(TenantStatus.DEACTIVATED)

        tenant.changeStatus(TenantStatus.ARCHIVED)

        assertEquals(TenantStatus.ARCHIVED, tenant.status)
    }

    // ============================================
    // Invalid Status Transitions
    // ============================================

    @Test
    fun `PROVISIONING to SUSPENDED is invalid`() {
        val tenant = createTestTenant()
        assertThrows(IllegalArgumentException::class.java) {
            tenant.changeStatus(TenantStatus.SUSPENDED)
        }
    }

    @Test
    fun `PROVISIONING to ARCHIVED is invalid`() {
        val tenant = createTestTenant()
        assertThrows(IllegalArgumentException::class.java) {
            tenant.changeStatus(TenantStatus.ARCHIVED)
        }
    }

    @Test
    fun `ACTIVE to PROVISIONING is invalid`() {
        val tenant = createTestTenant()
        tenant.changeStatus(TenantStatus.ACTIVE)
        assertThrows(IllegalArgumentException::class.java) {
            tenant.changeStatus(TenantStatus.PROVISIONING)
        }
    }

    @Test
    fun `ARCHIVED to ACTIVE is invalid`() {
        val tenant = createTestTenant()
        tenant.changeStatus(TenantStatus.DEACTIVATED)
        tenant.changeStatus(TenantStatus.ARCHIVED)
        assertThrows(IllegalArgumentException::class.java) {
            tenant.changeStatus(TenantStatus.ACTIVE)
        }
    }

    @Test
    fun `ARCHIVED has no valid transitions`() {
        val tenant = createTestTenant()
        tenant.changeStatus(TenantStatus.DEACTIVATED)
        tenant.changeStatus(TenantStatus.ARCHIVED)

        for (status in TenantStatus.entries) {
            if (status == TenantStatus.ARCHIVED) continue
            assertThrows(IllegalArgumentException::class.java) {
                tenant.changeStatus(status)
            }
        }
    }

    // ============================================
    // Helpers
    // ============================================

    private fun createTestTenant(): Tenant {
        return Tenant.create(
            facilityName = "Test Gym",
            contactEmail = "test@example.com"
        )
    }
}
