package com.liyaqa.shared.api

import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.shared.domain.LocalizedText
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth

@RestController
@RequestMapping("/api/dashboard")
class DashboardController(
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val membershipPlanRepository: MembershipPlanRepository,
    private val attendanceService: AttendanceService,
    private val invoiceService: InvoiceService
) {
    /**
     * Gets the main dashboard summary with key metrics.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('dashboard_view')")
    fun getDashboardSummary(): ResponseEntity<DashboardSummaryResponse> {
        val totalMembers = memberRepository.count()
        val activeMembers = memberRepository.countByStatus(MemberStatus.ACTIVE)

        // Count new members this month
        val startOfMonth = YearMonth.now().atDay(1)
        val newMembersThisMonth = memberRepository.countByJoinedAfter(startOfMonth)

        val totalSubscriptions = subscriptionRepository.count()
        val activeSubscriptions = subscriptionRepository.findByStatus(
            com.liyaqa.membership.domain.model.SubscriptionStatus.ACTIVE,
            Pageable.unpaged()
        ).totalElements

        val todayCheckIns = attendanceService.getTodayCheckInCount()

        val pendingInvoices = invoiceService.countByStatus(InvoiceStatus.ISSUED)
        val overdueInvoices = invoiceService.countByStatus(InvoiceStatus.OVERDUE)

        // Get expiring subscriptions (next 7 days)
        val expiringThisWeek = subscriptionRepository.findExpiringBefore(
            LocalDate.now().plusDays(7),
            Pageable.unpaged()
        ).totalElements

        // Calculate monthly revenue (sum of paid invoices this month)
        val monthlyRevenue = invoiceService.getMonthlyRevenue(YearMonth.now())

        return ResponseEntity.ok(
            DashboardSummaryResponse(
                totalMembers = totalMembers,
                activeMembers = activeMembers,
                newMembersThisMonth = newMembersThisMonth,
                totalSubscriptions = totalSubscriptions,
                activeSubscriptions = activeSubscriptions,
                expiringThisWeek = expiringThisWeek,
                todayCheckIns = todayCheckIns,
                pendingInvoices = pendingInvoices,
                overdueInvoices = overdueInvoices,
                monthlyRevenue = monthlyRevenue
            )
        )
    }

    /**
     * Gets today's attendance list.
     * Returns a flat array of attendance items for the dashboard activity timeline.
     */
    @GetMapping("/attendance/today")
    @PreAuthorize("hasAuthority('dashboard_view')")
    fun getTodayAttendance(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<TodayAttendanceItem>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "checkInTime"))
        val todayRecords = attendanceService.getTodayAttendance(pageable)

        // Get member names for all attendance records
        val memberIds = todayRecords.content.map { it.memberId }.distinct()
        val members = memberRepository.findAllByIds(memberIds).associateBy { it.id }

        val items = todayRecords.content.map { record ->
            val member = members[record.memberId]
            TodayAttendanceItem(
                memberId = record.memberId,
                memberName = member?.fullName ?: LocalizedText(en = "Unknown", ar = "غير معروف"),
                checkInTime = record.checkInTime.toString(),
                checkOutTime = record.checkOutTime?.toString(),
                checkInMethod = record.checkInMethod?.name ?: "MANUAL"
            )
        }

        return ResponseEntity.ok(items)
    }

    /**
     * Gets subscriptions expiring soon.
     * Returns a flat array matching frontend ExpiringSubscription[] type.
     */
    @GetMapping("/subscriptions/expiring")
    @PreAuthorize("hasAuthority('dashboard_view')")
    fun getExpiringSubscriptions(
        @RequestParam(defaultValue = "7") daysAhead: Int,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<ExpiringSubscriptionItem>> {
        val expirationDate = LocalDate.now().plusDays(daysAhead.toLong())
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "endDate"))
        val expiringPage = subscriptionRepository.findExpiringBefore(expirationDate, pageable)

        // Get member names
        val memberIds = expiringPage.content.map { it.memberId }.distinct()
        val members = memberRepository.findAllByIds(memberIds).associateBy { it.id }

        // Get plan names from membership plan repository
        val planIds = expiringPage.content.map { it.planId }.distinct()
        val plans = planIds.mapNotNull { planId ->
            membershipPlanRepository.findById(planId)
                .map { it.id to it }
                .orElse(null)
        }.toMap()

        val items = expiringPage.content.map { sub ->
            val member = members[sub.memberId]
            val plan = plans[sub.planId]
            ExpiringSubscriptionItem(
                id = sub.id,
                memberId = sub.memberId,
                memberName = member?.fullName ?: LocalizedText(en = "Unknown", ar = "غير معروف"),
                planName = plan?.name ?: LocalizedText(en = "Unknown Plan", ar = "خطة غير معروفة"),
                endDate = sub.endDate.toString(),
                daysUntilExpiry = sub.daysRemaining()
            )
        }

        return ResponseEntity.ok(items)
    }

    /**
     * Gets pending and overdue invoices.
     * Returns a flat array matching frontend PendingInvoice[] type.
     */
    @GetMapping("/invoices/pending")
    @PreAuthorize("hasAuthority('dashboard_view')")
    fun getPendingInvoices(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<PendingInvoiceItem>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "dueDate"))
        val pendingInvoices = invoiceService.getPendingInvoices(pageable)

        // Get member names
        val memberIds = pendingInvoices.content.map { it.memberId }.distinct()
        val members = memberRepository.findAllByIds(memberIds).associateBy { it.id }

        val items = pendingInvoices.content.map { inv ->
            val member = members[inv.memberId]
            PendingInvoiceItem(
                id = inv.id,
                invoiceNumber = inv.invoiceNumber,
                memberId = inv.memberId,
                memberName = member?.fullName ?: LocalizedText(en = "Unknown", ar = "غير معروف"),
                totalAmount = inv.totalAmount.amount,
                dueDate = inv.dueDate?.toString() ?: "",
                status = inv.status.name
            )
        }

        return ResponseEntity.ok(items)
    }
}

