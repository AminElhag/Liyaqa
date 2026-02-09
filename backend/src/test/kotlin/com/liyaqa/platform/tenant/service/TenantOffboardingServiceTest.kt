package com.liyaqa.platform.tenant.service

import com.liyaqa.platform.domain.ports.ClientSubscriptionRepository
import com.liyaqa.platform.tenant.dto.DeactivateTenantCommand
import com.liyaqa.platform.tenant.dto.RequestDataExportCommand
import com.liyaqa.platform.tenant.dto.SuspendTenantCommand
import com.liyaqa.platform.tenant.exception.ActiveSubscriptionExistsException
import com.liyaqa.platform.tenant.exception.DataExportInProgressException
import com.liyaqa.platform.tenant.exception.DataExportRequiredException
import com.liyaqa.platform.tenant.exception.TenantNotFoundException
import com.liyaqa.platform.tenant.model.DataExportFormat
import com.liyaqa.platform.tenant.model.DataExportJob
import com.liyaqa.platform.tenant.model.DataExportStatus
import com.liyaqa.platform.tenant.model.DeactivationReason
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.repository.DataExportJobRepository
import com.liyaqa.platform.tenant.repository.TenantDeactivationLogRepository
import com.liyaqa.platform.tenant.repository.TenantRepository
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.context.ApplicationEventPublisher
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TenantOffboardingServiceTest {

    @Mock lateinit var tenantRepository: TenantRepository
    @Mock lateinit var deactivationLogRepository: TenantDeactivationLogRepository
    @Mock lateinit var dataExportJobRepository: DataExportJobRepository
    @Mock lateinit var clientSubscriptionRepository: ClientSubscriptionRepository
    @Mock lateinit var securityService: SecurityService
    @Mock lateinit var eventPublisher: ApplicationEventPublisher

    private lateinit var service: TenantOffboardingService

    private val currentUserId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        service = TenantOffboardingService(
            tenantRepository = tenantRepository,
            deactivationLogRepository = deactivationLogRepository,
            dataExportJobRepository = dataExportJobRepository,
            clientSubscriptionRepository = clientSubscriptionRepository,
            securityService = securityService,
            eventPublisher = eventPublisher
        )
        whenever(securityService.getCurrentUserId()).thenReturn(currentUserId)
        whenever(tenantRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(deactivationLogRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(dataExportJobRepository.save(any())).thenAnswer { it.arguments[0] }
    }

    private fun createTenant(status: TenantStatus, organizationId: UUID? = null): Tenant {
        val tenant = Tenant.create(
            facilityName = "Test Gym",
            contactEmail = "test@gym.com"
        )
        // Transition to desired status
        when (status) {
            TenantStatus.ACTIVE -> tenant.changeStatus(TenantStatus.ACTIVE)
            TenantStatus.SUSPENDED -> {
                tenant.changeStatus(TenantStatus.ACTIVE)
                tenant.changeStatus(TenantStatus.SUSPENDED)
            }
            TenantStatus.DEACTIVATED -> {
                tenant.changeStatus(TenantStatus.ACTIVE)
                tenant.changeStatus(TenantStatus.DEACTIVATED)
            }
            TenantStatus.ARCHIVED -> {
                tenant.changeStatus(TenantStatus.ACTIVE)
                tenant.changeStatus(TenantStatus.DEACTIVATED)
                tenant.changeStatus(TenantStatus.ARCHIVED)
            }
            TenantStatus.PROVISIONING -> { /* already PROVISIONING */ }
        }
        organizationId?.let { tenant.organizationId = it }
        whenever(tenantRepository.findById(tenant.id)).thenReturn(Optional.of(tenant))
        whenever(tenantRepository.existsById(tenant.id)).thenReturn(true)
        return tenant
    }

    // ============================================
    // deactivateTenant
    // ============================================

    @Nested
    inner class DeactivateTenant {

        @Test
        fun `deactivates ACTIVE tenant successfully`() {
            val tenant = createTenant(TenantStatus.ACTIVE)
            val command = DeactivateTenantCommand(
                reason = DeactivationReason.CLIENT_REQUEST,
                notes = "Client requested cancellation"
            )

            val result = service.deactivateTenant(tenant.id, command)

            assertEquals(TenantStatus.DEACTIVATED, result.status)
            assertNotNull(result.deactivatedAt)
        }

        @Test
        fun `deactivates SUSPENDED tenant successfully`() {
            val tenant = createTenant(TenantStatus.SUSPENDED)
            val command = DeactivateTenantCommand(
                reason = DeactivationReason.NON_PAYMENT
            )

            val result = service.deactivateTenant(tenant.id, command)

            assertEquals(TenantStatus.DEACTIVATED, result.status)
        }

        @Test
        fun `rejects deactivation when active subscription exists`() {
            val orgId = UUID.randomUUID()
            val tenant = createTenant(TenantStatus.ACTIVE, organizationId = orgId)
            whenever(clientSubscriptionRepository.existsActiveByOrganizationId(orgId)).thenReturn(true)

            val command = DeactivateTenantCommand(reason = DeactivationReason.CONTRACT_ENDED)

            assertThrows<ActiveSubscriptionExistsException> {
                service.deactivateTenant(tenant.id, command)
            }
        }

        @Test
        fun `rejects deactivation of already DEACTIVATED tenant`() {
            val tenant = createTenant(TenantStatus.DEACTIVATED)
            val command = DeactivateTenantCommand(reason = DeactivationReason.FRAUD)

            assertThrows<IllegalArgumentException> {
                service.deactivateTenant(tenant.id, command)
            }
        }

        @Test
        fun `rejects deactivation of ARCHIVED tenant`() {
            val tenant = createTenant(TenantStatus.ARCHIVED)
            val command = DeactivateTenantCommand(reason = DeactivationReason.OTHER)

            assertThrows<IllegalArgumentException> {
                service.deactivateTenant(tenant.id, command)
            }
        }
    }

    // ============================================
    // suspendTenant
    // ============================================

    @Nested
    inner class SuspendTenant {

        @Test
        fun `suspends ACTIVE tenant successfully`() {
            val tenant = createTenant(TenantStatus.ACTIVE)
            val command = SuspendTenantCommand(reason = "Payment overdue")

            val result = service.suspendTenant(tenant.id, command)

            assertEquals(TenantStatus.SUSPENDED, result.status)
        }

        @Test
        fun `rejects suspension of PROVISIONING tenant`() {
            val tenant = createTenant(TenantStatus.PROVISIONING)
            val command = SuspendTenantCommand(reason = "Test")

            assertThrows<IllegalArgumentException> {
                service.suspendTenant(tenant.id, command)
            }
        }

        @Test
        fun `rejects suspension of DEACTIVATED tenant`() {
            val tenant = createTenant(TenantStatus.DEACTIVATED)
            val command = SuspendTenantCommand(reason = "Test")

            assertThrows<IllegalArgumentException> {
                service.suspendTenant(tenant.id, command)
            }
        }
    }

    // ============================================
    // requestDataExport
    // ============================================

    @Nested
    inner class RequestDataExport {

        @Test
        fun `creates export job successfully`() {
            val tenant = createTenant(TenantStatus.DEACTIVATED)
            whenever(dataExportJobRepository.existsByTenantIdAndStatusIn(
                any(), any()
            )).thenReturn(false)

            val command = RequestDataExportCommand(format = DataExportFormat.JSON)

            val result = service.requestDataExport(tenant.id, command)

            assertEquals(tenant.id, result.tenantId)
            assertEquals(DataExportFormat.JSON, result.format)
            assertEquals(DataExportStatus.PENDING, result.status)
            assertEquals(currentUserId, result.requestedBy)
        }

        @Test
        fun `rejects when export already in progress`() {
            val tenant = createTenant(TenantStatus.DEACTIVATED)
            whenever(dataExportJobRepository.existsByTenantIdAndStatusIn(
                any(), any()
            )).thenReturn(true)

            val command = RequestDataExportCommand(format = DataExportFormat.CSV)

            assertThrows<DataExportInProgressException> {
                service.requestDataExport(tenant.id, command)
            }
        }

        @Test
        fun `allows new export after previous completed`() {
            val tenant = createTenant(TenantStatus.DEACTIVATED)
            whenever(dataExportJobRepository.existsByTenantIdAndStatusIn(
                any(), any()
            )).thenReturn(false)

            val command = RequestDataExportCommand(format = DataExportFormat.CSV)

            val result = service.requestDataExport(tenant.id, command)

            assertEquals(DataExportFormat.CSV, result.format)
            assertEquals(DataExportStatus.PENDING, result.status)
        }
    }

    // ============================================
    // archiveTenant
    // ============================================

    @Nested
    inner class ArchiveTenant {

        @Test
        fun `archives DEACTIVATED tenant with completed export`() {
            val tenant = createTenant(TenantStatus.DEACTIVATED)
            val completedExport = DataExportJob.create(tenant.id, DataExportFormat.JSON, currentUserId)
            completedExport.start()
            completedExport.complete("https://storage.example.com/export.json", 1024L)

            whenever(dataExportJobRepository.findByTenantIdAndStatus(tenant.id, DataExportStatus.COMPLETED))
                .thenReturn(listOf(completedExport))

            val result = service.archiveTenant(tenant.id)

            assertEquals(TenantStatus.ARCHIVED, result.status)
            assertNotNull(result.dataRetentionUntil)
        }

        @Test
        fun `rejects archiving ACTIVE tenant`() {
            val tenant = createTenant(TenantStatus.ACTIVE)

            assertThrows<IllegalArgumentException> {
                service.archiveTenant(tenant.id)
            }
        }

        @Test
        fun `rejects archiving without completed export`() {
            val tenant = createTenant(TenantStatus.DEACTIVATED)
            whenever(dataExportJobRepository.findByTenantIdAndStatus(tenant.id, DataExportStatus.COMPLETED))
                .thenReturn(emptyList())

            assertThrows<DataExportRequiredException> {
                service.archiveTenant(tenant.id)
            }
        }

        @Test
        fun `rejects archiving PROVISIONING tenant`() {
            val tenant = createTenant(TenantStatus.PROVISIONING)

            assertThrows<IllegalArgumentException> {
                service.archiveTenant(tenant.id)
            }
        }
    }

    // ============================================
    // Full lifecycle
    // ============================================

    @Nested
    inner class FullLifecycle {

        @Test
        fun `complete offboarding flow - ACTIVE to deactivate to export to archive`() {
            // Start with ACTIVE tenant
            val tenant = createTenant(TenantStatus.ACTIVE)

            // Step 1: Deactivate
            val deactivateCmd = DeactivateTenantCommand(
                reason = DeactivationReason.CONTRACT_ENDED,
                notes = "Contract expired"
            )
            val deactivated = service.deactivateTenant(tenant.id, deactivateCmd)
            assertEquals(TenantStatus.DEACTIVATED, deactivated.status)

            // Step 2: Request data export
            whenever(dataExportJobRepository.existsByTenantIdAndStatusIn(any(), any()))
                .thenReturn(false)
            val exportCmd = RequestDataExportCommand(format = DataExportFormat.JSON)
            val exportJob = service.requestDataExport(tenant.id, exportCmd)
            assertEquals(DataExportStatus.PENDING, exportJob.status)

            // Step 3: Simulate export completion
            val completedExport = DataExportJob.create(tenant.id, DataExportFormat.JSON, currentUserId)
            completedExport.start()
            completedExport.complete("https://storage.example.com/export.json", 2048L)
            whenever(dataExportJobRepository.findByTenantIdAndStatus(tenant.id, DataExportStatus.COMPLETED))
                .thenReturn(listOf(completedExport))

            // Step 4: Archive
            val archived = service.archiveTenant(tenant.id)
            assertEquals(TenantStatus.ARCHIVED, archived.status)
            assertNotNull(archived.dataRetentionUntil)
        }
    }

    // ============================================
    // getDeactivationHistory / getDataExports
    // ============================================

    @Nested
    inner class Queries {

        @Test
        fun `getDeactivationHistory throws for non-existent tenant`() {
            val unknownId = UUID.randomUUID()
            whenever(tenantRepository.existsById(unknownId)).thenReturn(false)

            assertThrows<TenantNotFoundException> {
                service.getDeactivationHistory(unknownId)
            }
        }

        @Test
        fun `getDataExports throws for non-existent tenant`() {
            val unknownId = UUID.randomUUID()
            whenever(tenantRepository.existsById(unknownId)).thenReturn(false)

            assertThrows<TenantNotFoundException> {
                service.getDataExports(unknownId)
            }
        }
    }
}
