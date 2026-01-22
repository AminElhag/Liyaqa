package com.liyaqa.trainer.application.services

import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.trainer.domain.model.PTSessionStatus
import com.liyaqa.trainer.domain.model.PersonalTrainingSession
import com.liyaqa.trainer.domain.ports.PersonalTrainingSessionRepository
import com.liyaqa.trainer.domain.ports.TrainerRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

/**
 * Service for managing personal training sessions.
 *
 * Handles:
 * - PT session booking by members
 * - Session confirmation/cancellation by trainers
 * - Availability checking
 * - Session lifecycle management
 */
@Service
@Transactional
class PersonalTrainingService(
    private val ptSessionRepository: PersonalTrainingSessionRepository,
    private val trainerRepository: TrainerRepository,
    private val memberRepository: MemberRepository,
    private val trainerService: TrainerService
) {
    private val logger = LoggerFactory.getLogger(PersonalTrainingService::class.java)

    // ==================== BOOKING OPERATIONS ====================

    /**
     * Create a new PT session request (by member).
     */
    fun requestSession(
        trainerId: UUID,
        memberId: UUID,
        sessionDate: LocalDate,
        startTime: LocalTime,
        durationMinutes: Int = 60,
        notes: String? = null,
        locationId: UUID? = null
    ): PersonalTrainingSession {
        // Verify trainer exists and is available for PT
        val trainer = trainerRepository.findById(trainerId)
            .orElseThrow { NoSuchElementException("Trainer not found: $trainerId") }

        require(trainer.canProvidePersonalTraining()) {
            "Trainer $trainerId is not available for personal training"
        }

        // Verify member exists
        require(memberRepository.existsById(memberId)) {
            "Member not found: $memberId"
        }

        // Calculate end time
        val endTime = startTime.plusMinutes(durationMinutes.toLong())

        // Check if time slot is available
        require(ptSessionRepository.isTimeSlotAvailable(trainerId, sessionDate, startTime, endTime)) {
            "The requested time slot is not available"
        }

        // Get trainer's PT session rate as default price
        val price = trainer.ptSessionRate

        val session = PersonalTrainingSession.create(
            trainerId = trainerId,
            memberId = memberId,
            sessionDate = sessionDate,
            startTime = startTime,
            endTime = endTime,
            durationMinutes = durationMinutes,
            price = price,
            locationId = locationId,
            notes = notes
        )

        val savedSession = ptSessionRepository.save(session)
        logger.info("PT session request created: ${savedSession.id} (trainer: $trainerId, member: $memberId)")

        return savedSession
    }

    // ==================== TRAINER OPERATIONS ====================

    /**
     * Trainer confirms a session request.
     */
    fun confirmSession(sessionId: UUID): PersonalTrainingSession {
        val session = getSession(sessionId)
        session.confirm()
        val savedSession = ptSessionRepository.save(session)
        logger.info("PT session confirmed: $sessionId")
        return savedSession
    }

    /**
     * Trainer or member cancels a session.
     */
    fun cancelSession(sessionId: UUID, cancelledByUserId: UUID, reason: String? = null): PersonalTrainingSession {
        val session = getSession(sessionId)
        session.cancel(cancelledByUserId, reason)
        val savedSession = ptSessionRepository.save(session)
        logger.info("PT session cancelled: $sessionId (by: $cancelledByUserId)")
        return savedSession
    }

    /**
     * Trainer marks session as started.
     */
    fun startSession(sessionId: UUID): PersonalTrainingSession {
        val session = getSession(sessionId)
        session.start()
        val savedSession = ptSessionRepository.save(session)
        logger.info("PT session started: $sessionId")
        return savedSession
    }

    /**
     * Trainer marks session as completed.
     */
    fun completeSession(sessionId: UUID, trainerNotes: String? = null): PersonalTrainingSession {
        val session = getSession(sessionId)
        session.complete(trainerNotes)
        val savedSession = ptSessionRepository.save(session)
        logger.info("PT session completed: $sessionId")
        return savedSession
    }

    /**
     * Trainer marks member as no-show.
     */
    fun markNoShow(sessionId: UUID): PersonalTrainingSession {
        val session = getSession(sessionId)
        session.markNoShow()
        val savedSession = ptSessionRepository.save(session)
        logger.info("PT session marked as no-show: $sessionId")
        return savedSession
    }

    // ==================== UPDATE OPERATIONS ====================

    /**
     * Reschedule a session to a new date/time.
     */
    fun rescheduleSession(
        sessionId: UUID,
        newDate: LocalDate,
        newStartTime: LocalTime,
        newDurationMinutes: Int? = null
    ): PersonalTrainingSession {
        val session = getSession(sessionId)
        val duration = newDurationMinutes ?: session.durationMinutes
        val newEndTime = newStartTime.plusMinutes(duration.toLong())

        // Check availability for new slot
        require(ptSessionRepository.isTimeSlotAvailable(session.trainerId, newDate, newStartTime, newEndTime)) {
            "The new time slot is not available"
        }

        session.reschedule(newDate, newStartTime, newEndTime)
        if (newDurationMinutes != null) {
            session.durationMinutes = newDurationMinutes
        }

        val savedSession = ptSessionRepository.save(session)
        logger.info("PT session rescheduled: $sessionId to $newDate $newStartTime")
        return savedSession
    }

    /**
     * Update session notes.
     */
    fun updateNotes(sessionId: UUID, notes: String?): PersonalTrainingSession {
        val session = getSession(sessionId)
        session.updateNotes(notes)
        return ptSessionRepository.save(session)
    }

    /**
     * Update session price.
     */
    fun updatePrice(sessionId: UUID, price: BigDecimal?): PersonalTrainingSession {
        val session = getSession(sessionId)
        session.updatePrice(price)
        return ptSessionRepository.save(session)
    }

    // ==================== QUERY OPERATIONS ====================

    /**
     * Get session by ID.
     */
    @Transactional(readOnly = true)
    fun getSession(id: UUID): PersonalTrainingSession {
        return ptSessionRepository.findById(id)
            .orElseThrow { NoSuchElementException("PT session not found: $id") }
    }

    /**
     * Get all sessions with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllSessions(pageable: Pageable): Page<PersonalTrainingSession> {
        return ptSessionRepository.findAll(pageable)
    }

    /**
     * Get sessions for a trainer.
     */
    @Transactional(readOnly = true)
    fun getSessionsByTrainer(trainerId: UUID, pageable: Pageable): Page<PersonalTrainingSession> {
        return ptSessionRepository.findByTrainerId(trainerId, pageable)
    }

    /**
     * Get sessions for a member.
     */
    @Transactional(readOnly = true)
    fun getSessionsByMember(memberId: UUID, pageable: Pageable): Page<PersonalTrainingSession> {
        return ptSessionRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Get sessions by trainer and status.
     */
    @Transactional(readOnly = true)
    fun getSessionsByTrainerAndStatus(
        trainerId: UUID,
        status: PTSessionStatus,
        pageable: Pageable
    ): Page<PersonalTrainingSession> {
        return ptSessionRepository.findByTrainerIdAndStatus(trainerId, status, pageable)
    }

    /**
     * Get sessions by member and status.
     */
    @Transactional(readOnly = true)
    fun getSessionsByMemberAndStatus(
        memberId: UUID,
        status: PTSessionStatus,
        pageable: Pageable
    ): Page<PersonalTrainingSession> {
        return ptSessionRepository.findByMemberIdAndStatus(memberId, status, pageable)
    }

    /**
     * Get pending (REQUESTED) sessions for a trainer.
     */
    @Transactional(readOnly = true)
    fun getPendingSessionsForTrainer(trainerId: UUID, pageable: Pageable): Page<PersonalTrainingSession> {
        return ptSessionRepository.findPendingByTrainerId(trainerId, pageable)
    }

    /**
     * Get upcoming (CONFIRMED) sessions for a trainer.
     */
    @Transactional(readOnly = true)
    fun getUpcomingSessionsForTrainer(trainerId: UUID, pageable: Pageable): Page<PersonalTrainingSession> {
        return ptSessionRepository.findUpcomingByTrainerId(trainerId, LocalDate.now(), pageable)
    }

    /**
     * Get upcoming sessions for a member.
     */
    @Transactional(readOnly = true)
    fun getUpcomingSessionsForMember(memberId: UUID, pageable: Pageable): Page<PersonalTrainingSession> {
        return ptSessionRepository.findUpcomingByMemberId(memberId, LocalDate.now(), pageable)
    }

    /**
     * Get sessions for a trainer on a specific date.
     */
    @Transactional(readOnly = true)
    fun getTrainerSessionsOnDate(trainerId: UUID, date: LocalDate): List<PersonalTrainingSession> {
        return ptSessionRepository.findByTrainerIdAndSessionDate(trainerId, date)
    }

    /**
     * Get sessions within a date range.
     */
    @Transactional(readOnly = true)
    fun getSessionsBetweenDates(
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<PersonalTrainingSession> {
        return ptSessionRepository.findBySessionDateBetween(startDate, endDate, pageable)
    }

    /**
     * Get trainer's sessions within a date range.
     */
    @Transactional(readOnly = true)
    fun getTrainerSessionsBetweenDates(
        trainerId: UUID,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<PersonalTrainingSession> {
        return ptSessionRepository.findByTrainerIdAndSessionDateBetween(trainerId, startDate, endDate, pageable)
    }

    // ==================== AVAILABILITY OPERATIONS ====================

    /**
     * Check if a time slot is available for a trainer.
     */
    @Transactional(readOnly = true)
    fun isTimeSlotAvailable(
        trainerId: UUID,
        sessionDate: LocalDate,
        startTime: LocalTime,
        endTime: LocalTime
    ): Boolean {
        return ptSessionRepository.isTimeSlotAvailable(trainerId, sessionDate, startTime, endTime)
    }

    /**
     * Get available time slots for a trainer on a specific date.
     *
     * Uses the trainer's availability settings and filters out already-booked slots.
     *
     * @param trainerId The trainer's ID
     * @param date The date to check
     * @param slotDurationMinutes Duration of each slot (default: 60 min)
     * @return List of available time slots
     */
    @Transactional(readOnly = true)
    fun getAvailableSlots(
        trainerId: UUID,
        date: LocalDate,
        slotDurationMinutes: Int = 60
    ): List<AvailableSlot> {
        val trainer = trainerRepository.findById(trainerId)
            .orElseThrow { NoSuchElementException("Trainer not found: $trainerId") }

        // Get trainer's availability for this day of the week
        val availability = trainerService.deserializeAvailability(trainer.availability) ?: return emptyList()

        val daySlots = when (date.dayOfWeek.name.lowercase()) {
            "monday" -> availability.monday
            "tuesday" -> availability.tuesday
            "wednesday" -> availability.wednesday
            "thursday" -> availability.thursday
            "friday" -> availability.friday
            "saturday" -> availability.saturday
            "sunday" -> availability.sunday
            else -> null
        } ?: return emptyList()

        // Get existing sessions for this date
        val existingSessions = ptSessionRepository.findByTrainerIdAndSessionDate(trainerId, date)
            .filter { it.status in listOf(PTSessionStatus.CONFIRMED, PTSessionStatus.IN_PROGRESS, PTSessionStatus.REQUESTED) }

        // Generate available slots
        val availableSlots = mutableListOf<AvailableSlot>()

        for (slot in daySlots) {
            var slotStart = LocalTime.parse(slot.start)
            val slotEnd = LocalTime.parse(slot.end)

            while (slotStart.plusMinutes(slotDurationMinutes.toLong()) <= slotEnd) {
                val potentialEnd = slotStart.plusMinutes(slotDurationMinutes.toLong())

                // Check if this slot overlaps with any existing session
                val isBooked = existingSessions.any { session ->
                    session.startTime < potentialEnd && session.endTime > slotStart
                }

                availableSlots.add(
                    AvailableSlot(
                        date = date,
                        startTime = slotStart,
                        endTime = potentialEnd,
                        isBooked = isBooked
                    )
                )

                slotStart = potentialEnd
            }
        }

        return availableSlots
    }

    // ==================== DELETE OPERATIONS ====================

    /**
     * Delete a session (admin only).
     */
    fun deleteSession(id: UUID) {
        ptSessionRepository.deleteById(id)
        logger.info("PT session deleted: $id")
    }

    // ==================== STATISTICS ====================

    /**
     * Count all sessions.
     */
    @Transactional(readOnly = true)
    fun countSessions(): Long {
        return ptSessionRepository.count()
    }
}

/**
 * Data class representing an available time slot.
 */
data class AvailableSlot(
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val isBooked: Boolean
)
