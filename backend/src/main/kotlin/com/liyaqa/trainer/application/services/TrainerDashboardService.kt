package com.liyaqa.trainer.application.services

import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.trainer.domain.model.EarningStatus
import com.liyaqa.trainer.domain.model.PTSessionStatus
import com.liyaqa.trainer.domain.model.TrainerClientStatus
import com.liyaqa.trainer.domain.ports.*
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Service for aggregating trainer dashboard metrics.
 *
 * Handles:
 * - Complete dashboard data aggregation for trainer portal home page
 * - Upcoming sessions summary (next 7 days)
 * - Pending earnings summary
 * - Session statistics (completion rate, counts by status)
 * - Earnings statistics by type
 * - Client statistics
 * - Recent activity feed
 *
 * Integration points:
 * - Used by trainer portal frontend for dashboard display
 * - Aggregates data from all 6 repositories
 *
 * Pattern: Pure read-only aggregation, no writes
 */
@Service
@Transactional(readOnly = true)
class TrainerDashboardService(
    private val trainerRepository: TrainerRepository,
    private val ptSessionRepository: PersonalTrainingSessionRepository,
    private val classSessionRepository: ClassSessionRepository,
    private val clientRepository: TrainerClientRepository,
    private val earningsRepository: TrainerEarningsRepository,
    private val notificationRepository: TrainerNotificationRepository
) {
    private val logger = LoggerFactory.getLogger(TrainerDashboardService::class.java)

    // ==================== COMPLETE DASHBOARD ====================

    /**
     * Get complete dashboard data for a trainer.
     * Single method that returns all metrics needed for the home page.
     *
     * @param trainerId The trainer ID
     * @param dateRange Optional date range for statistics (defaults to last 30 days)
     * @return Complete dashboard data
     */
    fun getDashboard(trainerId: UUID, dateRange: DateRange? = null): TrainerDashboard {
        val range = dateRange ?: DateRange.last30Days()

        logger.debug("Fetching dashboard for trainer $trainerId (range: ${range.startDate} to ${range.endDate})")

        return TrainerDashboard(
            trainerId = trainerId,
            upcomingSessions = getUpcomingSessionsSummary(trainerId),
            todaySchedule = getTodaySchedule(trainerId),
            sessionStats = getSessionStats(trainerId, range.startDate, range.endDate),
            earningsStats = getEarningsStats(trainerId, range.startDate, range.endDate),
            clientStats = getClientStats(trainerId),
            recentActivity = getRecentActivity(trainerId, limit = 10),
            unreadNotifications = notificationRepository.countUnreadByTrainerId(trainerId)
        )
    }

    // ==================== UPCOMING SESSIONS ====================

    /**
     * Get summary of upcoming sessions (next 7 days).
     */
    fun getUpcomingSessionsSummary(trainerId: UUID): UpcomingSessionsSummary {
        val today = LocalDate.now()
        val next7Days = today.plusDays(7)

        // Fetch upcoming PT sessions
        val upcomingPT = ptSessionRepository.findByTrainerIdAndSessionDateBetween(
            trainerId = trainerId,
            startDate = today,
            endDate = next7Days,
            pageable = PageRequest.of(0, 100)
        ).content.filter { it.status == PTSessionStatus.CONFIRMED || it.status == PTSessionStatus.IN_PROGRESS }

        // Fetch upcoming class sessions
        val upcomingClasses = try {
            classSessionRepository.findByTrainerId(trainerId, PageRequest.of(0, 100)).content
                .filter { it.sessionDate in today..next7Days }
        } catch (e: Exception) {
            logger.warn("Failed to fetch upcoming classes: ${e.message}")
            emptyList()
        }

        // Fetch pending PT requests
        val pendingRequests = ptSessionRepository.findPendingByTrainerId(trainerId, PageRequest.of(0, 20)).content

        return UpcomingSessionsSummary(
            totalPTSessions = upcomingPT.size,
            totalClassSessions = upcomingClasses.size,
            pendingRequests = pendingRequests.size,
            nextSession = (upcomingPT + upcomingClasses.map { null }).minByOrNull { upcomingPT.firstOrNull()?.sessionDate ?: LocalDate.MAX }
                ?.let { NextSessionInfo(it.sessionDate, it.startTime, "PT Session") }
        )
    }

    /**
     * Get today's schedule items.
     */
    fun getTodaySchedule(trainerId: UUID): List<TodayScheduleItem> {
        val today = LocalDate.now()

        // PT sessions today
        val ptSessions = ptSessionRepository.findByTrainerIdAndSessionDate(trainerId, today)
            .filter { it.status == PTSessionStatus.CONFIRMED || it.status == PTSessionStatus.IN_PROGRESS }
            .map { session ->
                TodayScheduleItem(
                    type = "PT_SESSION",
                    time = session.startTime.toString(),
                    title = "Personal Training",
                    memberId = session.memberId,
                    status = session.status.name
                )
            }

        // Class sessions today
        val classSessions = try {
            classSessionRepository.findByTrainerId(trainerId, PageRequest.of(0, 20)).content
                .filter { it.sessionDate == today }
                .map { session ->
                    TodayScheduleItem(
                        type = "CLASS_SESSION",
                        time = session.startTime.toString(),
                        title = "Group Class", // Will need to join with GymClass to get name
                        memberId = null,
                        status = session.status.name
                    )
                }
        } catch (e: Exception) {
            logger.warn("Failed to fetch class sessions for today: ${e.message}")
            emptyList()
        }

        return (ptSessions + classSessions).sortedBy { it.time }
    }

    // ==================== SESSION STATISTICS ====================

    /**
     * Get session statistics for a date range.
     */
    fun getSessionStats(trainerId: UUID, startDate: LocalDate, endDate: LocalDate): SessionStats {
        val sessions = ptSessionRepository.findByTrainerIdAndSessionDateBetween(
            trainerId = trainerId,
            startDate = startDate,
            endDate = endDate,
            pageable = PageRequest.of(0, 1000)
        ).content

        val total = sessions.size
        val completed = sessions.count { it.status == PTSessionStatus.COMPLETED }
        val cancelled = sessions.count { it.status == PTSessionStatus.CANCELLED }
        val noShows = sessions.count { it.status == PTSessionStatus.NO_SHOW }
        val pending = sessions.count { it.status == PTSessionStatus.REQUESTED }
        val confirmed = sessions.count { it.status == PTSessionStatus.CONFIRMED }

        val completionRate = if (total > 0) {
            (completed.toDouble() / total.toDouble()) * 100
        } else {
            0.0
        }

        return SessionStats(
            total = total,
            completed = completed,
            cancelled = cancelled,
            noShows = noShows,
            pending = pending,
            confirmed = confirmed,
            completionRate = completionRate
        )
    }

    // ==================== EARNINGS STATISTICS ====================

    /**
     * Get earnings statistics for a date range.
     */
    fun getEarningsStats(trainerId: UUID, startDate: LocalDate, endDate: LocalDate): EarningsStats {
        val earnings = earningsRepository.findByTrainerIdAndEarningDateBetween(
            trainerId = trainerId,
            startDate = startDate,
            endDate = endDate,
            pageable = PageRequest.of(0, 1000)
        ).content

        val totalPending = earnings.filter { it.status == EarningStatus.PENDING }
            .sumOf { it.netAmount.amount }

        val totalApproved = earnings.filter { it.status == EarningStatus.APPROVED }
            .sumOf { it.netAmount.amount }

        val totalPaid = earnings.filter { it.status == EarningStatus.PAID }
            .sumOf { it.netAmount.amount }

        val totalDisputed = earnings.filter { it.status == EarningStatus.DISPUTED }
            .sumOf { it.netAmount.amount }

        val byType = earnings.groupBy { it.earningType }
            .mapValues { (_, earningList) ->
                earningList.sumOf { it.netAmount.amount }
            }

        // Calculate lifetime total (all time PAID)
        val lifetimeTotal = earningsRepository.calculateTotalEarnings(trainerId, EarningStatus.PAID)

        return EarningsStats(
            pendingAmount = totalPending,
            approvedAmount = totalApproved,
            paidAmount = totalPaid,
            disputedAmount = totalDisputed,
            lifetimeTotal = lifetimeTotal,
            byType = byType,
            currency = earnings.firstOrNull()?.netAmount?.currency ?: "SAR"
        )
    }

    /**
     * Get pending earnings summary (PENDING + APPROVED).
     */
    fun getPendingEarningsSummary(trainerId: UUID): PendingEarningsSummary {
        val pending = earningsRepository.findPendingPaymentByTrainerId(trainerId, PageRequest.of(0, 100)).content

        val totalAmount = pending.sumOf { it.netAmount.amount }
        val pendingCount = pending.count { it.status == EarningStatus.PENDING }
        val approvedCount = pending.count { it.status == EarningStatus.APPROVED }

        return PendingEarningsSummary(
            totalAmount = totalAmount,
            pendingCount = pendingCount,
            approvedCount = approvedCount,
            currency = pending.firstOrNull()?.netAmount?.currency ?: "SAR"
        )
    }

    // ==================== CLIENT STATISTICS ====================

    /**
     * Get client statistics for a trainer.
     */
    fun getClientStats(trainerId: UUID): ClientStats {
        val allClients = clientRepository.findByTrainerId(trainerId, PageRequest.of(0, 1000)).content

        val total = allClients.size
        val active = allClients.count { it.status == TrainerClientStatus.ACTIVE }
        val onHold = allClients.count { it.status == TrainerClientStatus.ON_HOLD }
        val completed = allClients.count { it.status == TrainerClientStatus.COMPLETED }
        val inactive = allClients.count { it.status == TrainerClientStatus.INACTIVE }

        return ClientStats(
            total = total,
            active = active,
            onHold = onHold,
            completed = completed,
            inactive = inactive
        )
    }

    // ==================== RECENT ACTIVITY ====================

    /**
     * Get recent activity feed (latest completed sessions, new clients, earnings).
     */
    fun getRecentActivity(trainerId: UUID, limit: Int = 10): List<ActivityItem> {
        val activities = mutableListOf<ActivityItem>()

        // Recent completed PT sessions
        val recentSessions = ptSessionRepository.findByTrainerIdAndStatus(
            trainerId = trainerId,
            status = PTSessionStatus.COMPLETED,
            pageable = PageRequest.of(0, limit)
        ).content.take(5)

        recentSessions.forEach { session ->
            activities.add(
                ActivityItem(
                    type = "SESSION_COMPLETED",
                    date = session.sessionDate.atStartOfDay(),
                    description = "Completed PT session",
                    relatedEntityId = session.id
                )
            )
        }

        // Recent earnings approved
        val recentEarnings = earningsRepository.findByTrainerIdAndStatus(
            trainerId = trainerId,
            status = EarningStatus.APPROVED,
            pageable = PageRequest.of(0, 5)
        ).content.take(3)

        recentEarnings.forEach { earning ->
            activities.add(
                ActivityItem(
                    type = "EARNING_APPROVED",
                    date = earning.earningDate.atStartOfDay(),
                    description = "Earning approved: ${earning.netAmount}",
                    relatedEntityId = earning.id
                )
            )
        }

        // Recent new clients
        val recentClients = clientRepository.findByTrainerId(trainerId, PageRequest.of(0, 5))
            .content.take(3)

        recentClients.forEach { client ->
            activities.add(
                ActivityItem(
                    type = "NEW_CLIENT",
                    date = client.startDate.atStartOfDay(),
                    description = "New client relationship started",
                    relatedEntityId = client.id
                )
            )
        }

        // Sort by date descending and limit
        return activities.sortedByDescending { it.date }.take(limit)
    }
}

