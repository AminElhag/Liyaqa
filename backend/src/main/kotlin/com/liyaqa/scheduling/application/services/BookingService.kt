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
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.ClassBooking
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.webhook.application.services.WebhookEventPublisher
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
@Transactional
class BookingService(
    private val bookingRepository: ClassBookingRepository,
    private val sessionRepository: ClassSessionRepository,
    private val gymClassRepository: GymClassRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val memberRepository: MemberRepository,
    private val notificationService: NotificationService,
    private val webhookPublisher: WebhookEventPublisher
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
}
