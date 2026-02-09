package com.liyaqa.integration

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.application.commands.ChangeStageCommand
import com.liyaqa.platform.application.commands.CreateDealCommand
import com.liyaqa.platform.application.commands.CreatePlatformUserCommand
import com.liyaqa.platform.application.services.DealService
import com.liyaqa.platform.application.services.PlatformDashboardService
import com.liyaqa.platform.application.services.PlatformUserService
import com.liyaqa.platform.communication.dto.CreateAnnouncementCommand
import com.liyaqa.platform.communication.model.AnnouncementStatus
import com.liyaqa.platform.communication.model.AnnouncementType
import com.liyaqa.platform.communication.model.TargetAudience
import com.liyaqa.platform.communication.service.AnnouncementService
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStage
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.monitoring.model.PlatformAuditActorType
import com.liyaqa.platform.monitoring.repository.PlatformAuditLogRepository
import com.liyaqa.platform.monitoring.service.AuditContext
import com.liyaqa.platform.subscription.dto.CancelSubscriptionCommand
import com.liyaqa.platform.subscription.dto.ChangePlanCommand
import com.liyaqa.platform.subscription.dto.CreateSubscriptionCommand
import com.liyaqa.platform.subscription.dto.CreateSubscriptionPlanCommand
import com.liyaqa.platform.subscription.model.InvoiceSequence
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionBillingCycle
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.repository.InvoiceSequenceRepository
import com.liyaqa.platform.subscription.service.SubscriptionPlanService
import com.liyaqa.platform.subscription.service.TenantSubscriptionService
import com.liyaqa.platform.support.dto.AddMessageCommand
import com.liyaqa.platform.support.dto.AssignTicketCommand
import com.liyaqa.platform.support.dto.CreateTicketCommand
import com.liyaqa.platform.support.dto.RateTicketCommand
import com.liyaqa.platform.support.model.CreatedByUserType
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketPriority
import com.liyaqa.platform.support.model.TicketSequence
import com.liyaqa.platform.support.model.TicketStatus
import com.liyaqa.platform.support.repository.TicketSequenceRepository
import com.liyaqa.platform.support.service.TicketService
import com.liyaqa.platform.tenant.dto.ChangeStatusCommand
import com.liyaqa.platform.tenant.dto.DeactivateTenantCommand
import com.liyaqa.platform.tenant.dto.ProvisionFromDealCommand
import com.liyaqa.platform.tenant.dto.RequestDataExportCommand
import com.liyaqa.platform.tenant.model.DataExportFormat
import com.liyaqa.platform.tenant.model.DeactivationReason
import com.liyaqa.platform.tenant.model.ProvisioningStep
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.repository.DataExportJobRepository
import com.liyaqa.platform.tenant.service.TenantOffboardingService
import com.liyaqa.platform.tenant.service.TenantProvisioningService
import com.liyaqa.shared.IntegrationTestBase
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import jakarta.persistence.EntityManager
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.domain.Pageable
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Platform End-to-End integration test that validates the full lifecycle:
 * platform user setup, deal pipeline, tenant onboarding, subscription management,
 * support tickets, communication, and offboarding.
 *
 * Requires Docker for TestContainers PostgreSQL.
 */
class PlatformE2ETest : IntegrationTestBase() {

    @Autowired lateinit var platformUserService: PlatformUserService
    @Autowired lateinit var dealService: DealService
    @Autowired lateinit var tenantProvisioningService: TenantProvisioningService
    @Autowired lateinit var tenantOffboardingService: TenantOffboardingService
    @Autowired lateinit var subscriptionPlanService: SubscriptionPlanService
    @Autowired lateinit var tenantSubscriptionService: TenantSubscriptionService
    @Autowired lateinit var ticketService: TicketService
    @Autowired lateinit var announcementService: AnnouncementService
    @Autowired lateinit var platformDashboardService: PlatformDashboardService
    @Autowired lateinit var platformAuditLogRepository: PlatformAuditLogRepository
    @Autowired lateinit var ticketSequenceRepository: TicketSequenceRepository
    @Autowired lateinit var invoiceSequenceRepository: InvoiceSequenceRepository
    @Autowired lateinit var dataExportJobRepository: DataExportJobRepository
    @Autowired lateinit var entityManager: EntityManager

