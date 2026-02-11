package com.liyaqa.platform.application.services

import com.liyaqa.auth.application.commands.CreateUserCommand
import com.liyaqa.auth.application.services.UserService
import com.liyaqa.auth.domain.model.Role
import com.liyaqa.organization.application.commands.CreateClubCommand
import com.liyaqa.organization.application.commands.CreateOrganizationCommand
import com.liyaqa.organization.application.services.ClubService
import com.liyaqa.organization.application.services.OrganizationService
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.platform.application.commands.ChangeStageCommand
import com.liyaqa.platform.application.commands.ConvertDealCommand
import com.liyaqa.platform.application.commands.CreateClientSubscriptionCommand
import com.liyaqa.platform.application.commands.CreateDealActivityCommand
import com.liyaqa.platform.application.commands.CreateDealCommand
import com.liyaqa.platform.application.commands.UpdateDealCommand
import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.platform.domain.model.Deal
import com.liyaqa.platform.domain.model.DealActivity
import com.liyaqa.platform.domain.model.DealActivityType
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStage
import com.liyaqa.platform.domain.ports.DealActivityRepository
import com.liyaqa.platform.domain.ports.DealRepository
import com.liyaqa.platform.domain.ports.PlatformUserRepository
import com.liyaqa.platform.events.model.PlatformEvent
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service
@Transactional
class DealService(
    private val dealRepository: DealRepository,
    private val dealActivityRepository: DealActivityRepository,
    private val platformUserRepository: PlatformUserRepository,
    private val securityService: SecurityService,
    private val eventPublisher: ApplicationEventPublisher,
    private val organizationService: OrganizationService,
    private val clubService: ClubService,
    private val userService: UserService,
    private val clientSubscriptionService: ClientSubscriptionService
) {
    private val logger = LoggerFactory.getLogger(DealService::class.java)

    // ============================================
    // CRUD
    // ============================================

    fun createDeal(command: CreateDealCommand): Deal {
        val assignedTo = if (command.assignedToId != null) {
            platformUserRepository.findById(command.assignedToId)
                .orElseThrow { NoSuchElementException("Platform user not found: ${command.assignedToId}") }
        } else {
            val currentUserId = securityService.getCurrentUserId()
                ?: throw IllegalStateException("Could not determine current user")
            platformUserRepository.findById(currentUserId)
                .orElseThrow { NoSuchElementException("Current platform user not found") }
        }

        val deal = Deal.create(
            facilityName = command.facilityName,
            source = command.source,
            contactName = command.contactName,
            contactEmail = command.contactEmail,
            assignedTo = assignedTo,
            contactPhone = command.contactPhone,
            estimatedValue = command.estimatedValue ?: BigDecimal.ZERO,
            currency = command.currency,
            expectedCloseDate = command.expectedCloseDate,
            notes = command.notes
        )

        val saved = dealRepository.save(deal)

        // Auto-create STATUS_CHANGE activity
        recordStageChange(saved.id, null, DealStage.LEAD)

        eventPublisher.publishEvent(PlatformEvent.DealCreated(
            dealId = saved.id,
            facilityName = saved.facilityName,
            contactName = saved.contactName,
            source = saved.source.name
        ))

        logger.info("Created deal: ${saved.id} - ${saved.facilityName ?: saved.contactName}")
        return saved
    }

    @Transactional(readOnly = true)
    fun getDeal(id: UUID): Deal {
        return dealRepository.findById(id)
            .orElseThrow { NoSuchElementException("Deal not found: $id") }
    }

    @Transactional(readOnly = true)
    fun listDeals(
        stage: DealStage? = null,
        source: DealSource? = null,
        assignedToId: UUID? = null,
        pageable: Pageable
    ): Page<Deal> {
        return when {
            stage != null -> dealRepository.findByStage(stage, pageable)
            assignedToId != null -> dealRepository.findByAssignedToId(assignedToId, pageable)
            source != null -> dealRepository.findBySource(source, pageable)
            else -> dealRepository.findAll(pageable)
        }
    }

    fun updateDeal(id: UUID, command: UpdateDealCommand): Deal {
        val deal = getDeal(id)
        require(deal.isOpen()) { "Cannot update closed deals" }

        command.facilityName?.let { deal.facilityName = it }
        command.contactName?.let { deal.contactName = it }
        command.contactEmail?.let { deal.contactEmail = it }
        command.contactPhone?.let { deal.contactPhone = it }
        command.notes?.let { deal.notes = it }
        command.estimatedValue?.let { deal.estimatedValue = it }
        command.expectedCloseDate?.let { deal.expectedCloseDate = it }

        return dealRepository.save(deal)
    }

    // ============================================
    // Stage Transitions
    // ============================================

    fun changeDealStage(id: UUID, command: ChangeStageCommand): Deal {
        val deal = getDeal(id)
        val oldStage = deal.stage

        if (command.newStage == DealStage.LOST && command.reason != null) {
            deal.lostReason = command.reason
        }

        deal.changeStage(command.newStage)
        val saved = dealRepository.save(deal)

        when (command.newStage) {
            DealStage.WON -> eventPublisher.publishEvent(PlatformEvent.DealWon(
                dealId = saved.id,
                facilityName = saved.facilityName,
                contactName = saved.contactName,
                contactEmail = saved.contactEmail,
                estimatedValue = saved.estimatedValue
            ))
            DealStage.LOST -> eventPublisher.publishEvent(PlatformEvent.DealLost(
                dealId = saved.id,
                facilityName = saved.facilityName,
                reason = saved.lostReason
            ))
            else -> eventPublisher.publishEvent(PlatformEvent.DealStageChanged(
                dealId = saved.id,
                fromStage = oldStage.name,
                toStage = command.newStage.name,
                facilityName = saved.facilityName,
                contactEmail = saved.contactEmail
            ))
        }

        recordStageChange(saved.id, oldStage, command.newStage)
        logger.info("Deal ${deal.id} stage changed: $oldStage -> ${command.newStage}")
        return saved
    }

    fun qualifyDeal(id: UUID): Deal {
        return changeDealStage(id, ChangeStageCommand(newStage = DealStage.CONTACTED))
    }

    fun sendProposal(id: UUID): Deal {
        return changeDealStage(id, ChangeStageCommand(newStage = DealStage.PROPOSAL_SENT))
    }

    fun startNegotiation(id: UUID): Deal {
        return changeDealStage(id, ChangeStageCommand(newStage = DealStage.NEGOTIATION))
    }

    fun loseDeal(id: UUID, reason: String): Deal {
        return changeDealStage(id, ChangeStageCommand(newStage = DealStage.LOST, reason = reason))
    }

    fun reopenDeal(id: UUID): Deal {
        return changeDealStage(id, ChangeStageCommand(newStage = DealStage.LEAD))
    }

    fun reassignDeal(id: UUID, newSalesRepId: UUID): Deal {
        val deal = getDeal(id)
        val newAssignee = platformUserRepository.findById(newSalesRepId)
            .orElseThrow { NoSuchElementException("Platform user not found: $newSalesRepId") }
        deal.assignedTo = newAssignee
        logger.info("Deal ${deal.id} reassigned to ${newAssignee.email}")
        return dealRepository.save(deal)
    }

    // ============================================
    // Conversion (Deal → Client)
    // ============================================

    fun convertDeal(dealId: UUID, command: ConvertDealCommand): DealConversionResult {
        val deal = getDeal(dealId)
        require(deal.stage == DealStage.NEGOTIATION) {
            "Deal must be in NEGOTIATION stage to convert. Current stage: ${deal.stage}"
        }

        // 1. Create Organization
        val org = organizationService.createOrganization(
            CreateOrganizationCommand(
                name = LocalizedText(en = command.organizationNameEn, ar = command.organizationNameAr),
                tradeName = if (command.organizationTradeNameEn != null) {
                    LocalizedText(en = command.organizationTradeNameEn, ar = command.organizationTradeNameAr)
                } else null,
                organizationType = command.organizationType ?: OrganizationType.OTHER,
                email = command.organizationEmail,
                phone = command.organizationPhone,
                website = command.organizationWebsite,
                vatRegistrationNumber = command.vatRegistrationNumber,
                commercialRegistrationNumber = command.commercialRegistrationNumber
            )
        )

        // 2. Activate Organization
        organizationService.activateOrganization(org.id)

        // 3. Create Club
        val club = clubService.createClub(
            CreateClubCommand(
                organizationId = org.id,
                name = LocalizedText(en = command.clubNameEn, ar = command.clubNameAr),
                description = if (command.clubDescriptionEn != null) {
                    LocalizedText(en = command.clubDescriptionEn, ar = command.clubDescriptionAr)
                } else null
            )
        )

        // 4. Set tenant context (club.id IS the tenantId)
        TenantContext.setCurrentTenant(TenantId(club.id))

        try {
            // 5. Create admin user
            val adminUser = userService.createUser(
                CreateUserCommand(
                    email = command.adminEmail,
                    password = command.adminPassword,
                    displayName = LocalizedText(en = command.adminDisplayNameEn, ar = command.adminDisplayNameAr),
                    role = Role.SUPER_ADMIN
                )
            )

            // 6. Create subscription if plan provided
            var subscriptionId: UUID? = null
            var subscriptionStatus: String? = null
            if (command.clientPlanId != null) {
                val subscription = clientSubscriptionService.createSubscription(
                    CreateClientSubscriptionCommand(
                        organizationId = org.id,
                        clientPlanId = command.clientPlanId,
                        agreedPrice = Money.of(
                            command.agreedPriceAmount ?: BigDecimal.ZERO,
                            command.agreedPriceCurrency ?: "SAR"
                        ),
                        billingCycle = command.billingCycle ?: BillingCycle.MONTHLY,
                        contractMonths = command.contractMonths ?: 12,
                        startWithTrial = command.startWithTrial ?: false,
                        trialDays = command.trialDays ?: 14,
                        discountPercentage = command.discountPercentage,
                        dealId = deal.id,
                        salesRepId = deal.assignedTo.id
                    )
                )
                subscriptionId = subscription.id
                subscriptionStatus = subscription.status.name
            }

            // 7. Mark deal as WON
            deal.changeStage(DealStage.WON)
            val savedDeal = dealRepository.save(deal)

            recordStageChange(savedDeal.id, DealStage.NEGOTIATION, DealStage.WON)

            eventPublisher.publishEvent(
                PlatformEvent.DealWon(
                    dealId = savedDeal.id,
                    facilityName = savedDeal.facilityName,
                    contactName = savedDeal.contactName,
                    contactEmail = savedDeal.contactEmail,
                    estimatedValue = savedDeal.estimatedValue
                )
            )

            logger.info("Deal ${deal.id} converted: org=${org.id}, club=${club.id}, admin=${adminUser.id}")

            return DealConversionResult(
                deal = savedDeal,
                organizationId = org.id,
                organizationName = org.name.en,
                clubId = club.id,
                clubName = club.name.en,
                adminUserId = adminUser.id,
                adminEmail = adminUser.email,
                subscriptionId = subscriptionId,
                subscriptionStatus = subscriptionStatus
            )
        } finally {
            TenantContext.clear()
        }
    }

    // ============================================
    // Activities
    // ============================================

    fun addActivity(dealId: UUID, command: CreateDealActivityCommand): DealActivity {
        require(dealRepository.existsById(dealId)) { "Deal not found: $dealId" }

        val currentUserId = securityService.getCurrentUserId()
            ?: throw IllegalStateException("Could not determine current user")

        val activity = DealActivity(
            dealId = dealId,
            type = command.type,
            content = command.content,
            createdBy = currentUserId
        )
        return dealActivityRepository.save(activity)
    }

    @Transactional(readOnly = true)
    fun getActivities(dealId: UUID): List<DealActivity> {
        return dealActivityRepository.findByDealId(dealId)
    }

    // ============================================
    // Pipeline & Metrics
    // ============================================

    @Transactional(readOnly = true)
    fun getPipelineCounts(): Map<DealStage, Long> {
        return dealRepository.countByStageGrouped()
    }

    @Transactional(readOnly = true)
    fun getMetrics(): DealMetrics {
        val counts = dealRepository.countByStageGrouped()
        val totalDeals = counts.values.sum()
        val openStages = DealStage.entries.filter { it !in Deal.TERMINAL_STAGES }
        val openDeals = openStages.sumOf { counts[it] ?: 0L }
        val wonDeals = counts[DealStage.WON] ?: 0L
        val lostDeals = counts[DealStage.LOST] ?: 0L

        val closedDeals = wonDeals + lostDeals
        val conversionRate = if (closedDeals > 0) {
            wonDeals.toDouble() / closedDeals.toDouble()
        } else 0.0

        // Avg deal value from won deals
        val wonDealsList = dealRepository.findByStage(DealStage.WON, Pageable.unpaged()).content
        val avgDealValue = if (wonDealsList.isNotEmpty()) {
            wonDealsList.map { it.estimatedValue }.fold(BigDecimal.ZERO) { acc, v -> acc.add(v) }
                .divide(BigDecimal(wonDealsList.size), 2, RoundingMode.HALF_UP)
        } else BigDecimal.ZERO

        // Avg days to close (from createdAt to closedAt on won deals)
        val avgDaysToClose = if (wonDealsList.isNotEmpty()) {
            val totalDays = wonDealsList.mapNotNull { deal ->
                deal.closedAt?.let { closedAt ->
                    val createdDate = deal.createdAt.atZone(ZoneOffset.UTC).toLocalDate()
                    ChronoUnit.DAYS.between(createdDate, closedAt)
                }
            }
            if (totalDays.isNotEmpty()) totalDays.average() else 0.0
        } else 0.0

        return DealMetrics(
            totalDeals = totalDeals,
            openDeals = openDeals,
            wonDeals = wonDeals,
            lostDeals = lostDeals,
            conversionRate = conversionRate,
            avgDealValue = avgDealValue,
            avgDaysToClose = avgDaysToClose,
            stageDistribution = counts
        )
    }

    // ============================================
    // Helpers
    // ============================================

    private fun recordStageChange(dealId: UUID, fromStage: DealStage?, toStage: DealStage) {
        val currentUserId = try {
            securityService.getCurrentUserId()
        } catch (_: Exception) {
            null
        } ?: return // Skip if no user context (shouldn't happen in practice)

        val content = if (fromStage != null) {
            "Stage changed from $fromStage to $toStage"
        } else {
            "Deal created in stage $toStage"
        }

        val activity = DealActivity(
            dealId = dealId,
            type = DealActivityType.STATUS_CHANGE,
            content = content,
            createdBy = currentUserId
        )
        dealActivityRepository.save(activity)
    }
}

data class DealMetrics(
    val totalDeals: Long,
    val openDeals: Long,
    val wonDeals: Long,
    val lostDeals: Long,
    val conversionRate: Double,
    val avgDealValue: BigDecimal,
    val avgDaysToClose: Double,
    val stageDistribution: Map<DealStage, Long>
)

data class DealConversionResult(
    val deal: Deal,
    val organizationId: UUID,
    val organizationName: String,
    val clubId: UUID,
    val clubName: String,
    val adminUserId: UUID,
    val adminEmail: String,
    val subscriptionId: UUID?,
    val subscriptionStatus: String?
)
