package com.liyaqa.member.domain.model

/**
 * Dashboard aggregate domain model containing all data for the home screen.
 * Aligned with backend MobileHomeDashboardDto.
 */
data class DashboardData(
    val member: Member,
    val subscription: Subscription?,
    val attendanceStats: AttendanceStats,
    val upcomingClasses: List<Booking>,
    val pendingInvoices: PendingInvoicesSummary,
    val unreadNotifications: Int
) {
    /**
     * Returns true if the member has an active subscription.
     */
    val hasActiveSubscription: Boolean
        get() = subscription?.status == SubscriptionStatus.ACTIVE

    /**
     * Returns true if there are pending invoices requiring attention.
     */
    val hasPendingInvoices: Boolean
        get() = pendingInvoices.count > 0

    /**
     * Returns true if there are overdue invoices.
     */
    val hasOverdueInvoices: Boolean
        get() = pendingInvoices.overdueCount > 0
}

/**
 * Summary of pending invoices for the dashboard.
 * Aligned with backend PendingInvoicesSummaryDto.
 */
data class PendingInvoicesSummary(
    val count: Int,
    val totalDue: Double,
    val overdueCount: Int
)
