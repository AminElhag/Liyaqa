package com.liyaqa.member.data.dto

import kotlinx.serialization.Serializable

/**
 * Dashboard DTOs matching backend MobileApiController responses.
 */

/**
 * Main dashboard response from /api/mobile/home.
 * Matches backend MobileHomeDashboardResponse.
 */
@Serializable
data class MobileHomeDashboardDto(
    val member: MemberSummaryDto,
    val subscription: SubscriptionSummaryDto?,
    val nextClass: UpcomingClassDto?,
    val upcomingClasses: List<UpcomingClassDto>,
    val totalUpcomingClasses: Int,
    val attendanceStats: AttendanceStatsDto,
    val pendingInvoices: PendingInvoicesSummaryDto,
    val unreadNotifications: Int,
    val lastUpdated: String // ISO-8601 Instant
)

/**
 * Member summary for dashboard display.
 * Matches backend MemberSummary.
 */
@Serializable
data class MemberSummaryDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val email: String,
    val status: String // MemberStatus enum as string
)

/**
 * Subscription summary for dashboard display.
 * Matches backend SubscriptionSummary.
 */
@Serializable
data class SubscriptionSummaryDto(
    val id: String,
    val planName: LocalizedTextDto,
    val status: String, // SubscriptionStatus enum as string
    val daysRemaining: Long,
    val classesRemaining: Int?,
    val endDate: String, // ISO-8601 LocalDate
    val isExpiringSoon: Boolean
)

/**
 * Upcoming class/booking summary for dashboard.
 * Matches backend UpcomingClassSummary.
 */
@Serializable
data class UpcomingClassDto(
    val bookingId: String,
    val sessionId: String,
    val className: LocalizedTextDto,
    val sessionDate: String, // ISO-8601 LocalDate
    val startTime: String, // ISO-8601 LocalTime (HH:mm:ss)
    val endTime: String, // ISO-8601 LocalTime (HH:mm:ss)
    val status: String // BookingStatus enum as string
)

/**
 * Attendance statistics for dashboard.
 * Matches backend AttendanceStats.
 *
 * Note: Backend uses Long for totalVisits.
 */
@Serializable
data class AttendanceStatsDto(
    val totalVisits: Long,
    val thisMonthVisits: Int,
    val lastMonthVisits: Int
)

/**
 * Pending invoices summary for dashboard alert.
 * Matches backend PendingInvoicesSummary.
 *
 * Note: Backend uses hasOverdue (Boolean) not overdueCount.
 */
@Serializable
data class PendingInvoicesSummaryDto(
    val count: Int,
    val totalAmount: Double,
    val hasOverdue: Boolean
)

/**
 * Quick stats response from /api/mobile/quick-stats.
 * Matches backend QuickStats.
 */
@Serializable
data class QuickStatsDto(
    val memberSince: String, // ISO-8601 LocalDate
    val totalVisits: Long,
    val averageVisitsPerMonth: Double,
    val classesRemaining: Int?,
    val daysRemaining: Long?,
    val subscriptionStatus: String // SubscriptionStatus enum as string
)
