package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Mobile home dashboard aggregated response
 */
@Serializable
data class HomeDashboard(
    val member: MemberSummary,
    val subscription: SubscriptionSummary?,
    val upcomingClasses: List<Booking>,
    val attendanceStats: AttendanceStatsSummary,
    val pendingInvoices: List<Invoice>,
    val unreadNotificationsCount: Int
)

/**
 * Attendance stats summary for dashboard
 */
@Serializable
data class AttendanceStatsSummary(
    val memberSince: String,
    val totalVisits: Int,
    val averageVisitsPerMonth: Double
)

/**
 * Quick stats for widgets
 */
@Serializable
data class QuickStats(
    val memberSince: String,
    val totalVisits: Int,
    val averageVisitsPerMonth: Double,
    val subscriptionStatus: SubscriptionStatus?,
    val daysRemaining: Int?,
    val classesRemaining: Int?
)

/**
 * App initialization response
 */
@Serializable
data class AppInit(
    val member: Member,
    val subscription: SubscriptionMinimal?,
    val features: FeatureFlags
)

/**
 * Feature flags for the app
 */
@Serializable
data class FeatureFlags(
    val ptBookingEnabled: Boolean = true,
    val walletEnabled: Boolean = true,
    val selfCheckInEnabled: Boolean = true,
    val prayerTimesEnabled: Boolean = true,
    val onlinePaymentEnabled: Boolean = true,
    val referralsEnabled: Boolean = false,
    val wearablesEnabled: Boolean = true
)

/**
 * Paginated response for mobile APIs
 */
@Serializable
data class PagedResponse<T>(
    val items: List<T>,
    val itemCount: Int,
    val hasMore: Boolean,
    val totalCount: Int? = null,
    val nextCursor: String? = null
)

/**
 * Generic message response
 */
@Serializable
data class MessageResponse(
    val success: Boolean,
    val message: String,
    val messageAr: String? = null
)
