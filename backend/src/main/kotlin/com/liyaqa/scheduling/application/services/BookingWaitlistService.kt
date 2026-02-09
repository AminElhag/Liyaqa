package com.liyaqa.scheduling.application.services

import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service responsible for managing booking waitlists.
 * Handles:
 * - Promoting members from waitlist to confirmed
 * - Reordering waitlist positions
 */
@Service
@Transactional
class BookingWaitlistService(
    private val bookingRepository: ClassBookingRepository,
    private val sessionRepository: ClassSessionRepository,
    private val gymClassRepository: GymClassRepository,
    private val memberRepository: MemberRepository,
    private val notificationService: BookingNotificationService
) {
    private val logger = LoggerFactory.getLogger(BookingWaitlistService::class.java)

    /**
     * Promotes the first person from the waitlist to confirmed status.
     */
    fun promoteFromWaitlist(sessionId: UUID, session: ClassSession?, gymClass: GymClass?) {
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
                notificationService.sendWaitlistPromotion(member, actualSession, actualGymClass)
            }
        } catch (e: Exception) {
            logger.error("Failed to send waitlist promotion notification: ${e.message}", e)
        }

        logger.info("Promoted booking ${firstInLine.id} from waitlist for session $sessionId")
    }

    /**
     * Re-orders waitlist positions after a cancellation or promotion.
     */
    fun reorderWaitlist(sessionId: UUID) {
        val waitlist = bookingRepository.findWaitlistedBySessionIdOrderByPosition(sessionId)
        waitlist.forEachIndexed { index, booking ->
            booking.setWaitlistPosition(index + 1)
            bookingRepository.save(booking)
        }

        if (waitlist.isNotEmpty()) {
            logger.info("Reordered ${waitlist.size} waitlist entries for session $sessionId")
        }
    }
}