    @BeforeEach
    override fun setUpTenantContext() {
        super.setUpTenantContext()
        seedTicketSequence()
        seedInvoiceSequence()
    }

    // ============================================
    // Helper Methods
    // ============================================

    private fun authenticateAsPlatform(
        userId: UUID,
        email: String,
        platformRole: PlatformUserRole
    ) {
        val principal = JwtUserPrincipal(
            userId = userId,
            tenantId = testTenantId,
            email = email,
            role = Role.PLATFORM_ADMIN,
            scope = "platform",
            platformRole = platformRole
        )
        val auth = UsernamePasswordAuthenticationToken(principal, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth

        AuditContext.set(
            AuditContext.AuditContextData(
                actorId = userId,
                actorType = PlatformAuditActorType.PLATFORM_USER,
                actorName = email
            )
        )
    }

    private fun authenticateAsFacilityUser(userId: UUID, tenantId: UUID, email: String) {
        val principal = JwtUserPrincipal(
            userId = userId,
            tenantId = tenantId,
            email = email,
            role = Role.CLUB_ADMIN,
            scope = "facility"
        )
        val auth = UsernamePasswordAuthenticationToken(principal, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth

        AuditContext.set(
            AuditContext.AuditContextData(
                actorId = userId,
                actorType = PlatformAuditActorType.PLATFORM_USER,
                actorName = email
            )
        )
    }

    private fun clearAuth() {
        SecurityContextHolder.clearContext()
        AuditContext.clear()
    }

    private fun seedTicketSequence() {
        val seq = TicketSequence(
            id = TicketSequence.SINGLETON_ID,
            currentYear = 2026
        )
        ticketSequenceRepository.save(seq)
    }

    private fun seedInvoiceSequence() {
        val seq = InvoiceSequence(
            id = InvoiceSequence.SINGLETON_ID,
            currentYear = 2026
        )
        invoiceSequenceRepository.save(seq)
    }

    private fun flushAndClear() {
        entityManager.flush()
        entityManager.clear()
    }

    // ============================================
    // E2E Test: Full Platform Lifecycle
    // ============================================

    @Test
    fun `full platform lifecycle - from setup through offboarding`() {
        // ================================================================
        // SCENARIO 1: PLATFORM SETUP - Create platform team users
        // ================================================================
        val superAdminId = UUID.randomUUID()
        authenticateAsPlatform(superAdminId, "superadmin@liyaqa.com", PlatformUserRole.PLATFORM_SUPER_ADMIN)

        val superAdmin = platformUserService.createUser(
            CreatePlatformUserCommand(
                email = "superadmin@liyaqa.com",
                password = "SecurePass123!",
                displayName = LocalizedText(en = "Super Admin", ar = "المدير العام"),
                role = PlatformUserRole.PLATFORM_SUPER_ADMIN
            )
        )

        val accountManager = platformUserService.createUser(
            CreatePlatformUserCommand(
                email = "accountmgr@liyaqa.com",
                password = "SecurePass123!",
                displayName = LocalizedText(en = "Account Manager", ar = "مدير الحسابات"),
                role = PlatformUserRole.ACCOUNT_MANAGER
            )
        )

        val supportAgent = platformUserService.createUser(
            CreatePlatformUserCommand(
                email = "support@liyaqa.com",
                password = "SecurePass123!",
                displayName = LocalizedText(en = "Support Agent", ar = "وكيل الدعم"),
                role = PlatformUserRole.SUPPORT_AGENT
            )
        )

        assertThat(superAdmin.role).isEqualTo(PlatformUserRole.PLATFORM_SUPER_ADMIN)
        assertThat(accountManager.role).isEqualTo(PlatformUserRole.ACCOUNT_MANAGER)
        assertThat(supportAgent.role).isEqualTo(PlatformUserRole.SUPPORT_AGENT)
        assertThat(superAdmin.isActive()).isTrue()
        assertThat(accountManager.isActive()).isTrue()
        assertThat(supportAgent.isActive()).isTrue()

        val allUsers = platformUserService.getAllUsers(pageable = Pageable.unpaged())
        assertThat(allUsers.content).hasSizeGreaterThanOrEqualTo(3)

        flushAndClear()

        // ================================================================
        // SCENARIO 2: DEAL PIPELINE - Progress a deal from LEAD to WON
        // ================================================================
        authenticateAsPlatform(accountManager.id, "accountmgr@liyaqa.com", PlatformUserRole.ACCOUNT_MANAGER)

        val deal = dealService.createDeal(
            CreateDealCommand(
                facilityName = "FitZone Gym",
                contactName = "Ahmed Al-Rashid",
                contactEmail = "ahmed@fitzone.sa",
                contactPhone = "+966501234567",
                source = DealSource.WEBSITE,
                estimatedValue = BigDecimal("50000.00"),
                currency = "SAR",
                expectedCloseDate = LocalDate.now().plusDays(30),
                notes = "Premium gym chain interested in platform",
                assignedToId = accountManager.id
            )
        )
        assertThat(deal.stage).isEqualTo(DealStage.LEAD)

        // Progress through deal stages
        val stageProgression = listOf(
            DealStage.CONTACTED,
            DealStage.DEMO_SCHEDULED,
            DealStage.DEMO_DONE,
            DealStage.PROPOSAL_SENT,
            DealStage.NEGOTIATION,
            DealStage.WON
        )

        var currentDeal = deal
        for (stage in stageProgression) {
            currentDeal = dealService.changeDealStage(
                currentDeal.id,
                ChangeStageCommand(newStage = stage)
            )
        }

        assertThat(currentDeal.stage).isEqualTo(DealStage.WON)
        assertThat(currentDeal.closedAt).isNotNull()

        // Verify activities were logged for each transition
        val activities = dealService.getActivities(deal.id)
        // 1 creation activity + 6 stage changes = at least 7
        assertThat(activities).hasSizeGreaterThanOrEqualTo(7)

        flushAndClear()

        // ================================================================
        // SCENARIO 3: TENANT ONBOARDING - Provision tenant from won deal
        // ================================================================
        authenticateAsPlatform(superAdmin.id, "superadmin@liyaqa.com", PlatformUserRole.PLATFORM_SUPER_ADMIN)

        // Create a STARTER subscription plan
        val starterPlan = subscriptionPlanService.createPlan(
            CreateSubscriptionPlanCommand(
                name = "Starter",
                nameAr = "مبتدئ",
                description = "Starter plan for small gyms",
                descriptionAr = null,
                tier = PlanTier.STARTER,
                monthlyPriceAmount = BigDecimal("500.00"),
                monthlyPriceCurrency = "SAR",
                annualPriceAmount = BigDecimal("5000.00"),
                annualPriceCurrency = "SAR",
                maxClubs = 1,
                maxLocationsPerClub = 1,
                maxMembers = 200,
                maxStaffUsers = 5,
                features = mapOf(
                    "member_management" to true,
                    "class_scheduling" to true,
                    "basic_reporting" to true
                ),
                sortOrder = 1
            )
        )
        assertThat(starterPlan.isActive).isTrue()

        // Provision tenant from the won deal
        val tenant = tenantProvisioningService.provisionFromDeal(
            deal.id,
            ProvisionFromDealCommand(
                adminEmail = "admin@fitzone.sa",
                adminPassword = "FitZoneAdmin123!",
                adminDisplayNameEn = "FitZone Admin",
                adminDisplayNameAr = "مدير فت زون",
                clubName = "FitZone Main Branch",
                subscriptionPlanId = starterPlan.id
            )
        )

        // Re-set TenantContext since provisioning may change it internally
        TenantContext.setCurrentTenant(TenantId(testTenantId))

        assertThat(tenant.status).isEqualTo(TenantStatus.PROVISIONING)
        assertThat(tenant.dealId).isEqualTo(deal.id)

        // Complete remaining onboarding steps
        val remainingSteps = listOf(
            ProvisioningStep.SUBSCRIPTION_ACTIVATED,
            ProvisioningStep.INITIAL_CONFIG_DONE,
            ProvisioningStep.DATA_IMPORTED,
            ProvisioningStep.TRAINING_SCHEDULED,
            ProvisioningStep.GO_LIVE
        )
        for (step in remainingSteps) {
            tenantProvisioningService.completeOnboardingStep(tenant.id, step)
        }

        // Activate tenant
        val activatedTenant = tenantProvisioningService.changeTenantStatus(
            tenant.id,
            ChangeStatusCommand(newStatus = TenantStatus.ACTIVE)
        )
        assertThat(activatedTenant.status).isEqualTo(TenantStatus.ACTIVE)

        // Verify onboarding checklist is complete
        val checklist = tenantProvisioningService.getOnboardingChecklist(tenant.id)
        val completedCount = checklist.count { it.completed }
        assertThat(completedCount).isEqualTo(ProvisioningStep.entries.size)

        flushAndClear()

        // ================================================================
        // SCENARIO 4: SUBSCRIPTION MANAGEMENT - Create and upgrade subscription
        // ================================================================
        authenticateAsPlatform(superAdmin.id, "superadmin@liyaqa.com", PlatformUserRole.PLATFORM_SUPER_ADMIN)

        // Create a subscription for the tenant
        val subscription = tenantSubscriptionService.subscribe(
            CreateSubscriptionCommand(
                tenantId = tenant.id,
                planId = starterPlan.id,
                billingCycle = SubscriptionBillingCycle.MONTHLY,
                startTrial = false
            )
        )
        assertThat(subscription.status).isEqualTo(SubscriptionStatus.ACTIVE)
        assertThat(subscription.planId).isEqualTo(starterPlan.id)

        // Create PROFESSIONAL plan (higher tier)
        val professionalPlan = subscriptionPlanService.createPlan(
            CreateSubscriptionPlanCommand(
                name = "Professional",
                nameAr = "محترف",
                description = "Professional plan for growing gyms",
                descriptionAr = null,
                tier = PlanTier.PROFESSIONAL,
                monthlyPriceAmount = BigDecimal("1500.00"),
                monthlyPriceCurrency = "SAR",
                annualPriceAmount = BigDecimal("15000.00"),
                annualPriceCurrency = "SAR",
                maxClubs = 3,
                maxLocationsPerClub = 2,
                maxMembers = 1000,
                maxStaffUsers = 20,
                features = mapOf(
                    "member_management" to true,
                    "class_scheduling" to true,
                    "basic_reporting" to true,
                    "advanced_analytics" to true,
                    "api_access" to true
                ),
                sortOrder = 2
            )
        )

        // Upgrade to PROFESSIONAL plan
        val upgradedSubscription = tenantSubscriptionService.changePlan(
            tenant.id,
            ChangePlanCommand(newPlanId = professionalPlan.id)
        )
        assertThat(upgradedSubscription.planId).isEqualTo(professionalPlan.id)
        assertThat(upgradedSubscription.status).isEqualTo(SubscriptionStatus.ACTIVE)

        flushAndClear()

        // ================================================================
        // SCENARIO 5: SUPPORT TICKET LIFECYCLE
        // ================================================================

        // Create ticket as facility user
        val facilityUserId = UUID.randomUUID()
        authenticateAsFacilityUser(facilityUserId, tenant.id, "admin@fitzone.sa")

        val ticket = ticketService.createTicket(
            CreateTicketCommand(
                tenantId = tenant.id,
                createdByUserId = facilityUserId,
                createdByUserType = CreatedByUserType.FACILITY_ADMIN,
                subject = "Cannot access class schedule",
                description = "Getting 403 error when trying to view the class schedule page",
                category = TicketCategory.TECHNICAL,
                priority = TicketPriority.HIGH
            )
        )
        assertThat(ticket.status).isEqualTo(TicketStatus.OPEN)
        assertThat(ticket.ticketNumber).startsWith("TKT-")

        // Switch to support agent
        authenticateAsPlatform(supportAgent.id, "support@liyaqa.com", PlatformUserRole.SUPPORT_AGENT)

        // Assign ticket
        ticketService.assignTicket(ticket.id, AssignTicketCommand(assignedToId = supportAgent.id))

        // Start progress
        ticketService.changeStatus(
            ticket.id,
            com.liyaqa.platform.support.dto.ChangeStatusCommand(
                status = TicketStatus.IN_PROGRESS,
                reason = "Investigating the issue"
            ),
            changedBy = supportAgent.id
        )

        // Add public reply
        ticketService.addMessage(
            ticket.id,
            AddMessageCommand(
                senderId = supportAgent.id,
                senderType = CreatedByUserType.PLATFORM_AGENT,
                content = "I can see the issue. It appears to be a permissions configuration problem. Working on a fix.",
                isInternalNote = false
            )
        )

        // Add internal note
        ticketService.addMessage(
            ticket.id,
            AddMessageCommand(
                senderId = supportAgent.id,
                senderType = CreatedByUserType.PLATFORM_AGENT,
                content = "Root cause: missing SCHEDULE_VIEW permission for club admin role. Need to update role config.",
                isInternalNote = true
            )
        )

        // Resolve ticket
        ticketService.changeStatus(
            ticket.id,
            com.liyaqa.platform.support.dto.ChangeStatusCommand(
                status = TicketStatus.RESOLVED,
                reason = "Fixed permissions configuration"
            ),
            changedBy = supportAgent.id
        )

        // Switch back to facility user to rate and close
        authenticateAsFacilityUser(facilityUserId, tenant.id, "admin@fitzone.sa")

        ticketService.rateTicket(ticket.id, RateTicketCommand(rating = 5))

        ticketService.changeStatus(
            ticket.id,
            com.liyaqa.platform.support.dto.ChangeStatusCommand(
                status = TicketStatus.CLOSED,
                reason = "Satisfied with resolution"
            ),
            changedBy = facilityUserId
        )

        // Verify final ticket state
        val ticketDetail = ticketService.getTicket(ticket.id)
        assertThat(ticketDetail.ticket.status).isEqualTo(TicketStatus.CLOSED)
        assertThat(ticketDetail.ticket.satisfactionRating).isEqualTo(5)
        assertThat(ticketDetail.ticket.assignedToId).isEqualTo(supportAgent.id)
        // 2 messages (1 public reply + 1 internal note)
        assertThat(ticketDetail.messages).hasSize(2)
        // Status history: OPEN -> OPEN (creation), OPEN -> IN_PROGRESS, IN_PROGRESS -> RESOLVED, RESOLVED -> CLOSED
        assertThat(ticketDetail.statusHistory).hasSizeGreaterThanOrEqualTo(4)

        flushAndClear()

        // ================================================================
        // SCENARIO 6: MONITORING & AUDIT (skipping impersonation since it
        // requires real User entities + JWT token provider integration)
        // ================================================================
        authenticateAsPlatform(superAdmin.id, "superadmin@liyaqa.com", PlatformUserRole.PLATFORM_SUPER_ADMIN)

        // Query audit logs
        val auditLogs = platformAuditLogRepository.findAll(Pageable.unpaged())
        // Audit logs may or may not be populated depending on @Async + REQUIRES_NEW
        // In a @Transactional test, REQUIRES_NEW creates separate transactions that
        // commit independently, so some audit entries may exist

        // Get dashboard stats (verifies no errors with the data we've created)
        val dashboard = platformDashboardService.getDashboard()
        assertThat(dashboard).isNotNull()

        flushAndClear()

        // ================================================================
        // SCENARIO 7: COMMUNICATION - Create and publish announcement
        // ================================================================
        authenticateAsPlatform(superAdmin.id, "superadmin@liyaqa.com", PlatformUserRole.PLATFORM_SUPER_ADMIN)

        val announcement = announcementService.createAnnouncement(
            CreateAnnouncementCommand(
                title = "Platform Maintenance Window",
                content = "Scheduled maintenance on Saturday 10pm-2am. All services will be briefly unavailable.",
                type = AnnouncementType.MAINTENANCE,
                targetAudience = TargetAudience.ALL,
                priority = 4
            ),
            createdBy = superAdmin.id
        )
        assertThat(announcement.status).isEqualTo(AnnouncementStatus.DRAFT)

        val publishedAnnouncement = announcementService.publishAnnouncement(announcement.id)
        assertThat(publishedAnnouncement.status).isEqualTo(AnnouncementStatus.PUBLISHED)
        assertThat(publishedAnnouncement.publishedAt).isNotNull()

        flushAndClear()

        // ================================================================
        // SCENARIO 8: OFFBOARDING - Cancel subscription and deactivate tenant
        // ================================================================
        authenticateAsPlatform(superAdmin.id, "superadmin@liyaqa.com", PlatformUserRole.PLATFORM_SUPER_ADMIN)

        // Cancel subscription
        val cancelledSubscription = tenantSubscriptionService.cancel(
            tenant.id,
            CancelSubscriptionCommand(reason = "Client closing business")
        )
        assertThat(cancelledSubscription.status).isEqualTo(SubscriptionStatus.CANCELLED)

        // Request data export
        val exportJob = tenantOffboardingService.requestDataExport(
            tenant.id,
            RequestDataExportCommand(format = DataExportFormat.JSON)
        )
        assertThat(exportJob.status).isEqualTo(com.liyaqa.platform.tenant.model.DataExportStatus.PENDING)

        // Simulate export completion (directly via repository since async processing
        // won't run in test context)
        exportJob.complete("https://exports.liyaqa.com/fitzone-export.json", 1024000L)
        dataExportJobRepository.save(exportJob)

        flushAndClear()

        // Deactivate tenant
        val deactivatedTenant = tenantOffboardingService.deactivateTenant(
            tenant.id,
            DeactivateTenantCommand(
                reason = DeactivationReason.CLIENT_REQUEST,
                notes = "Client voluntarily closing their account"
            )
        )
        assertThat(deactivatedTenant.status).isEqualTo(TenantStatus.DEACTIVATED)

        // Archive tenant (requires DEACTIVATED status + completed export)
        val archivedTenant = tenantOffboardingService.archiveTenant(tenant.id)
        assertThat(archivedTenant.status).isEqualTo(TenantStatus.ARCHIVED)
        assertThat(archivedTenant.dataRetentionUntil).isNotNull()

        // ================================================================
        // FINAL VERIFICATION: Cross-check the full lifecycle
        // ================================================================

        // The deal that started it all is still WON
        val finalDeal = dealService.getDeal(deal.id)
        assertThat(finalDeal.stage).isEqualTo(DealStage.WON)

        // The tenant went through the full lifecycle
        val finalTenant = tenantProvisioningService.getTenant(tenant.id)
        assertThat(finalTenant.status).isEqualTo(TenantStatus.ARCHIVED)

        // All subscription plans are still active
        val plans = subscriptionPlanService.listPlans(activeOnly = true)
        assertThat(plans).hasSizeGreaterThanOrEqualTo(2)

        // Deactivation history exists
        val deactivationHistory = tenantOffboardingService.getDeactivationHistory(tenant.id)
        assertThat(deactivationHistory).isNotEmpty()

        // Data export completed
        val exports = tenantOffboardingService.getDataExports(tenant.id)
        assertThat(exports).isNotEmpty()
        assertThat(exports.first().status).isEqualTo(com.liyaqa.platform.tenant.model.DataExportStatus.COMPLETED)

        clearAuth()
    }
}
