package com.liyaqa.platform.tenant.service

import com.liyaqa.platform.application.services.ClientOnboardingService
import com.liyaqa.platform.application.services.OnboardClientCommand
import com.liyaqa.platform.application.services.OnboardingResult
import com.liyaqa.platform.domain.model.Deal
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStage
import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.ports.DealRepository
import com.liyaqa.platform.tenant.dto.ChangeStatusCommand
import com.liyaqa.platform.tenant.dto.ProvisionFromDealCommand
import com.liyaqa.platform.tenant.dto.ProvisionTenantCommand
import com.liyaqa.platform.tenant.exception.DealNotWonException
import com.liyaqa.platform.tenant.exception.TenantAlreadyExistsException
import com.liyaqa.platform.tenant.exception.TenantNotFoundException
import com.liyaqa.platform.tenant.model.OnboardingChecklist
import com.liyaqa.platform.tenant.model.ProvisioningStep
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.model.TenantProvisionedEvent
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.model.TenantStatusChangedEvent
import com.liyaqa.platform.tenant.repository.OnboardingChecklistRepository
import com.liyaqa.platform.tenant.repository.TenantRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.eq
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.context.ApplicationEventPublisher
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TenantProvisioningServiceTest {

    @Mock
    private lateinit var tenantRepository: TenantRepository

    @Mock
    private lateinit var checklistRepository: OnboardingChecklistRepository

    @Mock
    private lateinit var clientOnboardingService: ClientOnboardingService

    @Mock
    private lateinit var dealRepository: DealRepository

    @Mock
    private lateinit var securityService: SecurityService

    @Mock
    private lateinit var eventPublisher: ApplicationEventPublisher

    private lateinit var service: TenantProvisioningService
    private val testUserId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        service = TenantProvisioningService(
            tenantRepository, checklistRepository, clientOnboardingService,
            dealRepository, securityService, eventPublisher
        )
        whenever(securityService.getCurrentUserId()) doReturn testUserId
    }

    // ============================================
    // provisionTenant
    // ============================================

    @Test
    fun `provisionTenant creates tenant with checklist and auto-completes TENANT_CREATED`() {
        val command = ProvisionTenantCommand(
            facilityName = "New Gym",
            contactEmail = "gym@example.com"
        )

        whenever(tenantRepository.save(any<Tenant>())).thenAnswer { it.arguments[0] as Tenant }
        whenever(checklistRepository.saveAll(any<List<OnboardingChecklist>>())).thenAnswer { invocation ->
            @Suppress("UNCHECKED_CAST")
            invocation.arguments[0] as List<OnboardingChecklist>
        }

        // Mock findByTenantIdAndStep for TENANT_CREATED auto-complete
        val checklistItem = OnboardingChecklist(
            tenantId = UUID.randomUUID(),
            step = ProvisioningStep.TENANT_CREATED
        )
        whenever(checklistRepository.findByTenantIdAndStep(any(), eq(ProvisioningStep.TENANT_CREATED))) doReturn
            Optional.of(checklistItem)
        whenever(checklistRepository.save(any<OnboardingChecklist>())).thenAnswer { it.arguments[0] as OnboardingChecklist }

        val result = service.provisionTenant(command)

        assertEquals("New Gym", result.facilityName)
        assertEquals("gym@example.com", result.contactEmail)
        assertEquals(TenantStatus.PROVISIONING, result.status)
        assertEquals(testUserId, result.onboardedBy)

        // Verify checklist items created
        verify(checklistRepository).saveAll(any<List<OnboardingChecklist>>())
        // Verify event published
        verify(eventPublisher).publishEvent(any<TenantProvisionedEvent>())
    }

    @Test
    fun `provisionTenant fails on duplicate subdomain`() {
        val command = ProvisionTenantCommand(
            facilityName = "New Gym",
            contactEmail = "gym@example.com",
            subdomain = "existing-gym"
        )
        whenever(tenantRepository.existsBySubdomain("existing-gym")) doReturn true

        assertThrows(TenantAlreadyExistsException::class.java) {
            service.provisionTenant(command)
        }
    }

    // ============================================
    // provisionFromDeal
    // ============================================

    @Test
    fun `provisionFromDeal creates tenant from WON deal and calls onboarding`() {
        val dealId = UUID.randomUUID()
        val deal = createWonDeal()
        val command = ProvisionFromDealCommand(
            adminEmail = "admin@gym.com",
            adminPassword = "securePass123",
            adminDisplayNameEn = "Admin User"
        )

        whenever(tenantRepository.findByDealId(dealId)) doReturn Optional.empty()
        whenever(dealRepository.findById(dealId)) doReturn Optional.of(deal)
        whenever(tenantRepository.save(any<Tenant>())).thenAnswer { it.arguments[0] as Tenant }
        whenever(checklistRepository.saveAll(any<List<OnboardingChecklist>>())).thenAnswer { invocation ->
            @Suppress("UNCHECKED_CAST")
            invocation.arguments[0] as List<OnboardingChecklist>
        }
        whenever(tenantRepository.existsById(any())) doReturn true

        // Mock checklist lookups for auto-completion
        for (step in listOf(ProvisioningStep.DEAL_WON, ProvisioningStep.TENANT_CREATED, ProvisioningStep.ADMIN_ACCOUNT_CREATED)) {
            val item = OnboardingChecklist(tenantId = UUID.randomUUID(), step = step)
            whenever(checklistRepository.findByTenantIdAndStep(any(), eq(step))) doReturn Optional.of(item)
        }
        whenever(checklistRepository.save(any<OnboardingChecklist>())).thenAnswer { it.arguments[0] as OnboardingChecklist }

        // Mock ClientOnboardingService
        val orgId = UUID.randomUUID()
        val clubId = UUID.randomUUID()
        val mockResult = createMockOnboardingResult(orgId, clubId)
        whenever(clientOnboardingService.onboardClient(any<OnboardClientCommand>())) doReturn mockResult

        val result = service.provisionFromDeal(dealId, command)

        assertEquals("Test Gym", result.facilityName)
        assertEquals("john@example.com", result.contactEmail)
        assertEquals(dealId, result.dealId)
        assertEquals(orgId, result.organizationId)
        assertEquals(clubId, result.clubId)

        // Verify onboarding was called
        verify(clientOnboardingService).onboardClient(any<OnboardClientCommand>())
        verify(eventPublisher).publishEvent(any<TenantProvisionedEvent>())
    }

    @Test
    fun `provisionFromDeal rejects non-WON deal`() {
        val dealId = UUID.randomUUID()
        val deal = createLeadDeal()
        val command = ProvisionFromDealCommand(
            adminEmail = "admin@gym.com",
            adminPassword = "securePass123",
            adminDisplayNameEn = "Admin User"
        )

        whenever(tenantRepository.findByDealId(dealId)) doReturn Optional.empty()
        whenever(dealRepository.findById(dealId)) doReturn Optional.of(deal)

        assertThrows(DealNotWonException::class.java) {
            service.provisionFromDeal(dealId, command)
        }
    }

    @Test
    fun `provisionFromDeal is idempotent - returns existing tenant`() {
        val dealId = UUID.randomUUID()
        val existingTenant = Tenant.create(
            facilityName = "Existing Gym",
            contactEmail = "existing@gym.com",
            dealId = dealId
        )
        val command = ProvisionFromDealCommand(
            adminEmail = "admin@gym.com",
            adminPassword = "securePass123",
            adminDisplayNameEn = "Admin User"
        )

        whenever(tenantRepository.findByDealId(dealId)) doReturn Optional.of(existingTenant)

        val result = service.provisionFromDeal(dealId, command)

        assertEquals("Existing Gym", result.facilityName)
        assertEquals(dealId, result.dealId)
    }

    // ============================================
    // changeTenantStatus
    // ============================================

    @Test
    fun `changeTenantStatus validates transition and publishes event`() {
        val tenant = Tenant.create(
            facilityName = "Test Gym",
            contactEmail = "test@example.com"
        )
        val command = ChangeStatusCommand(newStatus = TenantStatus.ACTIVE)

        whenever(tenantRepository.findById(tenant.id)) doReturn Optional.of(tenant)
        whenever(tenantRepository.save(any<Tenant>())).thenAnswer { it.arguments[0] as Tenant }

        val result = service.changeTenantStatus(tenant.id, command)

        assertEquals(TenantStatus.ACTIVE, result.status)
        assertNotNull(result.onboardedAt)
        verify(eventPublisher).publishEvent(any<TenantStatusChangedEvent>())
    }

    @Test
    fun `changeTenantStatus rejects invalid transition`() {
        val tenant = Tenant.create(
            facilityName = "Test Gym",
            contactEmail = "test@example.com"
        )
        // PROVISIONING -> ARCHIVED is invalid
        val command = ChangeStatusCommand(newStatus = TenantStatus.ARCHIVED)

        whenever(tenantRepository.findById(tenant.id)) doReturn Optional.of(tenant)

        assertThrows(IllegalArgumentException::class.java) {
            service.changeTenantStatus(tenant.id, command)
        }
    }

    // ============================================
    // completeOnboardingStep
    // ============================================

    @Test
    fun `completeOnboardingStep marks step complete with idempotency`() {
        val tenantId = UUID.randomUUID()
        val item = OnboardingChecklist(tenantId = tenantId, step = ProvisioningStep.INITIAL_CONFIG_DONE)

        whenever(tenantRepository.existsById(tenantId)) doReturn true
        whenever(checklistRepository.findByTenantIdAndStep(tenantId, ProvisioningStep.INITIAL_CONFIG_DONE)) doReturn
            Optional.of(item)
        whenever(checklistRepository.save(any<OnboardingChecklist>())).thenAnswer { it.arguments[0] as OnboardingChecklist }
        whenever(checklistRepository.countByTenantIdAndCompleted(tenantId, true)) doReturn 1L

        val result = service.completeOnboardingStep(tenantId, ProvisioningStep.INITIAL_CONFIG_DONE, "Config done")

        assertTrue(result.completed)
        assertNotNull(result.completedAt)
        assertEquals("Config done", result.notes)
    }

    @Test
    fun `completeOnboardingStep throws for non-existent tenant`() {
        val tenantId = UUID.randomUUID()
        whenever(tenantRepository.existsById(tenantId)) doReturn false

        assertThrows(TenantNotFoundException::class.java) {
            service.completeOnboardingStep(tenantId, ProvisioningStep.GO_LIVE)
        }
    }

    // ============================================
    // Full Flow
    // ============================================

    @Test
    fun `full flow - deal WON to provision to complete all steps to activate`() {
        val dealId = UUID.randomUUID()
        val deal = createWonDeal()
        val provisionCommand = ProvisionFromDealCommand(
            adminEmail = "admin@gym.com",
            adminPassword = "securePass123",
            adminDisplayNameEn = "Admin User"
        )

        whenever(tenantRepository.findByDealId(dealId)) doReturn Optional.empty()
        whenever(dealRepository.findById(dealId)) doReturn Optional.of(deal)
        whenever(tenantRepository.save(any<Tenant>())).thenAnswer { it.arguments[0] as Tenant }
        whenever(checklistRepository.saveAll(any<List<OnboardingChecklist>>())).thenAnswer { invocation ->
            @Suppress("UNCHECKED_CAST")
            invocation.arguments[0] as List<OnboardingChecklist>
        }
        whenever(tenantRepository.existsById(any())) doReturn true

        // Mock checklist lookups
        for (step in ProvisioningStep.entries) {
            val item = OnboardingChecklist(tenantId = UUID.randomUUID(), step = step)
            whenever(checklistRepository.findByTenantIdAndStep(any(), eq(step))) doReturn Optional.of(item)
        }
        whenever(checklistRepository.save(any<OnboardingChecklist>())).thenAnswer { it.arguments[0] as OnboardingChecklist }

        val orgId = UUID.randomUUID()
        val clubId = UUID.randomUUID()
        val mockResult = createMockOnboardingResult(orgId, clubId)
        whenever(clientOnboardingService.onboardClient(any<OnboardClientCommand>())) doReturn mockResult

        // Step 1: Provision from deal
        val tenant = service.provisionFromDeal(dealId, provisionCommand)
        assertEquals(TenantStatus.PROVISIONING, tenant.status)
        assertEquals(dealId, tenant.dealId)

        // Step 2: Complete remaining steps
        whenever(checklistRepository.countByTenantIdAndCompleted(any(), eq(true))) doReturn 8L
        for (step in listOf(
            ProvisioningStep.SUBSCRIPTION_ACTIVATED,
            ProvisioningStep.INITIAL_CONFIG_DONE,
            ProvisioningStep.DATA_IMPORTED,
            ProvisioningStep.TRAINING_SCHEDULED,
            ProvisioningStep.GO_LIVE
        )) {
            service.completeOnboardingStep(tenant.id, step)
        }

        // Step 3: Activate
        whenever(tenantRepository.findById(tenant.id)) doReturn Optional.of(tenant)
        val activated = service.changeTenantStatus(tenant.id, ChangeStatusCommand(newStatus = TenantStatus.ACTIVE))

        assertEquals(TenantStatus.ACTIVE, activated.status)
        assertNotNull(activated.onboardedAt)
    }

    // ============================================
    // Helpers
    // ============================================

    private fun createTestUser(): PlatformUser {
        return PlatformUser(
            id = testUserId,
            email = "rep@liyaqa.com",
            passwordHash = "hash",
            displayName = LocalizedText(en = "Sales Rep", ar = null),
            role = PlatformUserRole.ACCOUNT_MANAGER
        )
    }

    private fun createWonDeal(): Deal {
        val user = createTestUser()
        val deal = Deal.create(
            facilityName = "Test Gym",
            source = DealSource.WEBSITE,
            contactName = "John Doe",
            contactEmail = "john@example.com",
            assignedTo = user
        )
        deal.changeStage(DealStage.CONTACTED)
        deal.changeStage(DealStage.DEMO_SCHEDULED)
        deal.changeStage(DealStage.DEMO_DONE)
        deal.changeStage(DealStage.PROPOSAL_SENT)
        deal.changeStage(DealStage.NEGOTIATION)
        deal.changeStage(DealStage.WON)
        return deal
    }

    private fun createLeadDeal(): Deal {
        val user = createTestUser()
        return Deal.create(
            facilityName = "Test Gym",
            source = DealSource.WEBSITE,
            contactName = "John Doe",
            contactEmail = "john@example.com",
            assignedTo = user
        )
    }

    private fun createMockOnboardingResult(orgId: UUID, clubId: UUID): OnboardingResult {
        val mockOrg = org.mockito.Mockito.mock(com.liyaqa.organization.domain.model.Organization::class.java)
        val mockClub = org.mockito.Mockito.mock(com.liyaqa.organization.domain.model.Club::class.java)
        val mockUser = org.mockito.Mockito.mock(com.liyaqa.auth.domain.model.User::class.java)

        whenever(mockOrg.id) doReturn orgId
        whenever(mockClub.id) doReturn clubId

        return OnboardingResult(
            organization = mockOrg,
            club = mockClub,
            adminUser = mockUser,
            subscription = null
        )
    }
}