// ==================== DATA CLASSES ====================

/**
 * Complete dashboard data.
 */
data class TrainerDashboard(
    val trainerId: UUID,
    val upcomingSessions: UpcomingSessionsSummary,
    val todaySchedule: List<TodayScheduleItem>,
    val sessionStats: SessionStats,
    val earningsStats: EarningsStats,
    val clientStats: ClientStats,
    val recentActivity: List<ActivityItem>,
    val unreadNotifications: Long
)

/**
 * Upcoming sessions summary.
 */
data class UpcomingSessionsSummary(
    val totalPTSessions: Int,
    val totalClassSessions: Int,
    val pendingRequests: Int,
    val nextSession: NextSessionInfo?
)

/**
 * Next session info.
 */
data class NextSessionInfo(
    val date: LocalDate,
    val time: java.time.LocalTime,
    val type: String
)

/**
 * Today's schedule item.
 */
data class TodayScheduleItem(
    val type: String,
    val time: String,
    val title: String,
    val memberId: UUID?,
    val status: String
)

/**
 * Session statistics.
 */
data class SessionStats(
    val total: Int,
    val completed: Int,
    val cancelled: Int,
    val noShows: Int,
    val pending: Int,
    val confirmed: Int,
    val completionRate: Double
)

/**
 * Earnings statistics.
 */
