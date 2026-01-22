package com.liyaqa.shared.api

import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.membership.application.services.MemberService
import com.liyaqa.membership.application.services.MembershipPlanService
import com.liyaqa.membership.application.services.SubscriptionService
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.scheduling.application.services.BookingService
import com.liyaqa.scheduling.application.services.ClassService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.PageRequest
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Report endpoints for analytics and business intelligence.
 * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
 */
@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports", description = "Analytics and business intelligence reports")
class ReportController(
    private val invoiceService: InvoiceService,
    private val memberService: MemberService,
    private val subscriptionService: SubscriptionService,
    private val membershipPlanService: MembershipPlanService,
    private val attendanceService: AttendanceService,
    private val bookingService: BookingService,
    private val classService: ClassService
) {
    /**
     * Get revenue report for a date range.
     */
    @GetMapping("/revenue")
    @PreAuthorize("hasAuthority('reports_view')")
    @Operation(summary = "Get revenue report", description = "Get revenue analytics for a date range")
    fun getRevenueReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(defaultValue = "day") groupBy: String
    ): ResponseEntity<RevenueReportResponse> {
        val pageable = PageRequest.of(0, 10000)

        // Get all invoices in date range
        val allInvoices = invoiceService.searchInvoices(
            null, null, null, startDate, endDate, pageable
        ).content

        // Calculate summary
        val paidInvoices = allInvoices.filter { it.status == InvoiceStatus.PAID }
        val pendingInvoices = allInvoices.filter { it.status == InvoiceStatus.ISSUED }
        val overdueInvoices = allInvoices.filter { it.status == InvoiceStatus.OVERDUE }

        val totalRevenue = paidInvoices.sumOf { it.totalAmount.amount }
        val pendingRevenue = pendingInvoices.sumOf { it.totalAmount.amount }
        val overdueRevenue = overdueInvoices.sumOf { it.totalAmount.amount }

        val summary = RevenueSummaryResponse(
            totalRevenue = MoneyResponse(totalRevenue, "SAR"),
            paidInvoices = paidInvoices.size,
            pendingRevenue = MoneyResponse(pendingRevenue, "SAR"),
            pendingInvoices = pendingInvoices.size,
            overdueRevenue = MoneyResponse(overdueRevenue, "SAR"),
            overdueInvoices = overdueInvoices.size
        )

        // Group by period
        val byPeriod = when (groupBy.lowercase()) {
            "week" -> groupInvoicesByWeek(paidInvoices, startDate, endDate)
            "month" -> groupInvoicesByMonth(paidInvoices, startDate, endDate)
            else -> groupInvoicesByDay(paidInvoices, startDate, endDate)
        }

        // Group by plan (from subscriptions linked to invoices)
        val byPlan = try {
            val planRevenue = mutableMapOf<UUID, Pair<String, BigDecimal>>()
            val planSubCount = mutableMapOf<UUID, Int>()

            paidInvoices.forEach { invoice ->
                invoice.subscriptionId?.let { subId ->
                    try {
                        val subscription = subscriptionService.getSubscription(subId)
                        val plan = membershipPlanService.getPlan(subscription.planId)
                        val planName = plan.name.en
                        val current = planRevenue[plan.id] ?: (planName to BigDecimal.ZERO)
                        planRevenue[plan.id] = planName to (current.second + invoice.totalAmount.amount)
                        planSubCount[plan.id] = (planSubCount[plan.id] ?: 0) + 1
                    } catch (e: Exception) {
                        // Skip if subscription or plan not found
                    }
                }
            }

            planRevenue.map { (planId, pair) ->
                RevenueByPlanResponse(
                    planId = planId,
                    planName = pair.first,
                    revenue = pair.second,
                    subscriptionCount = planSubCount[planId] ?: 0
                )
            }.sortedByDescending { it.revenue }
        } catch (e: Exception) {
            emptyList()
        }

        return ResponseEntity.ok(
            RevenueReportResponse(
                summary = summary,
                byPeriod = byPeriod,
                byPlan = byPlan
            )
        )
    }

    /**
     * Get attendance report for a date range.
     */
    @GetMapping("/attendance")
    @PreAuthorize("hasAuthority('reports_view')")
    @Operation(summary = "Get attendance report", description = "Get attendance analytics for a date range")
    fun getAttendanceReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(defaultValue = "day") groupBy: String
    ): ResponseEntity<AttendanceReportResponse> {
        val pageable = PageRequest.of(0, 10000)

        // Get all attendance records in date range
        val records = attendanceService.getAttendanceByDateRange(startDate, endDate, pageable).content

        // Calculate summary
        val totalCheckIns = records.size.toLong()
        val uniqueMembers = records.map { it.memberId }.distinct().size
        val dayCount = ChronoUnit.DAYS.between(startDate, endDate).coerceAtLeast(1)
        val averageCheckInsPerDay = if (dayCount > 0) {
            (totalCheckIns.toDouble() / dayCount).let {
                BigDecimal(it).setScale(1, RoundingMode.HALF_UP).toDouble()
            }
        } else 0.0

        // Calculate peak hour
        val hourCounts = records.groupingBy {
            it.checkInTime.atZone(java.time.ZoneId.systemDefault()).hour
        }.eachCount()
        val peakHour = hourCounts.maxByOrNull { it.value }?.key?.let {
            String.format("%02d:00", it)
        } ?: "N/A"

        // Calculate peak day
        val dayCounts = records.groupingBy {
            it.checkInTime.atZone(java.time.ZoneId.systemDefault()).dayOfWeek.name
        }.eachCount()
        val peakDay = dayCounts.maxByOrNull { it.value }?.key?.lowercase()?.replaceFirstChar {
            it.uppercase()
        } ?: "N/A"

        val summary = AttendanceSummaryResponse(
            totalCheckIns = totalCheckIns,
            uniqueMembers = uniqueMembers,
            averageCheckInsPerDay = averageCheckInsPerDay,
            peakHour = peakHour,
            peakDay = peakDay
        )

        // Group by period
        val byPeriod = when (groupBy.lowercase()) {
            "week" -> groupAttendanceByWeek(records, startDate, endDate)
            "month" -> groupAttendanceByMonth(records, startDate, endDate)
            else -> groupAttendanceByDay(records, startDate, endDate)
        }

        // By hour
        val byHour = (0..23).map { hour ->
            AttendanceByHourResponse(
                hour = hour,
                checkIns = hourCounts[hour] ?: 0
            )
        }

        // By class
        val byClass = try {
            val classBookings = mutableMapOf<UUID, Int>()
            val classAttendance = mutableMapOf<UUID, Int>()
            val classNames = mutableMapOf<UUID, String>()

            // Get bookings in date range
            val sessions = classService.getSessionsByDateRange(startDate, endDate, pageable).content
            sessions.forEach { session ->
                val gymClass = classService.getGymClass(session.gymClassId)
                classNames[gymClass.id] = gymClass.name.en

                val bookings = bookingService.getBookingsBySession(session.id)
                val confirmed = bookings.filter {
                    it.status.name in listOf("CONFIRMED", "CHECKED_IN", "COMPLETED")
                }
                val checkedIn = bookings.filter { it.status.name == "CHECKED_IN" || it.status.name == "COMPLETED" }

                classBookings[gymClass.id] = (classBookings[gymClass.id] ?: 0) + confirmed.size
                classAttendance[gymClass.id] = (classAttendance[gymClass.id] ?: 0) + checkedIn.size
            }

            classNames.map { (classId, className) ->
                AttendanceByClassResponse(
                    classId = classId,
                    className = className,
                    bookings = classBookings[classId] ?: 0,
                    attendance = classAttendance[classId] ?: 0
                )
            }.sortedByDescending { it.attendance }
        } catch (e: Exception) {
            emptyList()
        }

        return ResponseEntity.ok(
            AttendanceReportResponse(
                summary = summary,
                byPeriod = byPeriod,
                byHour = byHour,
                byClass = byClass
            )
        )
    }

    /**
     * Get member report for a date range.
     */
    @GetMapping("/members")
    @PreAuthorize("hasAuthority('reports_view')")
    @Operation(summary = "Get member report", description = "Get member analytics for a date range")
    fun getMemberReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(defaultValue = "day") groupBy: String
    ): ResponseEntity<MemberReportResponse> {
        val pageable = PageRequest.of(0, 10000)

        // Get all members
        val allMembers = memberService.searchMembers(null, null, null, null, pageable).content

        // Members created in date range
        val startInstant = startDate.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()
        val endInstant = endDate.plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()

        val newMembers = allMembers.filter {
            it.createdAt >= startInstant && it.createdAt < endInstant
        }

        // Active members (with active subscription or ACTIVE status)
        val activeMembers = allMembers.filter { it.status == MemberStatus.ACTIVE }

        // Churned members (cancelled/expired subscriptions in period)
        val churnedCount = try {
            val subscriptions = subscriptionService.searchSubscriptions(
                null, null, null, pageable
            ).content
            subscriptions.count { sub ->
                (sub.status == SubscriptionStatus.CANCELLED || sub.status == SubscriptionStatus.EXPIRED) &&
                sub.updatedAt >= startInstant && sub.updatedAt < endInstant
            }
        } catch (e: Exception) {
            0
        }

        // Retention rate calculation
        val previousPeriodStart = startDate.minusDays(ChronoUnit.DAYS.between(startDate, endDate))
        val previousPeriodStartInstant = previousPeriodStart.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()
        val previousPeriodMembers = allMembers.filter {
            it.createdAt < startInstant && it.createdAt >= previousPeriodStartInstant
        }
        val retentionRate = if (previousPeriodMembers.isNotEmpty()) {
            val retained = previousPeriodMembers.count { it.status == MemberStatus.ACTIVE }
            (retained.toDouble() / previousPeriodMembers.size * 100).let {
                BigDecimal(it).setScale(1, RoundingMode.HALF_UP).toDouble()
            }
        } else {
            100.0
        }

        val summary = MemberSummaryReportResponse(
            totalMembers = allMembers.size,
            activeMembers = activeMembers.size,
            newMembersThisPeriod = newMembers.size,
            churnedMembersThisPeriod = churnedCount,
            retentionRate = retentionRate
        )

        // Growth by period
        val growthByPeriod = when (groupBy.lowercase()) {
            "week" -> groupMemberGrowthByWeek(allMembers, startDate, endDate)
            "month" -> groupMemberGrowthByMonth(allMembers, startDate, endDate)
            else -> groupMemberGrowthByDay(allMembers, startDate, endDate)
        }

        // By status
        val byStatus = MemberStatus.entries.map { status ->
            MemberByStatusResponse(
                status = status.name,
                count = allMembers.count { it.status == status }
            )
        }.filter { it.count > 0 }

        // By plan
        val byPlan = try {
            val subscriptions = subscriptionService.searchSubscriptions(
                null, SubscriptionStatus.ACTIVE, null, pageable
            ).content

            val planCounts = subscriptions.groupingBy { it.planId }.eachCount()

            planCounts.map { (planId, count) ->
                val plan = membershipPlanService.getPlan(planId)
                MemberByPlanResponse(
                    planId = planId,
                    planName = plan.name.en,
                    memberCount = count
                )
            }.sortedByDescending { it.memberCount }
        } catch (e: Exception) {
            emptyList()
        }

        return ResponseEntity.ok(
            MemberReportResponse(
                summary = summary,
                growthByPeriod = growthByPeriod,
                byStatus = byStatus,
                byPlan = byPlan
            )
        )
    }

    // ==================== HELPER METHODS ====================

    private fun groupInvoicesByDay(
        invoices: List<com.liyaqa.billing.domain.model.Invoice>,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<RevenueByPeriodResponse> {
        val result = mutableListOf<RevenueByPeriodResponse>()
        var current = startDate
        while (!current.isAfter(endDate)) {
            val dayInvoices = invoices.filter {
                it.issueDate == current
            }
            result.add(
                RevenueByPeriodResponse(
                    period = current.toString(),
                    revenue = dayInvoices.sumOf { it.totalAmount.amount },
                    invoiceCount = dayInvoices.size
                )
            )
            current = current.plusDays(1)
        }
        return result
    }

    private fun groupInvoicesByWeek(
        invoices: List<com.liyaqa.billing.domain.model.Invoice>,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<RevenueByPeriodResponse> {
        val result = mutableListOf<RevenueByPeriodResponse>()
        var current = startDate
        while (!current.isAfter(endDate)) {
            val weekEnd = current.plusDays(6).coerceAtMost(endDate)
            val weekInvoices = invoices.filter { invoice ->
                val date = invoice.issueDate ?: return@filter false
                !date.isBefore(current) && !date.isAfter(weekEnd)
            }
            result.add(
                RevenueByPeriodResponse(
                    period = "Week of $current",
                    revenue = weekInvoices.sumOf { it.totalAmount.amount },
                    invoiceCount = weekInvoices.size
                )
            )
            current = current.plusWeeks(1)
        }
        return result
    }

    private fun groupInvoicesByMonth(
        invoices: List<com.liyaqa.billing.domain.model.Invoice>,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<RevenueByPeriodResponse> {
        val result = mutableListOf<RevenueByPeriodResponse>()
        var current = startDate.withDayOfMonth(1)
        while (!current.isAfter(endDate)) {
            val monthEnd = current.plusMonths(1).minusDays(1)
            val monthInvoices = invoices.filter { invoice ->
                val date = invoice.issueDate ?: return@filter false
                !date.isBefore(current) && !date.isAfter(monthEnd)
            }
            result.add(
                RevenueByPeriodResponse(
                    period = current.month.name.lowercase().replaceFirstChar { it.uppercase() } + " " + current.year,
                    revenue = monthInvoices.sumOf { it.totalAmount.amount },
                    invoiceCount = monthInvoices.size
                )
            )
            current = current.plusMonths(1)
        }
        return result
    }

    private fun groupAttendanceByDay(
        records: List<com.liyaqa.attendance.domain.model.AttendanceRecord>,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<AttendanceByPeriodResponse> {
        val result = mutableListOf<AttendanceByPeriodResponse>()
        var current = startDate
        while (!current.isAfter(endDate)) {
            val dayRecords = records.filter {
                it.checkInTime.atZone(java.time.ZoneId.systemDefault()).toLocalDate() == current
            }
            result.add(
                AttendanceByPeriodResponse(
                    period = current.toString(),
                    checkIns = dayRecords.size,
                    uniqueMembers = dayRecords.map { it.memberId }.distinct().size
                )
            )
            current = current.plusDays(1)
        }
        return result
    }

    private fun groupAttendanceByWeek(
        records: List<com.liyaqa.attendance.domain.model.AttendanceRecord>,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<AttendanceByPeriodResponse> {
        val result = mutableListOf<AttendanceByPeriodResponse>()
        var current = startDate
        while (!current.isAfter(endDate)) {
            val weekEnd = current.plusDays(6).coerceAtMost(endDate)
            val weekRecords = records.filter {
                val recordDate = it.checkInTime.atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                !recordDate.isBefore(current) && !recordDate.isAfter(weekEnd)
            }
            result.add(
                AttendanceByPeriodResponse(
                    period = "Week of $current",
                    checkIns = weekRecords.size,
                    uniqueMembers = weekRecords.map { it.memberId }.distinct().size
                )
            )
            current = current.plusWeeks(1)
        }
        return result
    }

    private fun groupAttendanceByMonth(
        records: List<com.liyaqa.attendance.domain.model.AttendanceRecord>,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<AttendanceByPeriodResponse> {
        val result = mutableListOf<AttendanceByPeriodResponse>()
        var current = startDate.withDayOfMonth(1)
        while (!current.isAfter(endDate)) {
            val monthEnd = current.plusMonths(1).minusDays(1)
            val monthRecords = records.filter {
                val recordDate = it.checkInTime.atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                !recordDate.isBefore(current) && !recordDate.isAfter(monthEnd)
            }
            result.add(
                AttendanceByPeriodResponse(
                    period = current.month.name.lowercase().replaceFirstChar { it.uppercase() } + " " + current.year,
                    checkIns = monthRecords.size,
                    uniqueMembers = monthRecords.map { it.memberId }.distinct().size
                )
            )
            current = current.plusMonths(1)
        }
        return result
    }

    private fun groupMemberGrowthByDay(
        members: List<com.liyaqa.membership.domain.model.Member>,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<MemberGrowthByPeriodResponse> {
        val result = mutableListOf<MemberGrowthByPeriodResponse>()
        var current = startDate
        while (!current.isAfter(endDate)) {
            val currentInstant = current.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()
            val nextInstant = current.plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()

            val newMembers = members.count {
                it.createdAt >= currentInstant && it.createdAt < nextInstant
            }
            val totalMembers = members.count { it.createdAt < nextInstant }

            result.add(
                MemberGrowthByPeriodResponse(
                    period = current.toString(),
                    newMembers = newMembers,
                    totalMembers = totalMembers,
                    churnedMembers = 0 // Would need subscription data to calculate accurately
                )
            )
            current = current.plusDays(1)
        }
        return result
    }

    private fun groupMemberGrowthByWeek(
        members: List<com.liyaqa.membership.domain.model.Member>,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<MemberGrowthByPeriodResponse> {
        val result = mutableListOf<MemberGrowthByPeriodResponse>()
        var current = startDate
        while (!current.isAfter(endDate)) {
            val weekEnd = current.plusDays(6).coerceAtMost(endDate)
            val currentInstant = current.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()
            val nextInstant = weekEnd.plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()

            val newMembers = members.count {
                it.createdAt >= currentInstant && it.createdAt < nextInstant
            }
            val totalMembers = members.count { it.createdAt < nextInstant }

            result.add(
                MemberGrowthByPeriodResponse(
                    period = "Week of $current",
                    newMembers = newMembers,
                    totalMembers = totalMembers,
                    churnedMembers = 0
                )
            )
            current = current.plusWeeks(1)
        }
        return result
    }

    private fun groupMemberGrowthByMonth(
        members: List<com.liyaqa.membership.domain.model.Member>,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<MemberGrowthByPeriodResponse> {
        val result = mutableListOf<MemberGrowthByPeriodResponse>()
        var current = startDate.withDayOfMonth(1)
        while (!current.isAfter(endDate)) {
            val monthEnd = current.plusMonths(1).minusDays(1)
            val currentInstant = current.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()
            val nextInstant = monthEnd.plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()

            val newMembers = members.count {
                it.createdAt >= currentInstant && it.createdAt < nextInstant
            }
            val totalMembers = members.count { it.createdAt < nextInstant }

            result.add(
                MemberGrowthByPeriodResponse(
                    period = current.month.name.lowercase().replaceFirstChar { it.uppercase() } + " " + current.year,
                    newMembers = newMembers,
                    totalMembers = totalMembers,
                    churnedMembers = 0
                )
            )
            current = current.plusMonths(1)
        }
        return result
    }
}

// ==================== RESPONSE DTOs ====================

data class RevenueReportResponse(
    val summary: RevenueSummaryResponse,
    val byPeriod: List<RevenueByPeriodResponse>,
    val byPlan: List<RevenueByPlanResponse>
)

data class RevenueSummaryResponse(
    val totalRevenue: MoneyResponse,
    val paidInvoices: Int,
    val pendingRevenue: MoneyResponse,
    val pendingInvoices: Int,
    val overdueRevenue: MoneyResponse,
    val overdueInvoices: Int
)

data class MoneyResponse(
    val amount: BigDecimal,
    val currency: String
)

data class RevenueByPeriodResponse(
    val period: String,
    val revenue: BigDecimal,
    val invoiceCount: Int
)

data class RevenueByPlanResponse(
    val planId: UUID,
    val planName: String,
    val revenue: BigDecimal,
    val subscriptionCount: Int
)

data class AttendanceReportResponse(
    val summary: AttendanceSummaryResponse,
    val byPeriod: List<AttendanceByPeriodResponse>,
    val byHour: List<AttendanceByHourResponse>,
    val byClass: List<AttendanceByClassResponse>
)

data class AttendanceSummaryResponse(
    val totalCheckIns: Long,
    val uniqueMembers: Int,
    val averageCheckInsPerDay: Double,
    val peakHour: String,
    val peakDay: String
)

data class AttendanceByPeriodResponse(
    val period: String,
    val checkIns: Int,
    val uniqueMembers: Int
)

data class AttendanceByHourResponse(
    val hour: Int,
    val checkIns: Int
)

data class AttendanceByClassResponse(
    val classId: UUID,
    val className: String,
    val bookings: Int,
    val attendance: Int
)

data class MemberReportResponse(
    val summary: MemberSummaryReportResponse,
    val growthByPeriod: List<MemberGrowthByPeriodResponse>,
    val byStatus: List<MemberByStatusResponse>,
    val byPlan: List<MemberByPlanResponse>
)

data class MemberSummaryReportResponse(
    val totalMembers: Int,
    val activeMembers: Int,
    val newMembersThisPeriod: Int,
    val churnedMembersThisPeriod: Int,
    val retentionRate: Double
)

data class MemberGrowthByPeriodResponse(
    val period: String,
    val newMembers: Int,
    val totalMembers: Int,
    val churnedMembers: Int
)

data class MemberByStatusResponse(
    val status: String,
    val count: Int
)

data class MemberByPlanResponse(
    val planId: UUID,
    val planName: String,
    val memberCount: Int
)