// Response DTOs

data class DashboardSummaryResponse(
    val totalMembers: Long,
    val activeMembers: Long,
    val newMembersThisMonth: Long,
    val totalSubscriptions: Long,
    val activeSubscriptions: Long,
    val expiringThisWeek: Long,
    val todayCheckIns: Long,
    val pendingInvoices: Long,
    val overdueInvoices: Long,
    val monthlyRevenue: Long
)

data class TodayAttendanceResponse(
    val totalCheckIns: Long,
    val currentlyCheckedIn: Long,
    val recentCheckIns: List<AttendanceSummaryItem>
)

data class AttendanceSummaryItem(
    val id: java.util.UUID,
    val memberId: java.util.UUID,
    val locationId: java.util.UUID,
    val checkInTime: String,
    val checkOutTime: String?,
    val status: String
)

data class ExpiringSubscriptionsResponse(
    val totalExpiring: Long,
    val subscriptions: List<SubscriptionSummaryItem>
)

data class SubscriptionSummaryItem(
    val id: java.util.UUID,
    val memberId: java.util.UUID,
    val planId: java.util.UUID,
    val status: String,
    val startDate: String,
    val endDate: String,
    val daysRemaining: Long
)

data class PendingInvoicesResponse(
    val pendingCount: Long,
    val overdueCount: Long,
    val totalPendingAmount: BigDecimal,
    val currency: String,
    val invoices: List<InvoiceSummaryItem>
)

data class InvoiceSummaryItem(
    val id: java.util.UUID,
    val invoiceNumber: String,
    val memberId: java.util.UUID,
    val status: String,
    val totalAmount: BigDecimal,
    val remainingBalance: BigDecimal,
    val dueDate: String?,
    val isOverdue: Boolean
)

// New flat DTOs matching frontend interfaces

data class TodayAttendanceItem(
    val memberId: java.util.UUID,
    val memberName: LocalizedText,
    val checkInTime: String,
    val checkOutTime: String?,
    val checkInMethod: String
)

data class ExpiringSubscriptionItem(
    val id: java.util.UUID,
    val memberId: java.util.UUID,
    val memberName: LocalizedText,
    val planName: LocalizedText,
    val endDate: String,
    val daysUntilExpiry: Long
)

data class PendingInvoiceItem(
    val id: java.util.UUID,
    val invoiceNumber: String,
    val memberId: java.util.UUID,
    val memberName: LocalizedText,
    val totalAmount: BigDecimal,
    val dueDate: String,
    val status: String
)
