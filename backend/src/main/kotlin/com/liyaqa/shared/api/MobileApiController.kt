package com.liyaqa.shared.api

import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.membership.application.services.MemberService
import com.liyaqa.membership.application.services.MembershipPlanService
import com.liyaqa.membership.application.services.SubscriptionService
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.scheduling.application.services.BookingService
import com.liyaqa.scheduling.application.services.ClassService
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.shared.domain.LocalizedText
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Mobile-optimized API endpoints.
 * Provides aggregated data and lightweight responses for mobile apps.
 */
@RestController
@RequestMapping("/api/mobile")
@Tag(name = "Mobile API", description = "Mobile-optimized endpoints with aggregated data")
class MobileApiController(
    private val memberService: MemberService,
    private val subscriptionService: SubscriptionService,
    private val membershipPlanService: MembershipPlanService,
    private val bookingService: BookingService,
    private val classService: ClassService,
    private val attendanceService: AttendanceService,
    private val invoiceService: InvoiceService,
    private val notificationService: NotificationService
) {
    /**
     * Member home screen dashboard - single API call for all home screen data.
     * Returns subscription status, upcoming classes, stats, and notifications.
     */
    @GetMapping("/home")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get mobile home dashboard", description = "Aggregated home screen data for mobile apps")
    fun getMobileHomeDashboard(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MobileHomeDashboardResponse> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        // Get subscription info
        val subscription = try {
            subscriptionService.getActiveSubscription(member.id)
        } catch (e: NoSuchElementException) {
            null
        }

        val subscriptionInfo = subscription?.let { sub ->
            val plan = membershipPlanService.getPlan(sub.planId)
            SubscriptionSummary(
                id = sub.id,
                planName = LocalizedTextResponse.from(plan.name),
                status = sub.status,
                daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), sub.endDate).coerceAtLeast(0),
                classesRemaining = sub.classesRemaining,
                endDate = sub.endDate,
                isExpiringSoon = ChronoUnit.DAYS.between(LocalDate.now(), sub.endDate) <= 7
            )
        }

        // Get upcoming bookings (next 5)
        val upcomingBookingsPage = bookingService.getUpcomingBookingsByMember(
            member.id,
            PageRequest.of(0, 5, Sort.by(Sort.Direction.ASC, "createdAt"))
        )

        val upcomingClasses = upcomingBookingsPage.content.mapNotNull { booking ->
            try {
                val session = classService.getSession(booking.sessionId)
                val gymClass = classService.getGymClass(session.gymClassId)
                UpcomingClassSummary(
                    bookingId = booking.id,
                    sessionId = session.id,
                    className = LocalizedTextResponse.from(gymClass.name),
                    sessionDate = session.sessionDate,
                    startTime = session.startTime,
                    endTime = session.endTime,
                    status = booking.status
                )
            } catch (e: Exception) {
                null
            }
        }

        // Get next class (first upcoming)
        val nextClass = upcomingClasses.firstOrNull()

        // Get attendance stats
        val totalVisits = attendanceService.getMemberTotalVisits(member.id)
        val thisMonth = LocalDate.now().withDayOfMonth(1)
        val lastMonth = thisMonth.minusMonths(1)
        val thisMonthAttendance = attendanceService.getMemberAttendanceByDateRange(
            member.id, thisMonth, LocalDate.now(), PageRequest.of(0, 100)
        ).totalElements
        val lastMonthAttendance = attendanceService.getMemberAttendanceByDateRange(
            member.id, lastMonth, thisMonth.minusDays(1), PageRequest.of(0, 100)
        ).totalElements

        // Get pending invoices count and total
        val pendingInvoices = invoiceService.searchInvoices(
            null, InvoiceStatus.ISSUED, member.id, null, null, PageRequest.of(0, 10)
        )
        val overdueInvoices = invoiceService.searchInvoices(
            null, InvoiceStatus.OVERDUE, member.id, null, null, PageRequest.of(0, 10)
        )
        val totalPendingAmount = (pendingInvoices.content + overdueInvoices.content)
            .sumOf { it.totalAmount.amount }

        // Get unread notifications count
        val unreadCount = notificationService.getUnreadCount(member.id)

        return ResponseEntity.ok(
            MobileHomeDashboardResponse(
                member = MemberSummary(
                    id = member.id,
                    firstName = member.firstName.en,
                    lastName = member.lastName.en,
                    fullName = member.fullName.en,
                    email = member.email,
                    status = member.status.name
                ),
                subscription = subscriptionInfo,
                nextClass = nextClass,
                upcomingClasses = upcomingClasses,
                totalUpcomingClasses = upcomingBookingsPage.totalElements.toInt(),
                attendanceStats = AttendanceStats(
                    totalVisits = totalVisits,
                    thisMonthVisits = thisMonthAttendance.toInt(),
                    lastMonthVisits = lastMonthAttendance.toInt()
                ),
                pendingInvoices = PendingInvoicesSummary(
                    count = pendingInvoices.totalElements.toInt() + overdueInvoices.totalElements.toInt(),
                    totalAmount = totalPendingAmount,
                    hasOverdue = overdueInvoices.totalElements > 0
                ),
                unreadNotifications = unreadCount.toInt(),
                lastUpdated = Instant.now()
            )
        )
    }

    /**
     * Quick stats for member - lightweight stats endpoint.
     */
    @GetMapping("/quick-stats")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get quick stats", description = "Lightweight stats for mobile widgets")
    fun getQuickStats(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<QuickStatsResponse> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val subscription = try {
            subscriptionService.getActiveSubscription(member.id)
        } catch (e: NoSuchElementException) {
            null
        }

        val totalVisits = attendanceService.getMemberTotalVisits(member.id)
        val memberSince = member.createdAt
        val monthsSinceMember = ChronoUnit.MONTHS.between(
            memberSince.atZone(java.time.ZoneId.systemDefault()).toLocalDate(),
            LocalDate.now()
        ).coerceAtLeast(1)

        return ResponseEntity.ok(
            QuickStatsResponse(
                memberSince = memberSince,
                totalVisits = totalVisits,
                averageVisitsPerMonth = (totalVisits.toDouble() / monthsSinceMember).let {
                    (it * 10).toLong() / 10.0 // Round to 1 decimal
                },
                classesRemaining = subscription?.classesRemaining,
                daysRemaining = subscription?.let {
                    ChronoUnit.DAYS.between(LocalDate.now(), it.endDate).coerceAtLeast(0)
                },
                subscriptionStatus = subscription?.status?.name ?: "NONE"
            )
        )
    }

    /**
     * Minimal init data for app startup.
     */
    @GetMapping("/init")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get app init data", description = "Minimal data required for app startup")
    fun getAppInitData(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<AppInitResponse> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val subscription = try {
            subscriptionService.getActiveSubscription(member.id)
        } catch (e: NoSuchElementException) {
            null
        }

        return ResponseEntity.ok(
            AppInitResponse(
                member = MemberSummary(
                    id = member.id,
                    firstName = member.firstName.en,
                    lastName = member.lastName.en,
                    fullName = member.fullName.en,
                    email = member.email,
                    status = member.status.name
                ),
                subscription = subscription?.let {
                    SubscriptionMinimal(
                        id = it.id,
                        status = it.status,
                        daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), it.endDate).coerceAtLeast(0),
                        classesRemaining = it.classesRemaining
                    )
                },
                config = AppConfig(
                    apiVersion = "1.0",
                    features = mapOf(
                        "classBooking" to true,
                        "qrCheckIn" to true,
                        "offlineMode" to true,
                        "pushNotifications" to true
                    )
                )
            )
        )
    }

    /**
     * Get available sessions for booking (with member's booking status).
     */
    @GetMapping("/sessions/available")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get available sessions", description = "Sessions available for booking with booking status")
    fun getAvailableSessions(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(required = false) classId: UUID?,
        @RequestParam(required = false) locationId: UUID?,
        @RequestParam(defaultValue = "7") days: Int
    ): ResponseEntity<List<AvailableSessionResponse>> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val fromDate = LocalDate.now()
        val toDate = fromDate.plusDays(days.toLong().coerceAtMost(30))

        // Get all sessions in date range
        val sessions = classService.getSessionsByDateRange(
            fromDate, toDate, PageRequest.of(0, 100)
        ).content

        // Get member's bookings to check status
        val memberBookings = bookingService.getUpcomingBookingsByMember(
            member.id, PageRequest.of(0, 100)
        ).content.associateBy { it.sessionId }

        // Check subscription status
        val hasActiveSubscription = try {
            val subscription = subscriptionService.getActiveSubscription(member.id)
            subscription?.status == SubscriptionStatus.ACTIVE
        } catch (e: NoSuchElementException) {
            false
        }

        val availableSessions = sessions.mapNotNull { session ->
            try {
                val gymClass = classService.getGymClass(session.gymClassId)

                // Apply filters
                if (classId != null && session.gymClassId != classId) return@mapNotNull null
                if (locationId != null && session.locationId != locationId) return@mapNotNull null

                val existingBooking = memberBookings[session.id]
                val isBookable = session.availableSpots() > 0 &&
                    hasActiveSubscription &&
                    existingBooking == null

                AvailableSessionResponse(
                    id = session.id,
                    className = LocalizedTextResponse.from(gymClass.name),
                    sessionDate = session.sessionDate,
                    startTime = session.startTime,
                    endTime = session.endTime,
                    capacity = session.maxCapacity,
                    spotsRemaining = session.availableSpots(),
                    trainerId = session.trainerId,
                    locationId = session.locationId,
                    isBooked = existingBooking != null,
                    bookingId = existingBooking?.id,
                    bookingStatus = existingBooking?.status,
                    isBookable = isBookable,
                    bookingError = when {
                        existingBooking != null -> null
                        !hasActiveSubscription -> "No active subscription"
                        session.availableSpots() <= 0 -> "Class is full"
                        else -> null
                    }
                )
            } catch (e: Exception) {
                null
            }
        }.sortedWith(compareBy({ it.sessionDate }, { it.startTime }))

        return ResponseEntity.ok(availableSessions)
    }
}

