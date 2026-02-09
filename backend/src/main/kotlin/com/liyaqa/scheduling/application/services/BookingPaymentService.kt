package com.liyaqa.scheduling.application.services

import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.scheduling.application.commands.CancelBookingCommand
import com.liyaqa.scheduling.domain.model.*
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
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant
import java.time.LocalDate
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

/**
 * Service responsible for payment-aware booking operations.
 * Handles:
 * - Getting booking options (available payment methods)
 * - Creating bookings with payment
 * - Canceling bookings with refunds
 * - Late cancellation logic
 */
@Service
@Transactional
class BookingPaymentService(
    private val sessionRepository: ClassSessionRepository,
    private val gymClassRepository: GymClassRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val classPackRepository: ClassPackRepository,
    private val balanceRepository: MemberClassPackBalanceRepository,
    private val bookingRepository: ClassBookingRepository,
    private val memberRepository: MemberRepository,
    private val validationService: BookingValidationService,
    private val notificationService: BookingNotificationService,
    private val waitlistService: BookingWaitlistService,
    private val webhookPublisher: WebhookEventPublisher
) {
    private val logger = LoggerFactory.getLogger(BookingPaymentService::class.java)

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
        validationService.validateNoOverlappingBookings(command.memberId, session)

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
                    notificationService.sendBookingConfirmation(member, session, gymClass)
                } else if (savedBooking.isWaitlisted()) {
                    notificationService.sendWaitlistAdded(member, session, gymClass, savedBooking.waitlistPosition ?: 1)
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
            waitlistService.promoteFromWaitlist(booking.sessionId, session, gymClass)
        } else if (wasWaitlisted) {
            session.decrementWaitlist()
            sessionRepository.save(session)
            waitlistService.reorderWaitlist(booking.sessionId)
        }

        // Send notification
        try {
            val member = memberRepository.findById(booking.memberId).orElse(null)
            if (member != null) {
                notificationService.sendBookingCancellation(member, session, gymClass)
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

    // ==================== PRIVATE HELPERS ====================

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
}
