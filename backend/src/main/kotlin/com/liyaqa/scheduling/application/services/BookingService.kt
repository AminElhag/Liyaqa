package com.liyaqa.scheduling.application.services

import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.scheduling.application.commands.CancelBookingCommand
import com.liyaqa.scheduling.application.commands.CreateBookingCommand
import com.liyaqa.scheduling.domain.model.BookingPaymentSource
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.ClassBooking
import com.liyaqa.scheduling.domain.model.ClassPack
import com.liyaqa.scheduling.domain.model.ClassPricingModel
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.MemberClassPackBalance
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
import com.liyaqa.scheduling.domain.ports.ClassPackRepository
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import com.liyaqa.scheduling.domain.ports.MemberClassPackBalanceRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.webhook.application.services.WebhookEventPublisher
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.UUID

/**
 * Response for booking options - shows available payment methods for a session.
 */
data class BookingOptionsResponse(
    val sessionId: UUID,
    val memberId: UUID,
    val canBook: Boolean,
    val reason: String? = null,
    val membershipOption: MembershipBookingOption? = null,
    val classPackOptions: List<ClassPackBookingOption> = emptyList(),
    val payPerEntryOption: PayPerEntryOption? = null
)

data class MembershipBookingOption(
    val available: Boolean,
    val classesRemaining: Int?,
    val reason: String? = null
)

data class ClassPackBookingOption(
    val balanceId: UUID,
    val packName: LocalizedText,
    val classesRemaining: Int,
    val expiresAt: Instant?
)

data class PayPerEntryOption(
    val available: Boolean,
    val price: Money,
    val taxRate: BigDecimal,
    val totalWithTax: Money
)

/**
 * Command for creating a booking with a specific payment source.
 */
data class CreateBookingWithPaymentCommand(
    val sessionId: UUID,
    val memberId: UUID,
    val paymentSource: BookingPaymentSource,
    val classPackBalanceId: UUID? = null,
    val orderId: UUID? = null,
    val paidAmount: Money? = null,
    val notes: String? = null,
    val bookedBy: UUID? = null
)

