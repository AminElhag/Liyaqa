package com.liyaqa.scheduling.application.services

import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.scheduling.domain.model.ClassBooking
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.ClassPricingModel

import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalTime
import java.util.UUID

/**
 * Result of booking validation containing eligibility and reason.
 */
data class BookingValidationResult(
    val canBook: Boolean,
    val reason: String? = null,
    val validatedSubscription: Subscription? = null
)

/**
 * Service responsible for validating booking eligibility.
 * Handles:
 * - Overlap validation
 * - Subscription validation
 * - Session bookability checks
 */
@Service
@Transactional(readOnly = true)
class BookingValidationService(
    private val bookingRepository: ClassBookingRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val gymClassRepository: GymClassRepository
) {
    private val logger = LoggerFactory.getLogger(BookingValidationService::class.java)

    /**
     * Validates booking eligibility for a member and session.
     * Checks for overlapping bookings and subscription requirements.
     *
     * @param memberId The member ID
     * @param newSession The session being booked
     * @param gymClass The gym class for the session
     * @param subscriptionId Optional specific subscription ID to use
     * @return BookingValidationResult with canBook flag and optional reason
     */
    fun validateBookingEligibility(
        memberId: UUID,
        newSession: ClassSession,
        gymClass: GymClass,
        subscriptionId: UUID? = null
    ): BookingValidationResult {
        // Check for overlapping bookings
        try {
            validateNoOverlappingBookings(memberId, newSession)
        } catch (e: IllegalArgumentException) {
            return BookingValidationResult(
                canBook = false,
                reason = e.message
            )
        }

        // Validate subscription if required
        var validatedSubscription: Subscription? = null
        if (gymClass.pricingModel == ClassPricingModel.INCLUDED_IN_MEMBERSHIP) {
            try {
                validatedSubscription = validateSubscriptionForBooking(
                    memberId,
                    subscriptionId,
                    gymClass.deductsClassFromPlan
                )
            } catch (e: Exception) {
                return BookingValidationResult(
                    canBook = false,
                    reason = e.message
                )
            }
        }

        return BookingValidationResult(
            canBook = true,
            validatedSubscription = validatedSubscription
        )
    }

    /**
     * Validates that the member doesn't have overlapping bookings on the same day.
     * Uses optimized query to prevent N+1 queries (fetches bookings, sessions, and classes in one go).
     *
     * @param memberId The member ID
     * @param newSession The session being booked
     * @throws IllegalArgumentException if there's an overlapping booking
     */
    fun validateNoOverlappingBookings(memberId: UUID, newSession: ClassSession) {
        // Optimized query: fetches bookings with sessions and gym classes in a single query
        // Returns List<Array<Any>> where each array contains [ClassBooking, ClassSession, GymClass]
        val bookingsWithData = bookingRepository.findActiveBookingsWithSessionsAndClasses(
            memberId,
            newSession.sessionDate
        )

        for (row in bookingsWithData) {
            // Unpack the result tuple
            val booking = row[0] as ClassBooking
            val existingSession = row[1] as ClassSession
            val existingClass = row[2] as GymClass

            // Check for time overlap
            if (sessionsOverlap(
                    newSession.startTime,
                    newSession.endTime,
                    existingSession.startTime,
                    existingSession.endTime
                )) {
                val className = existingClass.name.en
                throw IllegalArgumentException(
                    "Cannot book: time conflicts with $className (${existingSession.startTime}-${existingSession.endTime})"
                )
            }
        }
    }

    /**
     * Validates that the member has a valid subscription for booking.
     *
     * @param memberId The member ID
     * @param subscriptionId Optional specific subscription ID to use
     * @param requiresClassAvailability Whether the class deducts from plan (requires classes available)
     * @return The validated subscription
     * @throws IllegalStateException if no valid subscription found
     */
    fun validateSubscriptionForBooking(
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
     * Checks if two time ranges overlap.
     * Two ranges [start1, end1] and [start2, end2] overlap if start1 < end2 AND start2 < end1
     */
    private fun sessionsOverlap(
        start1: LocalTime, end1: LocalTime,
        start2: LocalTime, end2: LocalTime
    ): Boolean {
        return start1.isBefore(end2) && start2.isBefore(end1)
    }
}
