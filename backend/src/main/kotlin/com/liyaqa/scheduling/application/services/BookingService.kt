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
import com.liyaqa.shared.application.services.PermissionService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.webhook.application.services.WebhookEventPublisher
import org.springframework.security.access.AccessDeniedException
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
    private val balanceRepository: MemberClassPackBalanceRepository,
    private val permissionService: PermissionService,
    private val validationService: BookingValidationService,
    private val bookingNotificationService: BookingNotificationService,
    private val waitlistService: BookingWaitlistService
) {
    private val logger = LoggerFactory.getLogger(BookingService::class.java)

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

        val gymClass = gymClassRepository.findById(session.gymClassId)
            .orElseThrow { NoSuchElementException("Gym class not found: ${session.gymClassId}") }

        // Validate booking eligibility (overlap and subscription checks)
        val validationResult = validationService.validateBookingEligibility(
            command.memberId,
            session,
            gymClass,
            command.subscriptionId
        )
        require(validationResult.canBook) {
            validationResult.reason ?: "Booking validation failed"
        }

        val validatedSubscription = validationResult.validatedSubscription

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
                    bookingNotificationService.sendBookingConfirmation(member, session, gymClass)
                } else if (savedBooking.isWaitlisted()) {
                    bookingNotificationService.sendWaitlistAdded(member, session, gymClass, savedBooking.waitlistPosition ?: 1)
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
     * @param command The cancellation command
     * @param requestingUserId Optional user ID for authorization check. If provided, verifies the user owns the booking or has admin permission.
     */
    fun cancelBooking(command: CancelBookingCommand, requestingUserId: UUID? = null): ClassBooking {
        val booking = bookingRepository.findById(command.bookingId)
            .orElseThrow { NoSuchElementException("Booking not found: ${command.bookingId}") }

        // Authorization check: Only booking owner or admin can cancel
        if (requestingUserId != null) {
            val member = memberRepository.findByUserId(requestingUserId).orElse(null)

            if (member == null || booking.memberId != member.id) {
                // Check if user has admin permission to cancel any booking
                val hasAdminPermission = permissionService.hasPermission(
                    requestingUserId,
                    "bookings_cancel_any"
                )

                if (!hasAdminPermission) {
                    logger.warn("Unauthorized booking cancellation attempt: user=$requestingUserId, booking=${command.bookingId}")
                    throw AccessDeniedException("You can only cancel your own bookings")
                }
            }
        }

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
            waitlistService.promoteFromWaitlist(booking.sessionId, session, gymClass)
        } else if (wasWaitlisted) {
            session.decrementWaitlist()
            sessionRepository.save(session)

            // Re-order waitlist positions
            waitlistService.reorderWaitlist(booking.sessionId)
        }

        // Send cancellation notification
        try {
            val member = memberRepository.findById(booking.memberId).orElse(null)
            if (member != null && gymClass != null) {
                bookingNotificationService.sendBookingCancellation(member, session, gymClass)
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

    /**
     * Gets the late cancellation fee for a class, if applicable.
     */
    @Transactional(readOnly = true)
    fun getLateCancellationFee(gymClassId: UUID): Money? {
        val gymClass = gymClassRepository.findById(gymClassId).orElse(null)
        return gymClass?.lateCancellationFee
    }
}