@Service
@Transactional
class BookingService(
    private val bookingRepository: ClassBookingRepository,
    private val sessionRepository: ClassSessionRepository,
    private val gymClassRepository: GymClassRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val memberRepository: MemberRepository,
    private val notificationService: NotificationService,
    private val webhookPublisher: WebhookEventPublisher,
    private val classPackRepository: ClassPackRepository,
    private val balanceRepository: MemberClassPackBalanceRepository
) {
    private val logger = LoggerFactory.getLogger(BookingService::class.java)
    private val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
    /**
     * Books a member into a class session.
     * If the session is full and waitlist is enabled, adds to waitlist.
     * Validates subscription if the class requires one.
     */
    fun createBooking(command: CreateBookingCommand): ClassBooking {
        val session = sessionRepository.findById(command.sessionId)
            .orElseThrow { NoSuchElementException("Session not found: ${command.sessionId}") }

        // Verify session is bookable
        require(session.status == SessionStatus.SCHEDULED) {
            "Cannot book a ${session.status} session"
        }

        // Check if member already has a booking for this session
        val existingBooking = bookingRepository.existsBySessionIdAndMemberIdAndStatusIn(
            command.sessionId,
            command.memberId,
            listOf(BookingStatus.CONFIRMED, BookingStatus.WAITLISTED)
        )
        require(!existingBooking) {
            "Member already has an active booking for this session"
        }

        // Check for overlapping bookings on the same day
        validateNoOverlappingBookings(command.memberId, session)

        val gymClass = gymClassRepository.findById(session.gymClassId)
            .orElseThrow { NoSuchElementException("Gym class not found: ${session.gymClassId}") }

        // Validate subscription if required
        var validatedSubscription: Subscription? = null
        if (gymClass.requiresSubscription) {
            validatedSubscription = validateSubscriptionForBooking(command.memberId, command.subscriptionId, gymClass.deductsClassFromPlan)
        }

        val booking: ClassBooking

        if (session.hasAvailableSpots()) {
            // Create confirmed booking
            booking = ClassBooking.createConfirmed(
                sessionId = command.sessionId,
                memberId = command.memberId,
                subscriptionId = validatedSubscription?.id ?: command.subscriptionId,
                bookedBy = command.bookedBy
            )
            booking.notes = command.notes
            session.incrementBookings()
            sessionRepository.save(session)
        } else if (gymClass.waitlistEnabled && session.canJoinWaitlist(gymClass.maxWaitlistSize)) {
            // Add to waitlist
            val waitlistPosition = session.waitlistCount + 1
            booking = ClassBooking.createWaitlisted(
                sessionId = command.sessionId,
                memberId = command.memberId,
                position = waitlistPosition,
                subscriptionId = validatedSubscription?.id ?: command.subscriptionId,
                bookedBy = command.bookedBy
            )
            booking.notes = command.notes
            session.incrementWaitlist()
            sessionRepository.save(session)
        } else {
            throw IllegalStateException("Session is full and waitlist is not available")
        }

        val savedBooking = bookingRepository.save(booking)
        logger.info("Booking created: ${savedBooking.id} for member ${command.memberId} in session ${command.sessionId}")

        // Send notification
        try {
            val member = memberRepository.findById(command.memberId).orElse(null)
            if (member != null) {
                if (savedBooking.isConfirmed()) {
                    sendBookingConfirmationNotification(member, session, gymClass)
                } else if (savedBooking.isWaitlisted()) {
                    sendWaitlistNotification(member, session, gymClass, savedBooking.waitlistPosition ?: 1)
                }
            }
        } catch (e: Exception) {
            logger.error("Failed to send booking notification: ${e.message}", e)
            // Don't fail the booking if notification fails
        }

        // Publish webhook event
        try {
            val tenantId = TenantContext.getCurrentTenant().value
            if (savedBooking.isConfirmed()) {
                webhookPublisher.publishBookingConfirmed(savedBooking, tenantId)
            } else {
                webhookPublisher.publishBookingCreated(savedBooking, tenantId)
            }
        } catch (e: Exception) {
            logger.error("Failed to publish booking webhook: ${e.message}", e)
        }

        return savedBooking
    }

    /**
     * Validates that the member doesn't have any overlapping class bookings.
     * Two sessions overlap if their time ranges intersect.
     * @param memberId The member ID
     * @param newSession The session being booked
     * @throws IllegalArgumentException if there's an overlapping booking
     */
    private fun validateNoOverlappingBookings(memberId: UUID, newSession: ClassSession) {
        val existingBookings = bookingRepository.findActiveBookingsByMemberAndDate(
            memberId,
            newSession.sessionDate
        )

        for (booking in existingBookings) {
            val existingSession = sessionRepository.findById(booking.sessionId).orElse(null) ?: continue

            if (sessionsOverlap(newSession.startTime, newSession.endTime, existingSession.startTime, existingSession.endTime)) {
                val existingClass = gymClassRepository.findById(existingSession.gymClassId).orElse(null)
                val className = existingClass?.name?.en ?: "another class"
                throw IllegalArgumentException(
                    "Cannot book: time conflicts with $className (${existingSession.startTime}-${existingSession.endTime})"
                )
            }
        }
    }

    /**
     * Checks if two time ranges overlap.
     * Two ranges [start1, end1] and [start2, end2] overlap if start1 < end2 AND start2 < end1
     */
    private fun sessionsOverlap(
        start1: LocalTime, end1: LocalTime,
        start2: LocalTime, end2: LocalTime
    ): Boolean {
        return start1.isBefore(end2) && start2.isBefore(end1)
    }

    /**
     * Validates that the member has a valid subscription for booking.
     * @param memberId The member ID
     * @param subscriptionId Optional specific subscription ID to use
     * @param requiresClassAvailability Whether the class deducts from plan (requires classes available)
     * @return The validated subscription
     * @throws IllegalStateException if no valid subscription found
     */
    private fun validateSubscriptionForBooking(
        memberId: UUID,
        subscriptionId: UUID?,
        requiresClassAvailability: Boolean
    ): Subscription {
        // If a specific subscription is provided, validate it
        val subscription = if (subscriptionId != null) {
            subscriptionRepository.findById(subscriptionId)
                .orElseThrow { IllegalArgumentException("Subscription not found: $subscriptionId") }
        } else {
            // Find member's active subscription
            subscriptionRepository.findActiveByMemberId(memberId)
                .orElseThrow { IllegalStateException("Member does not have an active subscription") }
        }

        // Verify the subscription belongs to the member
        require(subscription.memberId == memberId) {
            "Subscription does not belong to this member"
        }

        // Verify subscription is active and not expired
        require(subscription.isActive()) {
            "Subscription is not active (status: ${subscription.status}, expired: ${subscription.isExpired()})"
        }

        // If class deducts from plan, verify classes are available
        if (requiresClassAvailability) {
            require(subscription.hasClassesAvailable()) {
                "No classes remaining on subscription"
            }
        }

        return subscription
    }

    /**
     * Gets a booking by ID.
     */
    @Transactional(readOnly = true)
    fun getBooking(id: UUID): ClassBooking {
        return bookingRepository.findById(id)
            .orElseThrow { NoSuchElementException("Booking not found: $id") }
    }

    /**
     * Gets all bookings for a session.
     */
    @Transactional(readOnly = true)
    fun getBookingsBySession(sessionId: UUID): List<ClassBooking> {
        return bookingRepository.findBySessionId(sessionId)
    }

    /**
     * Gets confirmed bookings for a session.
     */
    @Transactional(readOnly = true)
    fun getConfirmedBookingsBySession(sessionId: UUID): List<ClassBooking> {
        return bookingRepository.findBySessionIdAndStatus(sessionId, BookingStatus.CONFIRMED)
    }

    /**
     * Gets waitlisted bookings for a session in order.
     */
    @Transactional(readOnly = true)
    fun getWaitlistBySession(sessionId: UUID): List<ClassBooking> {
        return bookingRepository.findWaitlistedBySessionIdOrderByPosition(sessionId)
    }

    /**
     * Gets all bookings for a member.
     */
    @Transactional(readOnly = true)
    fun getBookingsByMember(memberId: UUID, pageable: Pageable): Page<ClassBooking> {
        return bookingRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Gets upcoming bookings for a member.
     */
    @Transactional(readOnly = true)
    fun getUpcomingBookingsByMember(memberId: UUID, pageable: Pageable): Page<ClassBooking> {
        return bookingRepository.findUpcomingByMemberId(memberId, LocalDate.now(), pageable)
    }

    /**
     * Gets past bookings for a member.
     */
    @Transactional(readOnly = true)
    fun getPastBookingsByMember(memberId: UUID, pageable: Pageable): Page<ClassBooking> {
        return bookingRepository.findPastByMemberId(memberId, LocalDate.now(), pageable)
    }

    /**
     * Cancels a booking and promotes waitlist if applicable.
     */
    fun cancelBooking(command: CancelBookingCommand): ClassBooking {
        val booking = bookingRepository.findById(command.bookingId)
            .orElseThrow { NoSuchElementException("Booking not found: ${command.bookingId}") }

        val wasConfirmed = booking.isConfirmed()
        val wasWaitlisted = booking.isWaitlisted()

        booking.cancel(command.reason)
        bookingRepository.save(booking)

        val session = sessionRepository.findById(booking.sessionId)
            .orElseThrow { NoSuchElementException("Session not found: ${booking.sessionId}") }

        val gymClass = gymClassRepository.findById(session.gymClassId).orElse(null)

        if (wasConfirmed) {
            session.decrementBookings()
            sessionRepository.save(session)

            // Promote first person from waitlist if available
            promoteFromWaitlist(booking.sessionId, session, gymClass)
        } else if (wasWaitlisted) {
            session.decrementWaitlist()
            sessionRepository.save(session)

            // Re-order waitlist positions
            reorderWaitlist(booking.sessionId)
        }

        // Send cancellation notification
        try {
            val member = memberRepository.findById(booking.memberId).orElse(null)
            if (member != null && gymClass != null) {
                sendBookingCancellationNotification(member, session, gymClass)
            }
        } catch (e: Exception) {
            logger.error("Failed to send cancellation notification: ${e.message}", e)
        }

        // Publish webhook event
        try {
            val tenantId = TenantContext.getCurrentTenant().value
            webhookPublisher.publishBookingCancelled(booking, tenantId)
        } catch (e: Exception) {
            logger.error("Failed to publish booking cancelled webhook: ${e.message}", e)
        }

        return booking
    }

    /**
     * Checks in a member for their booked class.
     * Deducts a class from subscription if the class type requires it.
     */
    fun checkInBooking(bookingId: UUID): ClassBooking {
        val booking = bookingRepository.findById(bookingId)
            .orElseThrow { NoSuchElementException("Booking not found: $bookingId") }

        val session = sessionRepository.findById(booking.sessionId)
            .orElseThrow { NoSuchElementException("Session not found: ${booking.sessionId}") }

        val gymClass = gymClassRepository.findById(session.gymClassId)
            .orElseThrow { NoSuchElementException("Gym class not found: ${session.gymClassId}") }

        // Check in the booking
        booking.checkIn()

        // Deduct class from subscription if applicable
        val bookingSubscriptionId = booking.subscriptionId
        if (gymClass.deductsClassFromPlan && bookingSubscriptionId != null && !booking.classDeducted) {
            val subscription = subscriptionRepository.findById(bookingSubscriptionId)
                .orElse(null)

            if (subscription != null && subscription.isActive() && subscription.hasClassesAvailable()) {
                subscription.useClass()
                subscriptionRepository.save(subscription)
                booking.markClassDeducted()
                logger.info("Class deducted from subscription ${subscription.id} for booking ${booking.id}")
            } else if (subscription != null && subscription.classesRemaining != null && !subscription.hasClassesAvailable()) {
                // Log warning but don't fail check-in - member already booked
                logger.warn("No classes available for subscription ${subscription.id}, but allowing check-in for booking ${booking.id}")
            }
        }

        // Update session check-in count
        session.recordCheckIn()
        sessionRepository.save(session)

        logger.info("Member ${booking.memberId} checked in for session ${booking.sessionId}")
        val savedBooking = bookingRepository.save(booking)

        // Publish webhook event
        try {
            val tenantId = TenantContext.getCurrentTenant().value
            webhookPublisher.publishBookingCompleted(savedBooking, tenantId)
        } catch (e: Exception) {
            logger.error("Failed to publish booking completed webhook: ${e.message}", e)
        }

        return savedBooking
    }

    /**
     * Marks a booking as no-show.
     */
    fun markNoShow(bookingId: UUID): ClassBooking {
        val booking = bookingRepository.findById(bookingId)
            .orElseThrow { NoSuchElementException("Booking not found: $bookingId") }

        booking.markNoShow()
        val savedBooking = bookingRepository.save(booking)

        // Publish webhook event
        try {
            val tenantId = TenantContext.getCurrentTenant().value
            webhookPublisher.publishBookingNoShow(savedBooking, tenantId)
        } catch (e: Exception) {
            logger.error("Failed to publish booking no-show webhook: ${e.message}", e)
        }

        return savedBooking
    }

    /**
     * Promotes the first person from the waitlist to confirmed status.
     */
    private fun promoteFromWaitlist(sessionId: UUID, session: ClassSession?, gymClass: GymClass?) {
        val waitlist = bookingRepository.findWaitlistedBySessionIdOrderByPosition(sessionId)
        if (waitlist.isEmpty()) return

        val firstInLine = waitlist.first()
        firstInLine.confirm()
        bookingRepository.save(firstInLine)

        val actualSession = session ?: sessionRepository.findById(sessionId).orElse(null) ?: return
        actualSession.decrementWaitlist()
        actualSession.incrementBookings()
        sessionRepository.save(actualSession)

        // Re-order remaining waitlist
        reorderWaitlist(sessionId)

        // Send promotion notification
        try {
            val member = memberRepository.findById(firstInLine.memberId).orElse(null)
            val actualGymClass = gymClass ?: gymClassRepository.findById(actualSession.gymClassId).orElse(null)
            if (member != null && actualGymClass != null) {
                sendWaitlistPromotionNotification(member, actualSession, actualGymClass)
            }
        } catch (e: Exception) {
            logger.error("Failed to send waitlist promotion notification: ${e.message}", e)
        }
    }

    /**
     * Re-orders waitlist positions after a cancellation or promotion.
     */
    private fun reorderWaitlist(sessionId: UUID) {
        val waitlist = bookingRepository.findWaitlistedBySessionIdOrderByPosition(sessionId)
        waitlist.forEachIndexed { index, booking ->
            booking.setWaitlistPosition(index + 1)
            bookingRepository.save(booking)
        }
    }

    /**
     * Marks all confirmed bookings for a completed session as no-show if not checked in.
     */
    fun processNoShowsForSession(sessionId: UUID): Int {
        val confirmedBookings = bookingRepository.findBySessionIdAndStatus(sessionId, BookingStatus.CONFIRMED)
        var count = 0
        for (booking in confirmedBookings) {
            booking.markNoShow()
            bookingRepository.save(booking)
            count++
        }
        return count
    }

    /**
     * Gets booking count for a session.
     */
    @Transactional(readOnly = true)
    fun getBookingCountForSession(sessionId: UUID): Long {
        return bookingRepository.countBySessionId(sessionId)
    }

    /**
     * Gets confirmed booking count for a session.
     */
    @Transactional(readOnly = true)
    fun getConfirmedCountForSession(sessionId: UUID): Long {
        return bookingRepository.countBySessionIdAndStatus(sessionId, BookingStatus.CONFIRMED)
    }

    /**
     * Gets waitlist count for a session.
     */
    @Transactional(readOnly = true)
    fun getWaitlistCountForSession(sessionId: UUID): Long {
        return bookingRepository.countBySessionIdAndStatus(sessionId, BookingStatus.WAITLISTED)
    }

    /**
     * Checks if a member has an active booking for a session.
     */
    @Transactional(readOnly = true)
    fun hasMemberBookedSession(sessionId: UUID, memberId: UUID): Boolean {
        return bookingRepository.existsBySessionIdAndMemberIdAndStatusIn(
            sessionId,
            memberId,
            listOf(BookingStatus.CONFIRMED, BookingStatus.WAITLISTED)
        )
    }

    /**
     * Deletes a booking.
     * Only CANCELLED or NO_SHOW bookings can be deleted.
     */
    fun deleteBooking(id: UUID) {
        val booking = bookingRepository.findById(id)
            .orElseThrow { NoSuchElementException("Booking not found: $id") }

        require(booking.status == BookingStatus.CANCELLED || booking.status == BookingStatus.NO_SHOW) {
            "Only cancelled or no-show bookings can be deleted"
        }

        bookingRepository.deleteById(id)
        logger.info("Booking deleted: $id")
    }

    // ==================== NOTIFICATION HELPERS ====================

    private fun sendBookingConfirmationNotification(member: Member, session: ClassSession, gymClass: GymClass) {
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
    }

    private fun sendWaitlistNotification(member: Member, session: ClassSession, gymClass: GymClass, position: Int) {
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
    }

    private fun sendBookingCancellationNotification(member: Member, session: ClassSession, gymClass: GymClass) {
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
    }

    private fun sendWaitlistPromotionNotification(member: Member, session: ClassSession, gymClass: GymClass) {
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
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk create bookings for multiple members in a session.
     * @return Map of member ID to success/failure status
     */
    fun bulkCreateBookings(
        sessionId: UUID,
        memberIds: List<UUID>,
        notes: String?,
        bookedBy: UUID?
    ): Map<UUID, Result<ClassBooking>> {
        return memberIds.associateWith { memberId ->
            runCatching {
                createBooking(CreateBookingCommand(
                    sessionId = sessionId,
                    memberId = memberId,
                    notes = notes,
                    bookedBy = bookedBy
                ))
            }
        }
    }

    /**
     * Bulk cancel bookings.
     * @return Map of booking ID to success/failure status
     */
    fun bulkCancelBookings(
        bookingIds: List<UUID>,
        reason: String?
    ): Map<UUID, Result<ClassBooking>> {
        return bookingIds.associateWith { bookingId ->
            runCatching {
                cancelBooking(CancelBookingCommand(
                    bookingId = bookingId,
                    reason = reason
                ))
            }
        }
    }

    /**
     * Bulk check-in bookings.
     * @return Map of booking ID to success/failure status
     */
    fun bulkCheckInBookings(bookingIds: List<UUID>): Map<UUID, Result<ClassBooking>> {
        return bookingIds.associateWith { bookingId ->
            runCatching {
                checkInBooking(bookingId)
            }
        }
    }

    // ==================== PAYMENT-AWARE BOOKING ====================

    /**
     * Gets available booking options for a member and session.
     * Returns the payment methods the member can use based on:
     * - Class pricing model
     * - Member's subscription status
     * - Member's class pack balances
     */
    @Transactional(readOnly = true)
    fun getBookingOptions(sessionId: UUID, memberId: UUID): BookingOptionsResponse {
        val session = sessionRepository.findById(sessionId)
            .orElseThrow { NoSuchElementException("Session not found: $sessionId") }

        val gymClass = gymClassRepository.findById(session.gymClassId)
            .orElseThrow { NoSuchElementException("Gym class not found: ${session.gymClassId}") }

        // Check if session is bookable
        if (session.status != SessionStatus.SCHEDULED) {
            return BookingOptionsResponse(
                sessionId = sessionId,
                memberId = memberId,
                canBook = false,
                reason = "Session is not available for booking (status: ${session.status})"
            )
        }

        // Check if member already has a booking
        val hasExistingBooking = bookingRepository.existsBySessionIdAndMemberIdAndStatusIn(
            sessionId, memberId, listOf(BookingStatus.CONFIRMED, BookingStatus.WAITLISTED)
        )
        if (hasExistingBooking) {
            return BookingOptionsResponse(
                sessionId = sessionId,
                memberId = memberId,
                canBook = false,
                reason = "You already have a booking for this session"
            )
        }

        // Check advance booking window
        val bookingWindowStart = LocalDate.now().plusDays(gymClass.advanceBookingDays.toLong())
        if (session.sessionDate.isAfter(bookingWindowStart)) {
            return BookingOptionsResponse(
                sessionId = sessionId,
                memberId = memberId,
                canBook = false,
                reason = "Booking opens ${gymClass.advanceBookingDays} days before the class"
            )
        }

        // Build options based on pricing model
        val membershipOption = buildMembershipOption(memberId, gymClass)
        val classPackOptions = buildClassPackOptions(memberId, gymClass)
        val payPerEntryOption = buildPayPerEntryOption(gymClass)

        // Determine if any option is available
        val hasAnyOption = (membershipOption?.available == true) ||
            classPackOptions.isNotEmpty() ||
            (payPerEntryOption?.available == true)

        // Check if session is full
        val isFull = !session.hasAvailableSpots()
        val waitlistAvailable = gymClass.waitlistEnabled && session.canJoinWaitlist(gymClass.maxWaitlistSize)

        val canBook = hasAnyOption && (!isFull || waitlistAvailable)
        val reason = when {
            !hasAnyOption -> "No valid payment method available for this class"
            isFull && !waitlistAvailable -> "Session is full and waitlist is not available"
            else -> null
        }

        return BookingOptionsResponse(
            sessionId = sessionId,
            memberId = memberId,
            canBook = canBook,
            reason = reason,
            membershipOption = membershipOption,
            classPackOptions = classPackOptions,
            payPerEntryOption = payPerEntryOption
        )
    }

    private fun buildMembershipOption(memberId: UUID, gymClass: GymClass): MembershipBookingOption? {
        if (!gymClass.acceptsMembershipCredits()) {
            return null
        }

        val subscription = subscriptionRepository.findActiveByMemberId(memberId).orElse(null)
        if (subscription == null) {
            return MembershipBookingOption(
                available = false,
                classesRemaining = null,
                reason = "No active subscription"
            )
        }

        val classesRemaining = subscription.classesRemaining
        if (gymClass.deductsClassFromPlan && classesRemaining != null && classesRemaining <= 0) {
            return MembershipBookingOption(
                available = false,
                classesRemaining = 0,
                reason = "No classes remaining on subscription"
            )
        }

        return MembershipBookingOption(
            available = true,
            classesRemaining = classesRemaining
        )
    }

    private fun buildClassPackOptions(memberId: UUID, gymClass: GymClass): List<ClassPackBookingOption> {
        if (!gymClass.acceptsClassPackCredits()) {
            return emptyList()
        }

        val activeBalances = balanceRepository.findActiveByMemberId(memberId)

        return activeBalances.mapNotNull { balance ->
            val classPack = classPackRepository.findById(balance.classPackId).orElse(null)
                ?: return@mapNotNull null

            // Check if pack is valid for this class
            if (!classPack.isValidForClass(gymClass)) {
                return@mapNotNull null
            }

            ClassPackBookingOption(
                balanceId = balance.id,
                packName = classPack.name,
                classesRemaining = balance.classesRemaining,
                expiresAt = balance.expiresAt
            )
        }
    }

    private fun buildPayPerEntryOption(gymClass: GymClass): PayPerEntryOption? {
        if (!gymClass.acceptsPayPerEntry()) {
            return null
        }

        val dropInPrice = gymClass.dropInPrice ?: return null
        val taxRate = gymClass.taxRate ?: BigDecimal.ZERO

        val taxAmount = dropInPrice.amount.multiply(taxRate)
            .divide(BigDecimal("100"), 2, RoundingMode.HALF_UP)
        val totalWithTax = Money(dropInPrice.amount.add(taxAmount), dropInPrice.currency)

        return PayPerEntryOption(
            available = true,
            price = dropInPrice,
            taxRate = taxRate,
            totalWithTax = totalWithTax
        )
    }

    /**
     * Creates a booking with a specific payment source.
     * Validates that the payment source is valid for the class and member.
     */
    fun createBookingWithPayment(command: CreateBookingWithPaymentCommand): ClassBooking {
        val session = sessionRepository.findById(command.sessionId)
            .orElseThrow { NoSuchElementException("Session not found: ${command.sessionId}") }

        val gymClass = gymClassRepository.findById(session.gymClassId)
            .orElseThrow { NoSuchElementException("Gym class not found: ${session.gymClassId}") }

        // Validate session is bookable
        require(session.status == SessionStatus.SCHEDULED) {
            "Cannot book a ${session.status} session"
        }

        // Check for existing booking
        val existingBooking = bookingRepository.existsBySessionIdAndMemberIdAndStatusIn(
            command.sessionId, command.memberId,
            listOf(BookingStatus.CONFIRMED, BookingStatus.WAITLISTED)
        )
        require(!existingBooking) { "Member already has an active booking for this session" }

        // Check for overlapping bookings
        validateNoOverlappingBookings(command.memberId, session)

        // Validate payment source for the class pricing model
        validatePaymentSource(command.paymentSource, gymClass, command.memberId, command.classPackBalanceId)

        // Get subscription if using membership
        var subscriptionId: UUID? = null
        if (command.paymentSource == BookingPaymentSource.MEMBERSHIP_INCLUDED) {
            val subscription = subscriptionRepository.findActiveByMemberId(command.memberId)
                .orElseThrow { IllegalStateException("No active subscription found") }
            subscriptionId = subscription.id
        }

        // Use class pack credit if applicable
        var usedBalance: MemberClassPackBalance? = null
        if (command.paymentSource == BookingPaymentSource.CLASS_PACK) {
            val balanceId = requireNotNull(command.classPackBalanceId) {
                "Class pack balance ID is required for CLASS_PACK payment"
            }
            val balance = balanceRepository.findById(balanceId)
                .orElseThrow { NoSuchElementException("Class pack balance not found: $balanceId") }

            require(balance.memberId == command.memberId) { "Balance does not belong to this member" }
            require(balance.canUseCredit()) { "Class pack balance cannot be used (expired or depleted)" }

            // Verify pack is valid for this class
            val classPack = classPackRepository.findById(balance.classPackId)
                .orElseThrow { NoSuchElementException("Class pack not found: ${balance.classPackId}") }
            require(classPack.isValidForClass(gymClass)) {
                "This class pack is not valid for this class"
            }

            // Deduct credit
            balance.useClass()
            usedBalance = balanceRepository.save(balance)
        }

        // Create booking
        val booking: ClassBooking
        if (session.hasAvailableSpots()) {
            booking = ClassBooking.createWithPayment(
                sessionId = command.sessionId,
                memberId = command.memberId,
                paymentSource = command.paymentSource,
                subscriptionId = subscriptionId,
                classPackBalanceId = usedBalance?.id,
                orderId = command.orderId,
                paidAmount = command.paidAmount,
                bookedBy = command.bookedBy
            )
            booking.notes = command.notes
            session.incrementBookings()
            sessionRepository.save(session)
        } else if (gymClass.waitlistEnabled && session.canJoinWaitlist(gymClass.maxWaitlistSize)) {
            val waitlistPosition = session.waitlistCount + 1
            booking = ClassBooking.createWaitlistedWithPayment(
                sessionId = command.sessionId,
                memberId = command.memberId,
                position = waitlistPosition,
                paymentSource = command.paymentSource,
                subscriptionId = subscriptionId,
                classPackBalanceId = usedBalance?.id,
                bookedBy = command.bookedBy
            )
            booking.notes = command.notes
            session.incrementWaitlist()
            sessionRepository.save(session)
        } else {
            // Refund class pack credit if used
            usedBalance?.refundClass()
            usedBalance?.let { balanceRepository.save(it) }
            throw IllegalStateException("Session is full and waitlist is not available")
        }

        val savedBooking = bookingRepository.save(booking)
        logger.info("Booking created with ${command.paymentSource}: ${savedBooking.id} for member ${command.memberId}")

        // Send notification
        try {
            val member = memberRepository.findById(command.memberId).orElse(null)
            if (member != null) {
                if (savedBooking.isConfirmed()) {
                    sendBookingConfirmationNotification(member, session, gymClass)
                } else if (savedBooking.isWaitlisted()) {
                    sendWaitlistNotification(member, session, gymClass, savedBooking.waitlistPosition ?: 1)
                }
            }
        } catch (e: Exception) {
            logger.error("Failed to send booking notification: ${e.message}", e)
        }

        // Publish webhook
        try {
            val tenantId = TenantContext.getCurrentTenant().value
            if (savedBooking.isConfirmed()) {
                webhookPublisher.publishBookingConfirmed(savedBooking, tenantId)
            } else {
                webhookPublisher.publishBookingCreated(savedBooking, tenantId)
            }
        } catch (e: Exception) {
            logger.error("Failed to publish booking webhook: ${e.message}", e)
        }

        return savedBooking
    }

    private fun validatePaymentSource(
        paymentSource: BookingPaymentSource,
        gymClass: GymClass,
        memberId: UUID,
        classPackBalanceId: UUID?
    ) {
        when (paymentSource) {
            BookingPaymentSource.MEMBERSHIP_INCLUDED -> {
                require(gymClass.acceptsMembershipCredits()) {
                    "This class does not accept membership credits"
                }
                val subscription = subscriptionRepository.findActiveByMemberId(memberId).orElse(null)
                requireNotNull(subscription) { "No active subscription found" }

                if (gymClass.deductsClassFromPlan) {
                    require(subscription.hasClassesAvailable()) {
                        "No classes remaining on subscription"
                    }
                }
            }

            BookingPaymentSource.CLASS_PACK -> {
                require(gymClass.acceptsClassPackCredits()) {
                    "This class does not accept class pack credits"
                }
                requireNotNull(classPackBalanceId) {
                    "Class pack balance ID is required"
                }
            }

            BookingPaymentSource.PAY_PER_ENTRY -> {
                require(gymClass.acceptsPayPerEntry()) {
                    "This class does not accept pay-per-entry"
                }
                requireNotNull(gymClass.dropInPrice) {
                    "Drop-in price not configured for this class"
                }
            }

            BookingPaymentSource.COMPLIMENTARY -> {
                // Complimentary bookings are always allowed (admin operation)
            }
        }
    }

    /**
     * Cancels a booking with payment source-aware refund handling.
     * If the booking was paid with a class pack, refunds the credit.
     */
    fun cancelBookingWithRefund(command: CancelBookingCommand): ClassBooking {
        val booking = bookingRepository.findById(command.bookingId)
            .orElseThrow { NoSuchElementException("Booking not found: ${command.bookingId}") }

        val session = sessionRepository.findById(booking.sessionId)
            .orElseThrow { NoSuchElementException("Session not found: ${booking.sessionId}") }

        val gymClass = gymClassRepository.findById(session.gymClassId)
            .orElseThrow { NoSuchElementException("Gym class not found: ${session.gymClassId}") }

        val wasConfirmed = booking.isConfirmed()
        val wasWaitlisted = booking.isWaitlisted()

        // Check for late cancellation
        val isLateCancellation = isLateCancellation(session, gymClass)

        // Refund class pack credit if applicable (unless late cancellation)
        if (!isLateCancellation && booking.isPaidWithClassPack() && booking.classPackBalanceId != null) {
            val balance = balanceRepository.findById(booking.classPackBalanceId!!).orElse(null)
            if (balance != null) {
                balance.refundClass()
                balanceRepository.save(balance)
                logger.info("Refunded class pack credit for booking ${booking.id}")
            }
        }

        // Cancel the booking
        booking.cancel(command.reason)
        bookingRepository.save(booking)

        if (wasConfirmed) {
            session.decrementBookings()
            sessionRepository.save(session)
            promoteFromWaitlist(booking.sessionId, session, gymClass)
        } else if (wasWaitlisted) {
            session.decrementWaitlist()
            sessionRepository.save(session)
            reorderWaitlist(booking.sessionId)
        }

        // Send notification
        try {
            val member = memberRepository.findById(booking.memberId).orElse(null)
            if (member != null) {
                sendBookingCancellationNotification(member, session, gymClass)
            }
        } catch (e: Exception) {
            logger.error("Failed to send cancellation notification: ${e.message}", e)
        }

        // Publish webhook
        try {
            val tenantId = TenantContext.getCurrentTenant().value
            webhookPublisher.publishBookingCancelled(booking, tenantId)
        } catch (e: Exception) {
            logger.error("Failed to publish booking cancelled webhook: ${e.message}", e)
        }

        return booking
    }

    /**
     * Checks if a cancellation would be considered "late" (within deadline).
     */
    @Transactional(readOnly = true)
    fun isLateCancellation(session: ClassSession, gymClass: GymClass): Boolean {
        val sessionStart = session.sessionDate.atTime(session.startTime)
        val deadlineHours = gymClass.cancellationDeadlineHours.toLong()
        val deadline = sessionStart.minusHours(deadlineHours)
        return java.time.LocalDateTime.now().isAfter(deadline)
    }

    /**
     * Gets the late cancellation fee for a class, if applicable.
     */
    @Transactional(readOnly = true)
    fun getLateCancellationFee(gymClassId: UUID): Money? {
        val gymClass = gymClassRepository.findById(gymClassId).orElse(null)
        return gymClass?.lateCancellationFee
    }
}
