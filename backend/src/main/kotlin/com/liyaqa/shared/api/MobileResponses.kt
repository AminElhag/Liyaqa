package com.liyaqa.shared.api

import com.liyaqa.attendance.domain.model.AttendanceRecord
import com.liyaqa.attendance.domain.model.AttendanceStatus
import com.liyaqa.attendance.domain.model.CheckInMethod
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.notification.domain.model.Notification
import com.liyaqa.notification.domain.model.NotificationChannel
import com.liyaqa.notification.domain.model.NotificationStatus
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.ClassBooking
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.shared.domain.LocalizedText
import java.math.BigDecimal
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Mobile-optimized Lite DTOs for bandwidth efficiency.
 * These contain only essential fields for list views and quick lookups.
 */

// ==================== MEMBER LITE ====================

data class MemberLiteResponse(
    val id: UUID,
    val firstName: LocalizedTextResponse,
    val lastName: LocalizedTextResponse,
    val fullName: LocalizedTextResponse,
    val email: String,
    val phone: String?,
    val status: MemberStatus,
    val createdAt: Instant
) {
    companion object {
        fun from(member: Member) = MemberLiteResponse(
            id = member.id,
            firstName = LocalizedTextResponse.from(member.firstName),
            lastName = LocalizedTextResponse.from(member.lastName),
            fullName = LocalizedTextResponse.from(member.fullName),
            email = member.email,
            phone = member.phone,
            status = member.status,
            createdAt = member.createdAt
        )
    }
}

// ==================== SUBSCRIPTION LITE ====================

data class SubscriptionLiteResponse(
    val id: UUID,
    val planName: LocalizedTextResponse,
    val status: SubscriptionStatus,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val daysRemaining: Long,
    val classesRemaining: Int?,
    val isExpiringSoon: Boolean // True if <= 7 days remaining
) {
    companion object {
        fun from(subscription: Subscription, planName: LocalizedText) = SubscriptionLiteResponse(
            id = subscription.id,
            planName = LocalizedTextResponse.from(planName),
            status = subscription.status,
            startDate = subscription.startDate,
            endDate = subscription.endDate,
            daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), subscription.endDate).coerceAtLeast(0),
            classesRemaining = subscription.classesRemaining,
            isExpiringSoon = ChronoUnit.DAYS.between(LocalDate.now(), subscription.endDate) <= 7
        )
    }
}

// ==================== CLASS SESSION LITE ====================

data class ClassSessionLiteResponse(
    val id: UUID,
    val className: LocalizedTextResponse,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val durationMinutes: Int,
    val capacity: Int,
    val spotsRemaining: Int,
    val status: SessionStatus,
    val trainerId: UUID?,
    val trainerName: String?,
    val locationId: UUID?,
    val bookingStatus: BookingStatus? = null // null if member hasn't booked
) {
    companion object {
        fun from(
            session: ClassSession,
            gymClass: GymClass,
            trainerName: String? = null,
            bookingStatus: BookingStatus? = null
        ) = ClassSessionLiteResponse(
            id = session.id,
            className = LocalizedTextResponse.from(gymClass.name),
            sessionDate = session.sessionDate,
            startTime = session.startTime,
            endTime = session.endTime,
            durationMinutes = Duration.between(session.startTime, session.endTime).toMinutes().toInt(),
            capacity = session.maxCapacity,
            spotsRemaining = session.availableSpots(),
            status = session.status,
            trainerId = session.trainerId,
            trainerName = trainerName,
            locationId = session.locationId,
            bookingStatus = bookingStatus
        )
    }
}

// ==================== BOOKING LITE ====================

data class BookingLiteResponse(
    val id: UUID,
    val sessionId: UUID,
    val className: LocalizedTextResponse,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val status: BookingStatus,
    val checkedIn: Boolean,
    val bookedAt: Instant
) {
    companion object {
        fun from(
            booking: ClassBooking,
            session: ClassSession,
            gymClass: GymClass
        ) = BookingLiteResponse(
            id = booking.id,
            sessionId = booking.sessionId,
            className = LocalizedTextResponse.from(gymClass.name),
            sessionDate = session.sessionDate,
            startTime = session.startTime,
            endTime = session.endTime,
            status = booking.status,
            checkedIn = booking.checkedInAt != null,
            bookedAt = booking.createdAt
        )
    }
}

// ==================== INVOICE LITE ====================

data class InvoiceLiteResponse(
    val id: UUID,
    val invoiceNumber: String,
    val totalAmount: BigDecimal,
    val currency: String,
    val status: InvoiceStatus,
    val issueDate: LocalDate?,
    val dueDate: LocalDate?,
    val isOverdue: Boolean
) {
    companion object {
        fun from(invoice: Invoice) = InvoiceLiteResponse(
            id = invoice.id,
            invoiceNumber = invoice.invoiceNumber,
            totalAmount = invoice.totalAmount.amount,
            currency = invoice.totalAmount.currency,
            status = invoice.status,
            issueDate = invoice.issueDate,
            dueDate = invoice.dueDate,
            isOverdue = invoice.status == InvoiceStatus.OVERDUE ||
                (invoice.dueDate != null && invoice.dueDate!! < LocalDate.now() &&
                    invoice.status in listOf(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID))
        )
    }
}

// ==================== NOTIFICATION LITE ====================

data class NotificationLiteResponse(
    val id: UUID,
    val type: NotificationType,
    val subjectEn: String,
    val subjectAr: String?,
    val shortBodyEn: String, // First 100 chars
    val shortBodyAr: String?,
    val channel: NotificationChannel,
    val status: NotificationStatus,
    val isRead: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(notification: Notification) = NotificationLiteResponse(
            id = notification.id,
            type = notification.notificationType,
            subjectEn = notification.subject?.en ?: "",
            subjectAr = notification.subject?.ar,
            shortBodyEn = notification.body.en.take(100) + if (notification.body.en.length > 100) "..." else "",
            shortBodyAr = notification.body.ar?.let { it.take(100) + if (it.length > 100) "..." else "" },
            channel = notification.channel,
            status = notification.status,
            isRead = notification.readAt != null,
            createdAt = notification.createdAt
        )
    }
}

// ==================== ATTENDANCE LITE ====================

data class AttendanceLiteResponse(
    val id: UUID,
    val memberId: UUID,
    val locationId: UUID,
    val checkInTime: Instant,
    val checkOutTime: Instant?,
    val durationMinutes: Long?,
    val status: AttendanceStatus,
    val checkInMethod: CheckInMethod
) {
    companion object {
        fun from(record: AttendanceRecord) = AttendanceLiteResponse(
            id = record.id,
            memberId = record.memberId,
            locationId = record.locationId,
            checkInTime = record.checkInTime,
            checkOutTime = record.checkOutTime,
            durationMinutes = record.checkOutTime?.let {
                Duration.between(record.checkInTime, it).toMinutes()
            },
            status = record.status,
            checkInMethod = record.checkInMethod
        )
    }
}

// ==================== MOBILE PAGE RESPONSE ====================

/**
 * Cursor-based pagination for mobile apps.
 * More efficient than offset-based for infinite scroll.
 */
data class MobilePageResponse<T>(
    val items: List<T>,
    val itemCount: Int,
    val hasMore: Boolean,
    val nextCursor: String? = null,
    val totalCount: Long? = null // Optional, expensive to compute
)

// ==================== LOCALIZED TEXT RESPONSE ====================

data class LocalizedTextResponse(
    val en: String,
    val ar: String?
) {
    companion object {
        fun from(text: LocalizedText) = LocalizedTextResponse(
            en = text.en,
            ar = text.ar
        )
    }
}