// ==================== RESPONSE DTOs ====================

data class MobileHomeDashboardResponse(
    val member: MemberSummary,
    val subscription: SubscriptionSummary?,
    val nextClass: UpcomingClassSummary?,
    val upcomingClasses: List<UpcomingClassSummary>,
    val totalUpcomingClasses: Int,
    val attendanceStats: AttendanceStats,
    val pendingInvoices: PendingInvoicesSummary,
    val unreadNotifications: Int,
    val lastUpdated: Instant
)

data class MemberSummary(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val email: String,
    val status: String
)

data class SubscriptionSummary(
    val id: UUID,
    val planName: LocalizedTextResponse,
    val status: SubscriptionStatus,
    val daysRemaining: Long,
    val classesRemaining: Int?,
    val endDate: LocalDate,
    val isExpiringSoon: Boolean
)

data class UpcomingClassSummary(
    val bookingId: UUID,
    val sessionId: UUID,
    val className: LocalizedTextResponse,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val status: BookingStatus
)

data class AttendanceStats(
    val totalVisits: Long,
    val thisMonthVisits: Int,
    val lastMonthVisits: Int
)

data class PendingInvoicesSummary(
    val count: Int,
    val totalAmount: BigDecimal,
    val hasOverdue: Boolean
)

data class QuickStatsResponse(
    val memberSince: Instant,
    val totalVisits: Long,
    val averageVisitsPerMonth: Double,
    val classesRemaining: Int?,
    val daysRemaining: Long?,
    val subscriptionStatus: String
)

data class AppInitResponse(
    val member: MemberSummary,
    val subscription: SubscriptionMinimal?,
    val config: AppConfig
)

data class SubscriptionMinimal(
    val id: UUID,
    val status: SubscriptionStatus,
    val daysRemaining: Long,
    val classesRemaining: Int?
)

data class AppConfig(
    val apiVersion: String,
    val features: Map<String, Boolean>
)

data class AvailableSessionResponse(
    val id: UUID,
    val className: LocalizedTextResponse,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val capacity: Int,
    val spotsRemaining: Int,
    val trainerId: UUID?,
    val locationId: UUID?,
    val isBooked: Boolean,
    val bookingId: UUID?,
    val bookingStatus: BookingStatus?,
    val isBookable: Boolean,
    val bookingError: String?
)
