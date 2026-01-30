package com.liyaqa.trainer.api

import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.shared.domain.Money
import com.liyaqa.trainer.application.services.*
import com.liyaqa.trainer.domain.model.EarningStatus
import com.liyaqa.trainer.domain.model.TrainerClientStatus
import com.liyaqa.trainer.domain.ports.TrainerRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * REST controller for trainer portal dashboard.
 *
 * Endpoints:
 * - Get aggregated dashboard data
 */
@RestController
@RequestMapping("/api/trainer-portal")
@Tag(name = "Trainer Portal", description = "Trainer portal dashboard and aggregated data")
class TrainerPortalController(
    private val trainerService: TrainerService,
    private val trainerRepository: TrainerRepository,
    private val trainerDashboardService: TrainerDashboardService,
    private val trainerClientService: TrainerClientService,
    private val trainerEarningsService: TrainerEarningsService,
    private val trainerNotificationService: TrainerNotificationService,
    private val personalTrainingService: PersonalTrainingService,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(TrainerPortalController::class.java)

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "Get trainer dashboard", description = "Get aggregated dashboard data for a trainer")
    fun getDashboard(@RequestParam trainerId: UUID): ResponseEntity<TrainerDashboardResponse> {
        logger.debug("Fetching dashboard for trainer $trainerId")

        // Get trainer details
        val trainer = trainerService.getTrainer(trainerId)
        val user = userRepository.findById(trainer.userId).orElse(null)
        val specializations = trainerService.deserializeSpecializations(trainer.specializations)

        // Overview
        val overview = DashboardOverviewResponse(
            trainerName = user?.displayName?.get("en") ?: trainer.displayName?.get("en") ?: "Unknown",
            trainerStatus = trainer.status,
            profileImageUrl = trainer.profileImageUrl,
            trainerType = trainer.trainerType,
            specializations = specializations
        )

        // Earnings summary
        val earningsSummary = buildEarningsSummary(trainerId)

        // Schedule summary
        val scheduleSummary = buildScheduleSummary(trainerId)

        // Clients summary
        val clientsSummary = buildClientsSummary(trainerId)

        // Notifications summary
        val notificationsSummary = buildNotificationsSummary(trainerId)

        val dashboard = TrainerDashboardResponse(
            trainerId = trainerId,
            overview = overview,
            earnings = earningsSummary,
            schedule = scheduleSummary,
            clients = clientsSummary,
            notifications = notificationsSummary
        )

        return ResponseEntity.ok(dashboard)
    }

    private fun buildEarningsSummary(trainerId: UUID): EarningsSummaryResponse {
        val today = LocalDate.now()
        val currentMonthStart = today.withDayOfMonth(1)
        val lastMonthStart = today.minusMonths(1).withDayOfMonth(1)
        val lastMonthEnd = currentMonthStart.minusDays(1)

        // Get all earnings for the last 12 months
        val startDate = today.minusMonths(12)
        val allEarnings = trainerEarningsService.getEarningsByDateRange(
            trainerId, startDate, today, PageRequest.of(0, 10000)
        ).content

        val currency = allEarnings.firstOrNull()?.netAmount?.currency ?: "SAR"

        // Calculate totals
        val totalEarnings = Money(allEarnings.sumOf { it.netAmount.amount }, currency)
        val pendingEarnings = Money(
            allEarnings.filter { it.status == EarningStatus.PENDING }.sumOf { it.netAmount.amount },
            currency
        )
        val approvedEarnings = Money(
            allEarnings.filter { it.status == EarningStatus.APPROVED }.sumOf { it.netAmount.amount },
            currency
        )
        val paidEarnings = Money(
            allEarnings.filter { it.status == EarningStatus.PAID }.sumOf { it.netAmount.amount },
            currency
        )

        // Current month
        val currentMonthEarnings = Money(
            allEarnings.filter { it.earningDate >= currentMonthStart }.sumOf { it.netAmount.amount },
            currency
        )

        // Last month
        val lastMonthEarnings = Money(
            allEarnings.filter { it.earningDate >= lastMonthStart && it.earningDate <= lastMonthEnd }
                .sumOf { it.netAmount.amount },
            currency
        )

        // By type
        val byType = allEarnings.groupBy { it.earningType }
            .mapValues { (_, earnings) ->
                Money(earnings.sumOf { it.netAmount.amount }, currency)
            }

        // Recent earnings
        val recentEarnings = allEarnings
            .sortedByDescending { it.earningDate }
            .take(5)
            .map { TrainerEarningsResponse.from(it) }

        return EarningsSummaryResponse(
            totalEarnings = totalEarnings,
            pendingEarnings = pendingEarnings,
            approvedEarnings = approvedEarnings,
            paidEarnings = paidEarnings,
            currentMonthEarnings = currentMonthEarnings,
            lastMonthEarnings = lastMonthEarnings,
            earningsByType = byType,
            recentEarnings = recentEarnings
        )
    }

    private fun buildScheduleSummary(trainerId: UUID): ScheduleSummaryResponse {
        val today = LocalDate.now()
        val currentMonthStart = today.withDayOfMonth(1)
        val futureDate = today.plusDays(30)

        // Today's sessions
        val todaySessions = personalTrainingService.getTrainerSessionsOnDate(trainerId, today)

        // Upcoming sessions (next 30 days)
        val upcomingSessions = personalTrainingService.getTrainerSessionsBetweenDates(
            trainerId, today, futureDate, PageRequest.of(0, 1000)
        ).content

        // Completed this month
        val completedThisMonth = personalTrainingService.getTrainerSessionsBetweenDates(
            trainerId, currentMonthStart, today, PageRequest.of(0, 10000)
        ).content.count { it.status == com.liyaqa.trainer.domain.model.PTSessionStatus.COMPLETED }

        // Next session
        val nextSession = upcomingSessions.firstOrNull()?.let { session ->
            UpcomingSessionResponse(
                sessionId = session.id,
                sessionType = "PT",
                sessionDate = session.sessionDate,
                startTime = session.startTime,
                endTime = session.endTime,
                clientName = null,
                className = null,
                location = null,
                status = session.status.name
            )
        }

        return ScheduleSummaryResponse(
            todaysSessions = todaySessions.size,
            upcomingSessions = upcomingSessions.size,
            completedThisMonth = completedThisMonth,
            nextSession = nextSession
        )
    }

    private fun buildClientsSummary(trainerId: UUID): ClientsSummaryResponse {
        val allClients = trainerClientService.getClientsForTrainer(trainerId, PageRequest.of(0, 10000)).content

        val today = LocalDate.now()
        val currentMonthStart = today.withDayOfMonth(1)

        val totalClients = allClients.size
        val activeClients = allClients.count { it.status == TrainerClientStatus.ACTIVE }
        val newThisMonth = allClients.count { it.startDate >= currentMonthStart }

        return ClientsSummaryResponse(
            totalClients = totalClients,
            activeClients = activeClients,
            newThisMonth = newThisMonth
        )
    }

    private fun buildNotificationsSummary(trainerId: UUID): NotificationsSummaryResponse {
        val unreadCount = trainerNotificationService.getUnreadNotifications(
            trainerId,
            PageRequest.of(0, 1)
        ).totalElements

        val recentNotifications = trainerNotificationService.getNotificationsForTrainer(
            trainerId,
            PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).content.map { TrainerNotificationResponse.from(it) }

        val totalCount = trainerNotificationService.getNotificationsForTrainer(
            trainerId,
            PageRequest.of(0, 1)
        ).totalElements

        return NotificationsSummaryResponse(
            unreadCount = unreadCount.toInt(),
            totalCount = totalCount.toInt(),
            recent = recentNotifications
        )
    }
}
