package com.liyaqa.scheduling.application.services

import com.liyaqa.membership.domain.model.Member
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.shared.domain.LocalizedText
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.format.DateTimeFormatter

/**
 * Service responsible for sending booking-related notifications.
 * Handles:
 * - Booking confirmation notifications
 * - Waitlist added notifications
 * - Booking cancellation notifications
 * - Waitlist promotion notifications
 */
@Service
class BookingNotificationService(
    private val notificationService: NotificationService
) {
    private val logger = LoggerFactory.getLogger(BookingNotificationService::class.java)
    private val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

    /**
     * Sends a booking confirmation notification to the member.
     */
    fun sendBookingConfirmation(member: Member, session: ClassSession, gymClass: GymClass) {
        val className = gymClass.name.en
        val classNameAr = gymClass.name.ar ?: className
        val sessionDate = session.sessionDate.format(dateFormatter)
        val sessionTime = session.startTime.format(timeFormatter)

        val subject = LocalizedText(
            en = "Class Booking Confirmed - $className",
            ar = "تأكيد حجز الحصة - $classNameAr"
        )

        val body = LocalizedText(
            en = """
                <h2>Booking Confirmed</h2>
                <p>Dear ${member.fullName},</p>
                <p>Your booking for <strong>$className</strong> has been confirmed.</p>
                <p><strong>Date:</strong> $sessionDate</p>
                <p><strong>Time:</strong> $sessionTime</p>
                <p>We look forward to seeing you!</p>
                <p>Best regards,<br>Liyaqa Team</p>
            """.trimIndent(),
            ar = """
                <h2>تم تأكيد الحجز</h2>
                <p>عزيزي ${member.fullName}،</p>
                <p>تم تأكيد حجزك لحصة <strong>$classNameAr</strong>.</p>
                <p><strong>التاريخ:</strong> $sessionDate</p>
                <p><strong>الوقت:</strong> $sessionTime</p>
                <p>نتطلع لرؤيتك!</p>
                <p>مع تحيات،<br>فريق لياقة</p>
            """.trimIndent()
        )

        notificationService.sendMultiChannel(
            memberId = member.id,
            email = member.email,
            phone = member.phone,
            type = NotificationType.CLASS_BOOKING_CONFIRMED,
            subject = subject,
            body = body,
            priority = NotificationPriority.NORMAL,
            referenceId = session.id,
            referenceType = "class_session"
        )

        logger.info("Sent booking confirmation to member ${member.id} for session ${session.id}")
    }

    /**
     * Sends a waitlist notification to the member.
     */
    fun sendWaitlistAdded(member: Member, session: ClassSession, gymClass: GymClass, position: Int) {
        val className = gymClass.name.en
        val classNameAr = gymClass.name.ar ?: className
        val sessionDate = session.sessionDate.format(dateFormatter)
        val sessionTime = session.startTime.format(timeFormatter)

        val subject = LocalizedText(
            en = "Added to Waitlist - $className",
            ar = "تمت الإضافة إلى قائمة الانتظار - $classNameAr"
        )

        val body = LocalizedText(
            en = """
                <h2>Added to Waitlist</h2>
                <p>Dear ${member.fullName},</p>
                <p>The class <strong>$className</strong> is currently full.</p>
                <p>You have been added to the waitlist at position <strong>#$position</strong>.</p>
                <p><strong>Date:</strong> $sessionDate</p>
                <p><strong>Time:</strong> $sessionTime</p>
                <p>We'll notify you if a spot becomes available.</p>
                <p>Best regards,<br>Liyaqa Team</p>
            """.trimIndent(),
            ar = """
                <h2>تمت الإضافة إلى قائمة الانتظار</h2>
                <p>عزيزي ${member.fullName}،</p>
                <p>حصة <strong>$classNameAr</strong> ممتلئة حالياً.</p>
                <p>تمت إضافتك إلى قائمة الانتظار في المركز <strong>#$position</strong>.</p>
                <p><strong>التاريخ:</strong> $sessionDate</p>
                <p><strong>الوقت:</strong> $sessionTime</p>
                <p>سنخبرك عندما يتوفر مكان.</p>
                <p>مع تحيات،<br>فريق لياقة</p>
            """.trimIndent()
        )

        notificationService.sendEmail(
            memberId = member.id,
            email = member.email,
            type = NotificationType.CLASS_BOOKING_CONFIRMED,
            subject = subject,
            body = body,
            priority = NotificationPriority.NORMAL,
            referenceId = session.id,
            referenceType = "class_session"
        )

        logger.info("Sent waitlist notification to member ${member.id} for session ${session.id}, position $position")
    }

    /**
     * Sends a booking cancellation notification to the member.
     */
    fun sendBookingCancellation(member: Member, session: ClassSession, gymClass: GymClass) {
        val className = gymClass.name.en
        val classNameAr = gymClass.name.ar ?: className
        val sessionDate = session.sessionDate.format(dateFormatter)
        val sessionTime = session.startTime.format(timeFormatter)

        val subject = LocalizedText(
            en = "Booking Cancelled - $className",
            ar = "تم إلغاء الحجز - $classNameAr"
        )

        val body = LocalizedText(
            en = """
                <h2>Booking Cancelled</h2>
                <p>Dear ${member.fullName},</p>
                <p>Your booking for <strong>$className</strong> has been cancelled.</p>
                <p><strong>Date:</strong> $sessionDate</p>
                <p><strong>Time:</strong> $sessionTime</p>
                <p>If you didn't request this cancellation, please contact us.</p>
                <p>Best regards,<br>Liyaqa Team</p>
            """.trimIndent(),
            ar = """
                <h2>تم إلغاء الحجز</h2>
                <p>عزيزي ${member.fullName}،</p>
                <p>تم إلغاء حجزك لحصة <strong>$classNameAr</strong>.</p>
                <p><strong>التاريخ:</strong> $sessionDate</p>
                <p><strong>الوقت:</strong> $sessionTime</p>
                <p>إذا لم تطلب هذا الإلغاء، يرجى الاتصال بنا.</p>
                <p>مع تحيات،<br>فريق لياقة</p>
            """.trimIndent()
        )

        notificationService.sendEmail(
            memberId = member.id,
            email = member.email,
            type = NotificationType.CLASS_BOOKING_CANCELLED,
            subject = subject,
            body = body,
            priority = NotificationPriority.NORMAL,
            referenceId = session.id,
            referenceType = "class_session"
        )

        logger.info("Sent cancellation notification to member ${member.id} for session ${session.id}")
    }

    /**
     * Sends a waitlist promotion notification to the member.
     */
    fun sendWaitlistPromotion(member: Member, session: ClassSession, gymClass: GymClass) {
        val className = gymClass.name.en
        val classNameAr = gymClass.name.ar ?: className
        val sessionDate = session.sessionDate.format(dateFormatter)
        val sessionTime = session.startTime.format(timeFormatter)

        val subject = LocalizedText(
            en = "Good News! You're In - $className",
            ar = "أخبار سارة! تم تأكيد مكانك - $classNameAr"
        )

        val body = LocalizedText(
            en = """
                <h2>You're Off the Waitlist!</h2>
                <p>Dear ${member.fullName},</p>
                <p>Great news! A spot has opened up for <strong>$className</strong>.</p>
                <p>Your booking is now <strong>confirmed</strong>!</p>
                <p><strong>Date:</strong> $sessionDate</p>
                <p><strong>Time:</strong> $sessionTime</p>
                <p>We look forward to seeing you!</p>
                <p>Best regards,<br>Liyaqa Team</p>
            """.trimIndent(),
            ar = """
                <h2>تمت ترقيتك من قائمة الانتظار!</h2>
                <p>عزيزي ${member.fullName}،</p>
                <p>أخبار سارة! تم توفر مكان في حصة <strong>$classNameAr</strong>.</p>
                <p>حجزك الآن <strong>مؤكد</strong>!</p>
                <p><strong>التاريخ:</strong> $sessionDate</p>
                <p><strong>الوقت:</strong> $sessionTime</p>
                <p>نتطلع لرؤيتك!</p>
                <p>مع تحيات،<br>فريق لياقة</p>
            """.trimIndent()
        )

        notificationService.sendMultiChannel(
            memberId = member.id,
            email = member.email,
            phone = member.phone,
            type = NotificationType.CLASS_WAITLIST_PROMOTED,
            subject = subject,
            body = body,
            priority = NotificationPriority.HIGH,
            referenceId = session.id,
            referenceType = "class_session"
        )

        logger.info("Sent waitlist promotion notification to member ${member.id} for session ${session.id}")
    }
}
