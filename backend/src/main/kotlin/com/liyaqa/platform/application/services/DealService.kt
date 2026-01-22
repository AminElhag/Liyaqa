package com.liyaqa.platform.application.services

import com.liyaqa.auth.domain.model.User
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.platform.application.commands.ConvertDealCommand
import com.liyaqa.platform.application.commands.CreateDealCommand
import com.liyaqa.platform.application.commands.LoseDealCommand
import com.liyaqa.platform.application.commands.ReassignDealCommand
import com.liyaqa.platform.application.commands.UpdateDealCommand
import com.liyaqa.platform.domain.model.ClientSubscription
import com.liyaqa.platform.domain.model.Deal
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStatus
import com.liyaqa.platform.domain.ports.ClientPlanRepository
import com.liyaqa.platform.domain.ports.DealRepository
import com.liyaqa.shared.domain.Money
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.UUID

/**
 * Service for managing sales deals in the pipeline.
 * Only accessible by platform users (internal Liyaqa team).
 */
@Service
@Transactional
class DealService(
    private val dealRepository: DealRepository,
    private val planRepository: ClientPlanRepository,
    private val clientOnboardingService: ClientOnboardingService
) {
    private val logger = LoggerFactory.getLogger(DealService::class.java)

    // ============================================
    // CRUD Operations
    // ============================================

    /**
     * Creates a new deal.
     */
    fun createDeal(command: CreateDealCommand): Deal {
        // Validate interested plan if provided
        if (command.interestedPlanId != null && !planRepository.existsById(command.interestedPlanId)) {
            throw NoSuchElementException("Client plan not found: ${command.interestedPlanId}")
        }

        val deal = Deal.create(
            title = command.title,
            source = command.source,
            contactName = command.contactName,
            contactEmail = command.contactEmail,
            salesRepId = command.salesRepId,
            contactPhone = command.contactPhone,
            companyName = command.companyName,
            estimatedValue = command.estimatedValue,
            probability = command.probability,
            expectedCloseDate = command.expectedCloseDate,
            interestedPlanId = command.interestedPlanId,
            notes = command.notes
        )

        val saved = dealRepository.save(deal)
        logger.info("Created deal: ${saved.id} - ${saved.title.en}")
        return saved
    }

    /**
     * Gets a deal by ID.
     */
    @Transactional(readOnly = true)
    fun getDeal(id: UUID): Deal {
        return dealRepository.findById(id)
            .orElseThrow { NoSuchElementException("Deal not found: $id") }
    }

    /**
     * Gets all deals with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllDeals(pageable: Pageable): Page<Deal> {
        return dealRepository.findAll(pageable)
    }

    /**
     * Gets deals by status.
     */
    @Transactional(readOnly = true)
    fun getDealsByStatus(status: DealStatus, pageable: Pageable): Page<Deal> {
        return dealRepository.findByStatus(status, pageable)
    }

    /**
     * Gets deals by sales rep.
     */
    @Transactional(readOnly = true)
    fun getDealsBySalesRep(salesRepId: UUID, pageable: Pageable): Page<Deal> {
        return dealRepository.findBySalesRepId(salesRepId, pageable)
    }

    /**
     * Gets open deals for a sales rep.
     */
    @Transactional(readOnly = true)
    fun getOpenDealsBySalesRep(salesRepId: UUID, pageable: Pageable): Page<Deal> {
        return dealRepository.findOpenBySalesRepId(salesRepId, pageable)
    }

    /**
     * Gets deals by source.
     */
    @Transactional(readOnly = true)
    fun getDealsBySource(source: DealSource, pageable: Pageable): Page<Deal> {
        return dealRepository.findBySource(source, pageable)
    }

    /**
     * Gets all open deals.
     */
    @Transactional(readOnly = true)
    fun getOpenDeals(pageable: Pageable): Page<Deal> {
        return dealRepository.findOpen(pageable)
    }

    /**
     * Gets deals expected to close within given days.
     */
    @Transactional(readOnly = true)
    fun getDealsExpectedToClose(days: Int): List<Deal> {
        return dealRepository.findExpectedToCloseWithin(days)
    }

    /**
     * Updates a deal.
     */
    fun updateDeal(id: UUID, command: UpdateDealCommand): Deal {
        val deal = dealRepository.findById(id)
            .orElseThrow { NoSuchElementException("Deal not found: $id") }

        require(deal.isOpen()) { "Cannot update closed deals" }

        // Validate interested plan if provided
        if (command.interestedPlanId != null && !planRepository.existsById(command.interestedPlanId)) {
            throw NoSuchElementException("Client plan not found: ${command.interestedPlanId}")
        }

        command.title?.let { deal.title = it }
        command.source?.let { deal.source = it }
        command.contactName?.let { deal.contactName = it }
        command.contactEmail?.let { deal.contactEmail = it }
        command.contactPhone?.let { deal.contactPhone = it }
        command.companyName?.let { deal.companyName = it }
        command.estimatedValue?.let { deal.updateEstimatedValue(it) }
        command.probability?.let { deal.updateProbability(it) }
        command.expectedCloseDate?.let { deal.expectedCloseDate = it }
        command.interestedPlanId?.let { deal.updateInterestedPlan(it) }
        command.notes?.let { deal.notes = it }

        return dealRepository.save(deal)
    }

    /**
     * Deletes a deal. Only LEAD or LOST deals can be deleted.
     */
    fun deleteDeal(id: UUID) {
        val deal = dealRepository.findById(id)
            .orElseThrow { NoSuchElementException("Deal not found: $id") }

        require(deal.status in listOf(DealStatus.LEAD, DealStatus.LOST)) {
            "Can only delete deals in LEAD or LOST status, current: ${deal.status}"
        }

        dealRepository.deleteById(id)
        logger.info("Deleted deal: $id")
    }

    // ============================================
    // Status Transitions
    // ============================================

    /**
     * Advances a deal to the next stage.
     */
    fun advanceDeal(id: UUID): Deal {
        val deal = getDeal(id)
        deal.advance()
        val saved = dealRepository.save(deal)
        logger.info("Advanced deal ${deal.id} to ${deal.status}")
        return saved
    }

    /**
     * Qualifies a deal (LEAD -> QUALIFIED).
     */
    fun qualifyDeal(id: UUID): Deal {
        val deal = getDeal(id)
        deal.qualify()
        val saved = dealRepository.save(deal)
        logger.info("Qualified deal: ${deal.id}")
        return saved
    }

    /**
     * Sends a proposal (QUALIFIED -> PROPOSAL).
     */
    fun sendProposal(id: UUID): Deal {
        val deal = getDeal(id)
        deal.sendProposal()
        val saved = dealRepository.save(deal)
        logger.info("Sent proposal for deal: ${deal.id}")
        return saved
    }

    /**
     * Starts negotiation (PROPOSAL -> NEGOTIATION).
     */
    fun startNegotiation(id: UUID): Deal {
        val deal = getDeal(id)
        deal.startNegotiation()
        val saved = dealRepository.save(deal)
        logger.info("Started negotiation for deal: ${deal.id}")
        return saved
    }

    /**
     * Marks a deal as lost with a reason.
     */
    fun loseDeal(id: UUID, command: LoseDealCommand): Deal {
        val deal = getDeal(id)
        deal.lose(command.reason)
        val saved = dealRepository.save(deal)
        logger.info("Lost deal: ${deal.id}, reason: ${command.reason.en}")
        return saved
    }

    /**
     * Reopens a lost deal back to LEAD status.
     */
    fun reopenDeal(id: UUID): Deal {
        val deal = getDeal(id)
        deal.reopen()
        val saved = dealRepository.save(deal)
        logger.info("Reopened deal: ${deal.id}")
        return saved
    }

    /**
     * Reassigns a deal to another sales rep.
     */
    fun reassignDeal(id: UUID, command: ReassignDealCommand): Deal {
        val deal = getDeal(id)
        deal.reassign(command.newSalesRepId)
        val saved = dealRepository.save(deal)
        logger.info("Reassigned deal ${deal.id} to sales rep ${command.newSalesRepId}")
        return saved
    }

    // ============================================
    // Deal Conversion
    // ============================================

    /**
     * Converts a deal to a client.
     * Creates an organization, club, admin user, and optionally a subscription.
     */
    fun convertDeal(id: UUID, command: ConvertDealCommand): DealConversionResult {
        val deal = getDeal(id)

        require(deal.status == DealStatus.NEGOTIATION) {
            "Can only convert deals in NEGOTIATION status, current: ${deal.status}"
        }

        // Validate plan if provided
        if (command.clientPlanId != null && !planRepository.existsById(command.clientPlanId)) {
            throw NoSuchElementException("Client plan not found: ${command.clientPlanId}")
        }

        logger.info("Converting deal ${deal.id} to client: ${command.organizationName.en}")

        // Build onboarding command
        val onboardCommand = OnboardClientCommand(
            organizationName = command.organizationName,
            organizationTradeName = command.organizationTradeName,
            organizationType = command.organizationType,
            organizationEmail = command.organizationEmail,
            organizationPhone = command.organizationPhone,
            organizationWebsite = command.organizationWebsite,
            vatRegistrationNumber = command.vatRegistrationNumber,
            commercialRegistrationNumber = command.commercialRegistrationNumber,
            clubName = command.clubName,
            clubDescription = command.clubDescription,
            adminEmail = command.adminEmail,
            adminPassword = command.adminPassword,
            adminDisplayName = command.adminDisplayName,
            clientPlanId = command.clientPlanId,
            agreedPrice = command.agreedPrice,
            billingCycle = command.billingCycle,
            contractMonths = command.contractMonths,
            startWithTrial = command.startWithTrial,
            trialDays = command.trialDays,
            discountPercentage = command.discountPercentage,
            salesRepId = deal.salesRepId,
            dealId = deal.id
        )

        // Delegate to ClientOnboardingService
        val onboardingResult = clientOnboardingService.onboardClient(onboardCommand)

        // Mark deal as won
        deal.win(
            organizationId = onboardingResult.organization.id,
            subscriptionId = onboardingResult.subscription?.id
        )
        dealRepository.save(deal)

        logger.info("Deal ${deal.id} converted successfully. Organization: ${onboardingResult.organization.id}")

        return DealConversionResult(
            deal = deal,
            organization = onboardingResult.organization,
            club = onboardingResult.club,
            adminUser = onboardingResult.adminUser,
            subscription = onboardingResult.subscription
        )
    }

    // ============================================
    // Statistics
    // ============================================

    /**
     * Gets deal pipeline statistics.
     */
    @Transactional(readOnly = true)
    fun getDealStats(): DealStats {
        val totalDeals = dealRepository.count()
        val byStatus = DealStatus.entries.associateWith { dealRepository.countByStatus(it) }
        val openDeals = byStatus.filterKeys { it !in listOf(DealStatus.WON, DealStatus.LOST) }.values.sum()
        val wonDeals = byStatus[DealStatus.WON] ?: 0
        val lostDeals = byStatus[DealStatus.LOST] ?: 0

        // Calculate pipeline values
        val allDeals = dealRepository.findAll(Pageable.unpaged()).content
        val openDealsList = allDeals.filter { it.isOpen() }
        val wonDealsList = allDeals.filter { it.isWon() }

        val totalPipelineValue = openDealsList.fold(Money.ZERO) { acc, deal ->
            Money.of(acc.amount.add(deal.estimatedValue.amount), "SAR")
        }

        val weightedPipelineValue = openDealsList.fold(Money.ZERO) { acc, deal ->
            Money.of(acc.amount.add(deal.getWeightedValue().amount), "SAR")
        }

        val wonValue = wonDealsList.fold(Money.ZERO) { acc, deal ->
            Money.of(acc.amount.add(deal.estimatedValue.amount), "SAR")
        }

        val averageDealSize = if (wonDealsList.isNotEmpty()) {
            Money.of(
                wonValue.amount.divide(BigDecimal(wonDealsList.size), 2, RoundingMode.HALF_UP),
                "SAR"
            )
        } else Money.ZERO

        val winRate = if (wonDeals + lostDeals > 0) {
            wonDeals.toDouble() / (wonDeals + lostDeals).toDouble()
        } else 0.0

        // Count by source
        val bySource = DealSource.entries.associateWith { source ->
            dealRepository.findBySource(source, Pageable.unpaged()).totalElements
        }

        return DealStats(
            totalDeals = totalDeals,
            openDeals = openDeals,
            wonDeals = wonDeals,
            lostDeals = lostDeals,
            byStatus = byStatus,
            bySource = bySource,
            totalPipelineValue = totalPipelineValue,
            weightedPipelineValue = weightedPipelineValue,
            wonValue = wonValue,
            averageDealSize = averageDealSize,
            winRate = winRate
        )
    }

    /**
     * Gets deal statistics for a specific sales rep.
     */
    @Transactional(readOnly = true)
    fun getDealStatsForSalesRep(salesRepId: UUID): SalesRepDealStats {
        val totalDeals = dealRepository.countBySalesRepId(salesRepId)
        val openDeals = dealRepository.countOpenBySalesRepId(salesRepId)

        val allDeals = dealRepository.findBySalesRepId(salesRepId, Pageable.unpaged()).content
        val wonDeals = allDeals.filter { it.isWon() }.size.toLong()
        val lostDeals = allDeals.filter { it.isLost() }.size.toLong()

        val openDealsList = allDeals.filter { it.isOpen() }
        val pipelineValue = openDealsList.fold(Money.ZERO) { acc, deal ->
            Money.of(acc.amount.add(deal.estimatedValue.amount), "SAR")
        }

        val wonDealsList = allDeals.filter { it.isWon() }
        val wonValue = wonDealsList.fold(Money.ZERO) { acc, deal ->
            Money.of(acc.amount.add(deal.estimatedValue.amount), "SAR")
        }

        val winRate = if (wonDeals + lostDeals > 0) {
            wonDeals.toDouble() / (wonDeals + lostDeals).toDouble()
        } else 0.0

        return SalesRepDealStats(
            salesRepId = salesRepId,
            totalDeals = totalDeals,
            openDeals = openDeals,
            wonDeals = wonDeals,
            lostDeals = lostDeals,
            pipelineValue = pipelineValue,
            wonValue = wonValue,
            winRate = winRate
        )
    }
}

/**
 * Result of deal conversion to client.
 */
data class DealConversionResult(
    val deal: Deal,
    val organization: Organization,
    val club: Club,
    val adminUser: User,
    val subscription: ClientSubscription?
)

/**
 * Deal pipeline statistics.
 */
data class DealStats(
    val totalDeals: Long,
    val openDeals: Long,
    val wonDeals: Long,
    val lostDeals: Long,
    val byStatus: Map<DealStatus, Long>,
    val bySource: Map<DealSource, Long>,
    val totalPipelineValue: Money,
    val weightedPipelineValue: Money,
    val wonValue: Money,
    val averageDealSize: Money,
    val winRate: Double
)

/**
 * Deal statistics for a specific sales rep.
 */
data class SalesRepDealStats(
    val salesRepId: UUID,
    val totalDeals: Long,
    val openDeals: Long,
    val wonDeals: Long,
    val lostDeals: Long,
    val pipelineValue: Money,
    val wonValue: Money,
    val winRate: Double
)
