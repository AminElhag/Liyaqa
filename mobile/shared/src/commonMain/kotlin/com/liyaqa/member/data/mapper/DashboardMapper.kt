package com.liyaqa.member.data.mapper

import com.liyaqa.member.data.dto.AttendanceStatsDto
import com.liyaqa.member.data.dto.MemberSummaryDto
import com.liyaqa.member.data.dto.MobileHomeDashboardDto
import com.liyaqa.member.data.dto.PendingInvoicesSummaryDto
import com.liyaqa.member.data.dto.SubscriptionSummaryDto
import com.liyaqa.member.data.dto.UpcomingClassDto
import com.liyaqa.member.domain.model.AttendanceStats
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.BookingStatus
import com.liyaqa.member.domain.model.DashboardData
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.MemberStatus
import com.liyaqa.member.domain.model.PendingInvoicesSummary
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.model.SubscriptionStatus
import kotlinx.datetime.Clock

/**
 * Mappers for dashboard-related DTOs to domain models.
 */

/**
 * Maps dashboard response to domain DashboardData.
 */
fun MobileHomeDashboardDto.toDomain(): DashboardData = DashboardData(
    member = member.toDomain(),
    subscription = subscription?.toDomain(),
    attendanceStats = attendanceStats.toDomain(),
    upcomingClasses = upcomingClasses.map { it.toDomain() },
    pendingInvoices = pendingInvoices.toDomain(),
    unreadNotifications = unreadNotifications
)

/**
 * Maps member summary to domain Member.
 * Note: Address and emergencyContact are not included in summary.
 */
fun MemberSummaryDto.toDomain(): Member = Member(
    id = id,
    firstName = firstName,
    lastName = lastName,
    fullName = fullName,
    email = email,
    phone = null, // Not in summary
    dateOfBirth = null, // Not in summary
    address = null, // Not in summary
    emergencyContact = null, // Not in summary
    status = MemberStatus.valueOf(status)
)

/**
 * Maps subscription summary to domain Subscription.
 * Note: Some fields are not available in summary response.
 */
fun SubscriptionSummaryDto.toDomain(): Subscription = Subscription(
    id = id,
    planName = planName.toDomain(),
    status = SubscriptionStatus.valueOf(status),
    startDate = endDate.toLocalDate(), // Not in summary, use endDate as placeholder
    endDate = endDate.toLocalDate(),
    daysRemaining = daysRemaining.toInt(),
    classesRemaining = classesRemaining,
    totalClasses = null, // Not in summary
    autoRenew = false, // Not in summary
    frozenUntil = null, // Not in summary
    isExpiringSoon = isExpiringSoon
)

/**
 * Maps upcoming class to domain Booking.
 */
fun UpcomingClassDto.toDomain(): Booking = Booking(
    id = bookingId,
    sessionId = sessionId,
    className = className.toDomain(),
    sessionDate = sessionDate.toLocalDate(),
    startTime = startTime.toLocalTime(),
    endTime = endTime.toLocalTime(),
    location = null, // Not in upcoming class summary
    trainer = null, // Not in upcoming class summary
    status = BookingStatus.valueOf(status),
    checkedIn = false, // Not in upcoming class summary
    bookedAt = Clock.System.now() // Not in upcoming class summary
)

/**
 * Maps attendance stats DTO to domain model.
 * Note: averageVisitsPerMonth is calculated in domain model if needed.
 */
fun AttendanceStatsDto.toDomain(): AttendanceStats = AttendanceStats(
    totalVisits = totalVisits.toInt(),
    thisMonthVisits = thisMonthVisits,
    lastMonthVisits = lastMonthVisits,
    averageVisitsPerMonth = if (totalVisits > 0) totalVisits.toFloat() / 12f else 0f // Approximate
)

/**
 * Maps pending invoices summary DTO to domain model.
 * Note: overdueCount is derived from hasOverdue boolean.
 */
fun PendingInvoicesSummaryDto.toDomain(): PendingInvoicesSummary = PendingInvoicesSummary(
    count = count,
    totalDue = totalAmount,
    overdueCount = if (hasOverdue) 1 else 0 // Backend only provides boolean
)

/**
 * Maps QuickStatsDto to domain QuickStats.
 */
fun com.liyaqa.member.data.dto.QuickStatsDto.toDomain(): com.liyaqa.member.domain.model.QuickStats =
    com.liyaqa.member.domain.model.QuickStats(
        memberSince = memberSince,
        totalVisits = totalVisits,
        averageVisitsPerMonth = averageVisitsPerMonth,
        classesRemaining = classesRemaining,
        daysRemaining = daysRemaining,
        subscriptionStatus = SubscriptionStatus.valueOf(subscriptionStatus)
    )
