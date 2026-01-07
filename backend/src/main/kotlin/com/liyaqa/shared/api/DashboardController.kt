package com.liyaqa.shared.api

import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
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

@RestController
@RequestMapping("/api/dashboard")
class DashboardController(
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val attendanceService: AttendanceService,
    private val invoiceService: InvoiceService
) {
    /**
     * Gets the main dashboard summary with key metrics.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getDashboardSummary(): ResponseEntity<DashboardSummaryResponse> {
        val totalMembers = memberRepository.count()
        val activeSubscriptions = subscriptionRepository.findByStatus(
            com.liyaqa.membership.domain.model.SubscriptionStatus.ACTIVE,
            Pageable.unpaged()
        ).totalElements

        val todayCheckIns = attendanceService.getTodayCheckInCount()
        val currentlyCheckedIn = attendanceService.getCurrentlyCheckedInCount()

        val pendingInvoicesCount = invoiceService.countByStatus(InvoiceStatus.ISSUED)
        val overdueInvoicesCount = invoiceService.countByStatus(InvoiceStatus.OVERDUE)

        // Get expiring subscriptions (next 7 days)
        val expiringSubscriptions = subscriptionRepository.findExpiringBefore(
            LocalDate.now().plusDays(7),
            Pageable.unpaged()
        ).totalElements

        return ResponseEntity.ok(
            DashboardSummaryResponse(
                totalMembers = totalMembers,
                activeSubscriptions = activeSubscriptions,
                expiringSubscriptionsThisWeek = expiringSubscriptions,
                todayCheckIns = todayCheckIns,
                currentlyCheckedIn = currentlyCheckedIn,
                pendingInvoicesCount = pendingInvoicesCount,
                overdueInvoicesCount = overdueInvoicesCount
            )
        )
    }

    /**
     * Gets today's attendance overview.
     */
    @GetMapping("/attendance/today")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getTodayAttendance(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<TodayAttendanceResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "checkInTime"))
        val todayRecords = attendanceService.getTodayAttendance(pageable)

        return ResponseEntity.ok(
            TodayAttendanceResponse(
                totalCheckIns = attendanceService.getTodayCheckInCount(),
                currentlyCheckedIn = attendanceService.getCurrentlyCheckedInCount(),
                recentCheckIns = todayRecords.content.map { record ->
                    AttendanceSummaryItem(
                        id = record.id,
                        memberId = record.memberId,
                        locationId = record.locationId,
                        checkInTime = record.checkInTime.toString(),
                        checkOutTime = record.checkOutTime?.toString(),
                        status = record.status.name
                    )
                }
            )
        )
    }

    /**
     * Gets subscriptions expiring soon.
     */
    @GetMapping("/subscriptions/expiring")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getExpiringSubscriptions(
        @RequestParam(defaultValue = "7") daysAhead: Int,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<ExpiringSubscriptionsResponse> {
        val expirationDate = LocalDate.now().plusDays(daysAhead.toLong())
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "endDate"))
        val expiringPage = subscriptionRepository.findExpiringBefore(expirationDate, pageable)

        return ResponseEntity.ok(
            ExpiringSubscriptionsResponse(
                totalExpiring = expiringPage.totalElements,
                subscriptions = expiringPage.content.map { sub ->
                    SubscriptionSummaryItem(
                        id = sub.id,
                        memberId = sub.memberId,
                        planId = sub.planId,
                        status = sub.status.name,
                        startDate = sub.startDate.toString(),
                        endDate = sub.endDate.toString(),
                        daysRemaining = sub.daysRemaining()
                    )
                }
            )
        )
    }

    /**
     * Gets pending and overdue invoices.
     */
    @GetMapping("/invoices/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getPendingInvoices(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PendingInvoicesResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "dueDate"))
        val pendingInvoices = invoiceService.getPendingInvoices(pageable)
        val overdueInvoices = invoiceService.getOverdueInvoices(Pageable.unpaged())

        // Calculate total pending amount
        var totalPendingAmount = BigDecimal.ZERO
        pendingInvoices.content.forEach { inv ->
            totalPendingAmount = totalPendingAmount.add(inv.remainingBalance().amount)
        }
        overdueInvoices.content.forEach { inv ->
            totalPendingAmount = totalPendingAmount.add(inv.remainingBalance().amount)
        }

        return ResponseEntity.ok(
            PendingInvoicesResponse(
                pendingCount = invoiceService.countByStatus(InvoiceStatus.ISSUED),
                overdueCount = invoiceService.countByStatus(InvoiceStatus.OVERDUE),
                totalPendingAmount = totalPendingAmount,
                currency = "SAR",
                invoices = pendingInvoices.content.map { inv ->
                    InvoiceSummaryItem(
                        id = inv.id,
                        invoiceNumber = inv.invoiceNumber,
                        memberId = inv.memberId,
                        status = inv.status.name,
                        totalAmount = inv.totalAmount.amount,
                        remainingBalance = inv.remainingBalance().amount,
                        dueDate = inv.dueDate?.toString(),
                        isOverdue = inv.isOverdue()
                    )
                }
            )
        )
    }
}

// Response DTOs

data class DashboardSummaryResponse(
    val totalMembers: Long,
    val activeSubscriptions: Long,
    val expiringSubscriptionsThisWeek: Long,
    val todayCheckIns: Long,
    val currentlyCheckedIn: Long,
    val pendingInvoicesCount: Long,
    val overdueInvoicesCount: Long
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
