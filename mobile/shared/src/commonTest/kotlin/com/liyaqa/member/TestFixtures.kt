package com.liyaqa.member

import com.liyaqa.member.core.localization.LocalizedText
import com.liyaqa.member.domain.model.Address
import com.liyaqa.member.domain.model.AttendanceStats
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.BookingStatus
import com.liyaqa.member.domain.model.DashboardData
import com.liyaqa.member.domain.model.EmergencyContact
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.MemberStatus
import com.liyaqa.member.domain.model.PagedResult
import com.liyaqa.member.domain.model.PendingInvoicesSummary
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.model.SubscriptionStatus
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.plus
import kotlinx.datetime.toLocalDateTime

/**
 * Test data factories for creating domain objects in tests.
 */
object TestFixtures {

    /**
     * Creates a test Member.
     */
    fun createMember(
        id: String = "member-1",
        firstName: String = "John",
        lastName: String = "Doe",
        email: String = "john.doe@example.com",
        phone: String? = "+966501234567",
        status: MemberStatus = MemberStatus.ACTIVE
    ): Member = Member(
        id = id,
        firstName = firstName,
        lastName = lastName,
        fullName = "$firstName $lastName",
        email = email,
        phone = phone,
        dateOfBirth = LocalDate(1990, 1, 15),
        address = Address(
            street = LocalizedText(en = "123 Main St", ar = "123 شارع الرئيسي"),
            city = "Riyadh",
            state = "Riyadh",
            postalCode = "12345",
            country = "SA"
        ),
        emergencyContact = EmergencyContact(
            name = "Jane Doe",
            phone = "+966507654321"
        ),
        status = status
    )

    /**
     * Creates a test Subscription.
     */
    fun createSubscription(
        id: String = "sub-1",
        planName: String = "Premium Monthly",
        status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
        daysRemaining: Int = 25,
        classesRemaining: Int? = 15,
        totalClasses: Int? = 20,
        isExpiringSoon: Boolean = false
    ): Subscription {
        val today = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).date
        return Subscription(
            id = id,
            planName = LocalizedText(en = planName, ar = "اشتراك شهري متميز"),
            status = status,
            startDate = today.plus(-5, DateTimeUnit.DAY),
            endDate = today.plus(daysRemaining, DateTimeUnit.DAY),
            daysRemaining = daysRemaining,
            classesRemaining = classesRemaining,
            totalClasses = totalClasses,
            autoRenew = true,
            frozenUntil = null,
            isExpiringSoon = isExpiringSoon
        )
    }

    /**
     * Creates test AttendanceStats.
     */
    fun createAttendanceStats(
        totalVisits: Int = 45,
        thisMonthVisits: Int = 12,
        lastMonthVisits: Int = 10,
        averageVisitsPerMonth: Float = 11.0f
    ): AttendanceStats = AttendanceStats(
        totalVisits = totalVisits,
        thisMonthVisits = thisMonthVisits,
        lastMonthVisits = lastMonthVisits,
        averageVisitsPerMonth = averageVisitsPerMonth
    )

    /**
     * Creates a test Booking.
     */
    fun createBooking(
        id: String = "booking-1",
        sessionId: String = "session-1",
        className: String = "Yoga Class",
        status: BookingStatus = BookingStatus.CONFIRMED,
        checkedIn: Boolean = false,
        daysFromNow: Int = 1
    ): Booking {
        val today = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).date
        return Booking(
            id = id,
            sessionId = sessionId,
            className = LocalizedText(en = className, ar = "حصة يوجا"),
            sessionDate = today.plus(daysFromNow, DateTimeUnit.DAY),
            startTime = LocalTime(10, 0),
            endTime = LocalTime(11, 0),
            location = "Main Studio",
            trainer = "Ahmed Hassan",
            status = status,
            checkedIn = checkedIn,
            bookedAt = Clock.System.now()
        )
    }

    /**
     * Creates test PendingInvoicesSummary.
     */
    fun createPendingInvoicesSummary(
        count: Int = 2,
        totalDue: Double = 500.0,
        overdueCount: Int = 1
    ): PendingInvoicesSummary = PendingInvoicesSummary(
        count = count,
        totalDue = totalDue,
        overdueCount = overdueCount
    )

    /**
     * Creates a test DashboardData.
     */
    fun createDashboardData(
        member: Member = createMember(),
        subscription: Subscription? = createSubscription(),
        attendanceStats: AttendanceStats = createAttendanceStats(),
        upcomingClasses: List<Booking> = listOf(createBooking()),
        pendingInvoices: PendingInvoicesSummary = createPendingInvoicesSummary(),
        unreadNotifications: Int = 3
    ): DashboardData = DashboardData(
        member = member,
        subscription = subscription,
        attendanceStats = attendanceStats,
        upcomingClasses = upcomingClasses,
        pendingInvoices = pendingInvoices,
        unreadNotifications = unreadNotifications
    )

    /**
     * Creates a list of test bookings.
     */
    fun createBookingList(count: Int = 5): List<Booking> = (1..count).map { index ->
        createBooking(
            id = "booking-$index",
            sessionId = "session-$index",
            className = "Class $index",
            daysFromNow = index
        )
    }

    /**
     * Creates a paged result of bookings.
     */
    fun createPagedBookings(
        items: List<Booking> = createBookingList(5),
        hasMore: Boolean = true,
        totalCount: Long? = 10
    ): PagedResult<Booking> = PagedResult(
        items = items,
        hasMore = hasMore,
        totalCount = totalCount
    )
}
