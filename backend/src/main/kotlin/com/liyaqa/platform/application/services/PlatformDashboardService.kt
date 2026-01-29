package com.liyaqa.platform.application.services

import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.platform.api.dto.ClientGrowthResponse
import com.liyaqa.platform.api.dto.DealPipelineOverviewResponse
import com.liyaqa.platform.api.dto.ExpiringClientSubscriptionResponse
import com.liyaqa.platform.api.dto.HealthAlertResponse
import com.liyaqa.platform.api.dto.MonthlyRevenueResponse
import com.liyaqa.platform.api.dto.PlatformDashboardResponse
import com.liyaqa.platform.api.dto.PlatformHealthResponse
import com.liyaqa.platform.api.dto.PlatformRevenueResponse
import com.liyaqa.platform.api.dto.PlatformSummaryResponse
import com.liyaqa.platform.api.dto.RecentActivityResponse
import com.liyaqa.platform.api.dto.TopClientResponse
import com.liyaqa.platform.domain.model.ClientInvoiceStatus
import com.liyaqa.platform.domain.model.ClientSubscriptionStatus
import com.liyaqa.platform.domain.model.DealStatus
import com.liyaqa.platform.domain.ports.ClientInvoiceRepository
import com.liyaqa.platform.domain.ports.ClientPlanRepository
import com.liyaqa.platform.domain.ports.ClientSubscriptionRepository
import com.liyaqa.platform.domain.ports.DealRepository
import com.liyaqa.shared.infrastructure.audit.AuditLogRepository
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.ZonedDateTime
import java.time.format.TextStyle
import java.time.temporal.ChronoUnit
import java.util.Locale

/**
 * Service for platform dashboard metrics and analytics.
 * Provides aggregated data for the internal team dashboard.
 */