data class EarningsStats(
    val pendingAmount: BigDecimal,
    val approvedAmount: BigDecimal,
    val paidAmount: BigDecimal,
    val disputedAmount: BigDecimal,
    val lifetimeTotal: BigDecimal,
    val byType: Map<com.liyaqa.trainer.domain.model.EarningType, BigDecimal>,
    val currency: String
)

/**
 * Pending earnings summary.
 */
data class PendingEarningsSummary(
    val totalAmount: BigDecimal,
    val pendingCount: Int,
    val approvedCount: Int,
    val currency: String
)

/**
 * Client statistics.
 */
data class ClientStats(
    val total: Int,
    val active: Int,
    val onHold: Int,
    val completed: Int,
    val inactive: Int
)

/**
 * Activity feed item.
 */
data class ActivityItem(
    val type: String,
    val date: java.time.LocalDateTime,
    val description: String,
    val relatedEntityId: UUID
)

/**
 * Date range helper.
 */
data class DateRange(
    val startDate: LocalDate,
    val endDate: LocalDate
) {
    companion object {
        fun last30Days(): DateRange {
            val today = LocalDate.now()
            return DateRange(today.minusDays(30), today)
        }

        fun thisMonth(): DateRange {
            val today = LocalDate.now()
            return DateRange(today.withDayOfMonth(1), today)
        }

        fun lastMonth(): DateRange {
            val today = LocalDate.now()
            val lastMonth = today.minusMonths(1)
            return DateRange(
                lastMonth.withDayOfMonth(1),
                lastMonth.withDayOfMonth(lastMonth.lengthOfMonth())
            )
        }
    }
}