@Service
@Transactional(readOnly = true)
class PlatformDashboardService(
    private val organizationRepository: OrganizationRepository,
    private val clientSubscriptionRepository: ClientSubscriptionRepository,
    private val clientInvoiceRepository: ClientInvoiceRepository,
    private val clientPlanRepository: ClientPlanRepository,
    private val dealRepository: DealRepository,
    private val auditLogRepository: AuditLogRepository
) {
    companion object {
        private const val DEFAULT_CURRENCY = "SAR"
    }

    /**
     * Gets the complete dashboard response with all metrics.
     * Cached for 5 minutes to reduce database load.
     *
     * @param timezone Timezone for date calculations (default: Asia/Riyadh)
     * @param startDate Optional start date for filtering (ISO format: yyyy-MM-dd)
     * @param endDate Optional end date for filtering (ISO format: yyyy-MM-dd)
     */
    @Cacheable(
        value = ["platformDashboard"],
        key = "'dashboard-' + #timezone + '-' + #startDate + '-' + #endDate",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getDashboard(
        timezone: String = "Asia/Riyadh",
        startDate: String? = null,
        endDate: String? = null
    ): PlatformDashboardResponse {
        return PlatformDashboardResponse(
            summary = getSummary(),
            revenue = getRevenue(timezone, startDate, endDate),
            growth = getClientGrowth(),
            dealPipeline = getDealPipeline(),
            expiringSubscriptions = getExpiringSubscriptions(30),
            topClients = getTopClients(5),
            recentActivity = getRecentActivity(10)
        )
    }

    /**
     * Gets summary statistics.
     * Cached for 5 minutes to reduce database load.
     */
    @Cacheable(
        value = ["platformDashboard"],
        key = "'summary'",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getSummary(): PlatformSummaryResponse {
        val today = LocalDate.now()
        val monthStart = today.withDayOfMonth(1)

        // Client counts
        val totalClients = organizationRepository.count()
        val activeClients = organizationRepository.countByStatus(OrganizationStatus.ACTIVE)
        val pendingClients = organizationRepository.countByStatus(OrganizationStatus.PENDING)
        val suspendedClients = organizationRepository.countByStatus(OrganizationStatus.SUSPENDED)

        // Subscription counts
        val totalSubscriptions = clientSubscriptionRepository.count()
        val activeSubscriptions = clientSubscriptionRepository.countByStatus(ClientSubscriptionStatus.ACTIVE)
        val trialSubscriptions = clientSubscriptionRepository.countByStatus(ClientSubscriptionStatus.TRIAL)
        val expiringDate = today.plusDays(30)
        val expiringSubscriptions = clientSubscriptionRepository.findExpiring(
            expiringDate,
            listOf(ClientSubscriptionStatus.ACTIVE, ClientSubscriptionStatus.TRIAL)
        ).size.toLong()

        // Deal counts
        val totalDeals = dealRepository.count()
        val openDeals = dealRepository.getOpenDeals(Pageable.unpaged()).totalElements
        val wonDealsThisMonth = dealRepository.countByStatusAndCreatedAfter(
            DealStatus.WON,
            monthStart.atStartOfDay().toInstant(ZoneOffset.UTC)
        )
        val lostDealsThisMonth = dealRepository.countByStatusAndCreatedAfter(
            DealStatus.LOST,
            monthStart.atStartOfDay().toInstant(ZoneOffset.UTC)
        )

        // Invoice counts
        val totalInvoices = clientInvoiceRepository.count()
        val unpaidInvoices = clientInvoiceRepository.countByStatus(ClientInvoiceStatus.ISSUED) +
            clientInvoiceRepository.countByStatus(ClientInvoiceStatus.PARTIALLY_PAID)
        val overdueInvoices = clientInvoiceRepository.countByStatus(ClientInvoiceStatus.OVERDUE)

        return PlatformSummaryResponse(
            totalClients = totalClients,
            activeClients = activeClients,
            pendingClients = pendingClients,
            suspendedClients = suspendedClients,
            totalSubscriptions = totalSubscriptions,
            activeSubscriptions = activeSubscriptions,
            trialSubscriptions = trialSubscriptions,
            expiringSubscriptions = expiringSubscriptions,
            totalDeals = totalDeals,
            openDeals = openDeals,
            wonDealsThisMonth = wonDealsThisMonth,
            lostDealsThisMonth = lostDealsThisMonth,
            totalInvoices = totalInvoices,
            unpaidInvoices = unpaidInvoices,
            overdueInvoices = overdueInvoices
        )
    }

    /**
     * Gets revenue metrics using optimized aggregation queries.
     * Cached for 5 minutes to reduce database load.
     *
     * @param timezone Timezone for date calculations (e.g., "Asia/Riyadh", "UTC")
     * @param startDate Optional start date for filtering (ISO format: yyyy-MM-dd)
     * @param endDate Optional end date for filtering (ISO format: yyyy-MM-dd)
     */
    @Cacheable(
        value = ["platformDashboard"],
        key = "'revenue-' + #timezone + '-' + #startDate + '-' + #endDate",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getRevenue(
        timezone: String = "Asia/Riyadh",
        startDate: String? = null,
        endDate: String? = null
    ): PlatformRevenueResponse {
        // Get current date in the specified timezone
        val zoneId = try {
            ZoneId.of(timezone)
        } catch (e: Exception) {
            ZoneId.of("Asia/Riyadh") // Fallback to default
        }
        val today = ZonedDateTime.now(zoneId).toLocalDate()

        // Parse custom date range if provided
        val filterStartDate = startDate?.let { LocalDate.parse(it) }
        val filterEndDate = endDate?.let { LocalDate.parse(it) }

        // Calculate date ranges (use custom range if provided, otherwise use default ranges)
        val thisMonthStart = filterStartDate ?: today.withDayOfMonth(1)
        val thisMonthEnd = filterEndDate ?: today.withDayOfMonth(today.lengthOfMonth())
        val lastMonthStart = thisMonthStart.minusMonths(1)
        val lastMonthEnd = lastMonthStart.withDayOfMonth(lastMonthStart.lengthOfMonth())
        val yearStart = today.withDayOfYear(1)

        // Use aggregation queries - single database call per metric (no memory loading)
        val totalRevenue = clientInvoiceRepository.getTotalPaidRevenue()
        val revenueThisMonth = clientInvoiceRepository.getRevenueByDateRange(thisMonthStart, thisMonthEnd)
        val revenueLastMonth = clientInvoiceRepository.getRevenueByDateRange(lastMonthStart, lastMonthEnd)
        val revenueThisYear = clientInvoiceRepository.getRevenueByDateRange(yearStart, today)

        // Calculate MRR from active subscriptions
        val activeSubscriptions = clientSubscriptionRepository.findByStatus(
            ClientSubscriptionStatus.ACTIVE,
            Pageable.unpaged()
        ).content
        val mrr = activeSubscriptions.sumOf { it.getEffectiveMonthlyPrice().amount }

        // Calculate average revenue per client
        val activeClientCount = organizationRepository.countByStatus(OrganizationStatus.ACTIVE)
        val averageRevenuePerClient = if (activeClientCount > 0) {
            totalRevenue.divide(BigDecimal(activeClientCount), 2, RoundingMode.HALF_UP)
        } else {
            BigDecimal.ZERO
        }

        // Use aggregation queries for outstanding and overdue amounts (no memory loading)
        val outstandingAmount = clientInvoiceRepository.getTotalOutstandingAmount()
        val overdueAmount = clientInvoiceRepository.getTotalOverdueAmount()

        // Calculate collection rate (paid / (paid + outstanding))
        val totalBilled = totalRevenue + outstandingAmount + overdueAmount
        val collectionRate = if (totalBilled > BigDecimal.ZERO) {
            totalRevenue.divide(totalBilled, 4, RoundingMode.HALF_UP).multiply(BigDecimal(100))
        } else {
            BigDecimal(100)
        }

        return PlatformRevenueResponse(
            totalRevenue = totalRevenue,
            revenueThisMonth = revenueThisMonth,
            revenueLastMonth = revenueLastMonth,
            revenueThisYear = revenueThisYear,
            monthlyRecurringRevenue = mrr,
            averageRevenuePerClient = averageRevenuePerClient,
            outstandingAmount = outstandingAmount,
            overdueAmount = overdueAmount,
            collectionRate = collectionRate.setScale(2, RoundingMode.HALF_UP),
            currency = DEFAULT_CURRENCY
        )
    }

    /**
     * Gets monthly revenue breakdown using optimized aggregation queries.
     * Cached for 5 minutes to reduce database load.
     */
    @Cacheable(
        value = ["platformDashboard"],
        key = "'monthlyRevenue-' + #months",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getMonthlyRevenue(months: Int = 12): List<MonthlyRevenueResponse> {
        val result = mutableListOf<MonthlyRevenueResponse>()
        val today = LocalDate.now()

        for (i in (months - 1) downTo 0) {
            val month = today.minusMonths(i.toLong())
            val yearMonth = YearMonth.of(month.year, month.month)

            // Calculate date range for this month (database-agnostic)
            val startOfMonth = yearMonth.atDay(1)
            val startOfNextMonth = yearMonth.plusMonths(1).atDay(1)

            // Use date range parameters instead of FUNCTION('MONTH'/YEAR') for PostgreSQL compatibility
            val revenue = clientInvoiceRepository.getRevenueByMonth(startOfMonth, startOfNextMonth)
            val invoiceCount = clientInvoiceRepository.getInvoiceCountByMonth(startOfMonth, startOfNextMonth)

            result.add(
                MonthlyRevenueResponse(
                    year = yearMonth.year,
                    month = yearMonth.monthValue,
                    monthName = yearMonth.month.getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                    revenue = revenue,
                    invoiceCount = invoiceCount,
                    currency = DEFAULT_CURRENCY
                )
            )
        }

        return result
    }

    /**
     * Gets client growth metrics.
     * Cached for 5 minutes to reduce database load.
     */
    @Cacheable(
        value = ["platformDashboard"],
        key = "'growth'",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getClientGrowth(): ClientGrowthResponse {
        val today = LocalDate.now()
        val thisMonthStart = today.withDayOfMonth(1)
        val lastMonthStart = thisMonthStart.minusMonths(1)
        val lastMonthEnd = lastMonthStart.withDayOfMonth(lastMonthStart.lengthOfMonth())

        val newClientsThisMonth = organizationRepository.countCreatedAfter(
            thisMonthStart.atStartOfDay().toInstant(ZoneOffset.UTC)
        )
        val newClientsLastMonth = organizationRepository.countCreatedBetween(
            lastMonthStart.atStartOfDay().toInstant(ZoneOffset.UTC),
            lastMonthEnd.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        )

        // Count churned clients (subscriptions that were cancelled or expired this month)
        val churnedThisMonth = clientSubscriptionRepository.findByStatus(
            ClientSubscriptionStatus.CANCELLED,
            Pageable.unpaged()
        ).content.count { subscription ->
            subscription.updatedAt?.let { updatedAt ->
                val updatedDate = updatedAt.atZone(ZoneOffset.UTC).toLocalDate()
                updatedDate >= thisMonthStart
            } ?: false
        }.toLong()

        val netGrowth = newClientsThisMonth - churnedThisMonth

        val growthRate = if (newClientsLastMonth > 0) {
            BigDecimal((newClientsThisMonth - newClientsLastMonth) * 100)
                .divide(BigDecimal(newClientsLastMonth), 2, RoundingMode.HALF_UP)
        } else {
            if (newClientsThisMonth > 0) BigDecimal(100) else BigDecimal.ZERO
        }

        return ClientGrowthResponse(
            newClientsThisMonth = newClientsThisMonth,
            newClientsLastMonth = newClientsLastMonth,
            churnedClientsThisMonth = churnedThisMonth,
            netGrowthThisMonth = netGrowth,
            growthRate = growthRate
        )
    }

    /**
     * Gets deal pipeline overview.
     * Cached for 5 minutes to reduce database load.
     */
    @Cacheable(
        value = ["platformDashboard"],
        key = "'dealPipeline'",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getDealPipeline(): DealPipelineOverviewResponse {
        val stats = dealRepository.getDealStats()

        return DealPipelineOverviewResponse(
            leads = stats.leads,
            qualified = stats.qualified,
            proposal = stats.proposal,
            negotiation = stats.negotiation,
            totalValue = stats.totalValue,
            weightedValue = stats.weightedValue,
            currency = DEFAULT_CURRENCY
        )
    }

    /**
     * Gets expiring subscriptions.
     * Cached for 5 minutes to reduce database load.
     * Uses batch fetching to avoid N+1 queries.
     */
    @Cacheable(
        value = ["platformDashboard"],
        key = "'expiring-' + #daysAhead",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getExpiringSubscriptions(daysAhead: Int): List<ExpiringClientSubscriptionResponse> {
        val expiryDate = LocalDate.now().plusDays(daysAhead.toLong())
        val expiring = clientSubscriptionRepository.findExpiring(
            expiryDate,
            listOf(ClientSubscriptionStatus.ACTIVE, ClientSubscriptionStatus.TRIAL)
        )

        if (expiring.isEmpty()) {
            return emptyList()
        }

        // Batch fetch all organizations and plans to avoid N+1 queries
        val orgIds = expiring.map { it.organizationId }.distinct()
        val planIds = expiring.map { it.clientPlanId }.distinct()

        val organizationsMap = organizationRepository.findAllById(orgIds).associateBy { it.id }
        val plansMap = clientPlanRepository.findAllById(planIds).associateBy { it.id }

        val today = LocalDate.now()

        return expiring.map { subscription ->
            val organization = organizationsMap[subscription.organizationId]
            val plan = plansMap[subscription.clientPlanId]
            val daysUntil = ChronoUnit.DAYS.between(today, subscription.endDate)

            ExpiringClientSubscriptionResponse(
                subscriptionId = subscription.id,
                organizationId = subscription.organizationId,
                organizationNameEn = organization?.name?.en ?: "Unknown",
                organizationNameAr = organization?.name?.ar,
                planNameEn = plan?.name?.en ?: "Unknown",
                planNameAr = plan?.name?.ar,
                endDate = subscription.endDate,
                daysUntilExpiry = daysUntil,
                agreedPrice = subscription.agreedPrice.amount,
                currency = subscription.agreedPrice.currency,
                autoRenew = subscription.autoRenew,
                salesRepId = subscription.salesRepId
            )
        }.sortedBy { it.daysUntilExpiry }
    }

    /**
     * Gets top clients by revenue using optimized aggregation queries.
     * Cached for 5 minutes to reduce database load.
     * Uses batch fetching to avoid N+1 queries.
     */
    @Cacheable(
        value = ["platformDashboard"],
        key = "'topClients-' + #limit",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getTopClients(limit: Int): List<TopClientResponse> {
        // Use aggregation queries - get revenue grouped by organization (no memory loading)
        val revenueByOrg = clientInvoiceRepository.getRevenueByOrganization()
        val invoiceCountByOrg = clientInvoiceRepository.getInvoiceCountByOrganization()

        // Get top organization IDs first
        val topOrgIds = revenueByOrg.entries
            .sortedByDescending { it.value }
            .take(limit)
            .map { it.key }

        if (topOrgIds.isEmpty()) {
            return emptyList()
        }

        // Batch fetch all organizations and subscriptions to avoid N+1 queries
        val organizationsMap = organizationRepository.findAllById(topOrgIds).associateBy { it.id }
        val subscriptionsMap = clientSubscriptionRepository.findActiveByOrganizationIds(topOrgIds)
            .associateBy { it.organizationId }

        return topOrgIds.mapNotNull { orgId ->
            val organization = organizationsMap[orgId] ?: return@mapNotNull null
            val subscription = subscriptionsMap[orgId]

            TopClientResponse(
                organizationId = orgId,
                organizationNameEn = organization.name.en,
                organizationNameAr = organization.name.ar,
                totalRevenue = revenueByOrg[orgId] ?: BigDecimal.ZERO,
                invoiceCount = invoiceCountByOrg[orgId] ?: 0L,
                subscriptionStatus = subscription?.status?.name ?: "NONE",
                currency = DEFAULT_CURRENCY
            )
        }
    }

    /**
     * Gets recent platform activity.
     * Cached for 5 minutes to reduce database load.
     */
    @Cacheable(
        value = ["platformDashboard"],
        key = "'activity-' + #limit",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getRecentActivity(limit: Int): List<RecentActivityResponse> {
        val pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        val auditLogs = auditLogRepository.findAll(pageable)

        return auditLogs.content.map { log ->
            RecentActivityResponse(
                activityType = log.action.name,
                description = log.description ?: "${log.action.name} on ${log.entityType}",
                entityId = log.entityId,
                entityType = log.entityType,
                timestamp = log.createdAt,
                userId = log.userId,
                userEmail = log.userEmail
            )
        }
    }

    /**
     * Gets platform health indicators.
     * Cached for 5 minutes to reduce database load.
     */
    @Cacheable(
        value = ["platformDashboard"],
        key = "'health'",
        cacheManager = "platformDashboardCacheManager"
    )
    fun getHealth(): PlatformHealthResponse {
        val alerts = mutableListOf<HealthAlertResponse>()

        // Check overdue invoices
        val overdueCount = clientInvoiceRepository.countByStatus(ClientInvoiceStatus.OVERDUE)
        if (overdueCount > 0) {
            alerts.add(
                HealthAlertResponse(
                    severity = if (overdueCount > 10) "HIGH" else "MEDIUM",
                    title = "Overdue Invoices",
                    description = "$overdueCount invoices are past due",
                    count = overdueCount,
                    actionUrl = "/platform/invoices?status=OVERDUE"
                )
            )
        }

        // Check expiring subscriptions
        val expiringCount = getExpiringSubscriptions(7).size.toLong()
        if (expiringCount > 0) {
            alerts.add(
                HealthAlertResponse(
                    severity = "MEDIUM",
                    title = "Expiring Subscriptions",
                    description = "$expiringCount subscriptions expiring in 7 days",
                    count = expiringCount,
                    actionUrl = "/platform/subscriptions?expiring=7"
                )
            )
        }

        // Check pending clients
        val pendingCount = organizationRepository.countByStatus(OrganizationStatus.PENDING)
        if (pendingCount > 0) {
            alerts.add(
                HealthAlertResponse(
                    severity = "LOW",
                    title = "Pending Activations",
                    description = "$pendingCount clients awaiting activation",
                    count = pendingCount,
                    actionUrl = "/platform/clients?status=PENDING"
                )
            )
        }

        // Calculate health scores
        val revenue = getRevenue()
        val summary = getSummary()

        // Payment health: based on collection rate
        val paymentHealthScore = revenue.collectionRate

        // Subscription health: active vs total
        val subscriptionHealthScore = if (summary.totalSubscriptions > 0) {
            BigDecimal((summary.activeSubscriptions + summary.trialSubscriptions) * 100)
                .divide(BigDecimal(summary.totalSubscriptions), 2, RoundingMode.HALF_UP)
        } else {
            BigDecimal(100)
        }

        // Client health: active vs total
        val clientHealthScore = if (summary.totalClients > 0) {
            BigDecimal(summary.activeClients * 100)
                .divide(BigDecimal(summary.totalClients), 2, RoundingMode.HALF_UP)
        } else {
            BigDecimal(100)
        }

        // Overall health: weighted average
        val overallHealthScore = (paymentHealthScore + subscriptionHealthScore + clientHealthScore)
            .divide(BigDecimal(3), 2, RoundingMode.HALF_UP)

        return PlatformHealthResponse(
            clientHealthScore = clientHealthScore,
            paymentHealthScore = paymentHealthScore,
            subscriptionHealthScore = subscriptionHealthScore,
            overallHealthScore = overallHealthScore,
            alerts = alerts
        )
    }
}
