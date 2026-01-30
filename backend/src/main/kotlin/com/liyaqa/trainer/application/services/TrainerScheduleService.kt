package com.liyaqa.trainer.application.services

import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.trainer.domain.model.PTSessionStatus
import com.liyaqa.trainer.domain.model.PersonalTrainingSession
import com.liyaqa.trainer.domain.ports.PersonalTrainingSessionRepository
import com.liyaqa.trainer.domain.ports.TrainerRepository
import com.liyaqa.scheduling.domain.model.ClassSession
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

/**
 * Service for managing trainer schedules.
 *
 * Handles:
 * - Unified schedule aggregation from PT sessions, class sessions, and availability
 * - Conflict detection across all schedule sources
 * - Time slot availability checking
 * - Available slot calculation based on trainer availability
 *
 * Integration points:
 * - Used by PersonalTrainingService for time slot validation
 * - Used by trainer portal frontend for schedule display
 */
@Service
@Transactional(readOnly = true)
class TrainerScheduleService(
    private val ptSessionRepository: PersonalTrainingSessionRepository,
    private val classSessionRepository: ClassSessionRepository,
    private val trainerRepository: TrainerRepository
) {
    private val logger = LoggerFactory.getLogger(TrainerScheduleService::class.java)

    companion object {
        private const val MAX_DATE_RANGE_DAYS = 30L
    }

    // ==================== SCHEDULE AGGREGATION ====================

    /**
     * Get unified schedule for a trainer combining PT sessions, class sessions, and availability.
     *
     * @param trainerId The trainer ID
     * @param startDate Start of date range
     * @param endDate End of date range (max 30 days)
     * @return Unified schedule with all items sorted by date/time
     */
    fun getSchedule(trainerId: UUID, startDate: LocalDate, endDate: LocalDate): TrainerSchedule {
        validateDateRange(startDate, endDate)

        // Fetch PT sessions
        val ptSessions = ptSessionRepository.findByTrainerIdAndSessionDateBetween(
            trainerId = trainerId,
            startDate = startDate,
            endDate = endDate,
            pageable = PageRequest.of(0, 1000)
        ).content

        // Fetch class sessions
        val classSessions = try {
            classSessionRepository.findByTrainerId(trainerId, PageRequest.of(0, 1000)).content
                .filter { it.sessionDate in startDate..endDate }
        } catch (e: Exception) {
            logger.warn("Failed to fetch class sessions: ${e.message}")
            emptyList()
        }

        // Convert to schedule items
        val ptItems = ptSessions.map { ScheduleItem.PersonalTraining(it) }
        val classItems = classSessions.map { ScheduleItem.GroupClass(it) }

        val allItems = (ptItems + classItems)
            .sortedWith(compareBy({ it.date }, { it.startTime }))

        // Detect conflicts
        val conflicts = detectConflicts(allItems)

        logger.debug("Retrieved schedule for trainer $trainerId: ${ptItems.size} PT sessions, ${classItems.size} classes, ${conflicts.size} conflicts")

        return TrainerSchedule(
            trainerId = trainerId,
            startDate = startDate,
            endDate = endDate,
            items = allItems,
            conflicts = conflicts
        )
    }

    /**
     * Get schedule for a specific date.
     */
    fun getScheduleForDate(trainerId: UUID, date: LocalDate): TrainerSchedule {
        return getSchedule(trainerId, date, date)
    }

    /**
     * Get today's schedule.
     */
    fun getTodaySchedule(trainerId: UUID): TrainerSchedule {
        return getScheduleForDate(trainerId, LocalDate.now())
    }

    // ==================== CONFLICT DETECTION ====================

    /**
     * Detect conflicts in a list of schedule items.
     * A conflict occurs when two items have overlapping time ranges.
     */
    fun detectConflicts(items: List<ScheduleItem>): List<ScheduleConflict> {
        val conflicts = mutableListOf<ScheduleConflict>()

        for (i in items.indices) {
            for (j in i + 1 until items.size) {
                val item1 = items[i]
                val item2 = items[j]

                // Only check items on the same date
                if (item1.date != item2.date) continue

                // Only check CONFIRMED and IN_PROGRESS sessions
                if (!item1.isActive() || !item2.isActive()) continue

                // Check for overlap: (start1 < end2) AND (end1 > start2)
                if (item1.startTime < item2.endTime && item1.endTime > item2.startTime) {
                    conflicts.add(
                        ScheduleConflict(
                            date = item1.date,
                            item1 = item1,
                            item2 = item2,
                            overlapStart = maxOf(item1.startTime, item2.startTime),
                            overlapEnd = minOf(item1.endTime, item2.endTime)
                        )
                    )
                }
            }
        }

        return conflicts
    }

    /**
     * Detect conflicts for a trainer in a date range.
     */
    fun detectConflicts(trainerId: UUID, startDate: LocalDate, endDate: LocalDate): List<ScheduleConflict> {
        val schedule = getSchedule(trainerId, startDate, endDate)
        return schedule.conflicts
    }

    // ==================== AVAILABILITY CHECKING ====================

    /**
     * Check if a time slot is available for a trainer.
     * Returns true if no CONFIRMED or IN_PROGRESS sessions overlap with the requested slot.
     *
     * @param trainerId The trainer ID
     * @param date The date
     * @param startTime Start time of the slot
     * @param endTime End time of the slot
     * @return true if available, false if conflict exists
     */
    fun isTimeSlotAvailable(trainerId: UUID, date: LocalDate, startTime: LocalTime, endTime: LocalTime): Boolean {
        // Check PT sessions
        val ptAvailable = ptSessionRepository.isTimeSlotAvailable(trainerId, date, startTime, endTime)

        // Check class sessions
        val classSessions = try {
            classSessionRepository.findByTrainerId(trainerId, PageRequest.of(0, 100)).content
                .filter { it.sessionDate == date }
        } catch (e: Exception) {
            logger.warn("Failed to fetch class sessions for availability check: ${e.message}")
            emptyList()
        }

        val classConflict = classSessions.any { session ->
            // Assuming ClassSession has sessionDate, startTime, endTime, and status
            try {
                val sessionStart = session.startTime
                val sessionEnd = session.endTime
                val isActive = session.status.name in listOf("SCHEDULED", "IN_PROGRESS")

                isActive && sessionStart < endTime && sessionEnd > startTime
            } catch (e: Exception) {
                logger.warn("Error checking class session overlap: ${e.message}")
                false
            }
        }

        return ptAvailable && !classConflict
    }

    /**
     * Get available time slots for a trainer on a specific date.
     * Parses trainer availability JSON and subtracts booked sessions.
     *
     * Note: This is a simplified version. Full implementation would parse
     * the trainer's availability JSON and calculate available gaps.
     *
     * @param trainerId The trainer ID
     * @param date The date
     * @param durationMinutes Required duration for the slot
     * @return List of available time slots
     */
    fun getAvailableSlots(trainerId: UUID, date: LocalDate, durationMinutes: Int): List<TimeSlot> {
        // TODO: Parse trainer.availability JSON for the day of week
        // For now, return a basic availability from 9 AM to 5 PM in 1-hour blocks

        val trainer = trainerRepository.findById(trainerId)
            .orElseThrow { NoSuchElementException("Trainer not found: $trainerId") }

        // Get all booked sessions for the date
        val schedule = getScheduleForDate(trainerId, date)
        val bookedSlots = schedule.items.filter { it.isActive() }

        // Generate potential slots (simplified)
        val availableSlots = mutableListOf<TimeSlot>()
        var currentTime = LocalTime.of(9, 0) // Start at 9 AM
        val endOfDay = LocalTime.of(17, 0) // End at 5 PM

        while (currentTime.plusMinutes(durationMinutes.toLong()) <= endOfDay) {
            val slotEnd = currentTime.plusMinutes(durationMinutes.toLong())

            // Check if this slot overlaps with any booked sessions
            val hasConflict = bookedSlots.any { item ->
                currentTime < item.endTime && slotEnd > item.startTime
            }

            if (!hasConflict) {
                availableSlots.add(TimeSlot(currentTime, slotEnd))
            }

            // Move to next potential slot (30-minute increments)
            currentTime = currentTime.plusMinutes(30)
        }

        logger.debug("Found ${availableSlots.size} available slots for trainer $trainerId on $date")
        return availableSlots
    }

    // ==================== HELPERS ====================

    /**
     * Validate date range is within acceptable limits.
     */
    private fun validateDateRange(startDate: LocalDate, endDate: LocalDate) {
        require(startDate <= endDate) {
            "Start date must be before or equal to end date"
        }

        val daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate)
        require(daysBetween <= MAX_DATE_RANGE_DAYS) {
            "Date range cannot exceed $MAX_DATE_RANGE_DAYS days"
        }
    }
}

// ==================== DATA CLASSES ====================

/**
 * Unified trainer schedule containing all sessions and conflicts.
 */
data class TrainerSchedule(
    val trainerId: UUID,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val items: List<ScheduleItem>,
    val conflicts: List<ScheduleConflict>
)

/**
 * Sealed class representing a schedule item (PT session or group class).
 */
sealed class ScheduleItem {
    abstract val id: UUID
    abstract val date: LocalDate
    abstract val startTime: LocalTime
    abstract val endTime: LocalTime
    abstract val status: String

    abstract fun isActive(): Boolean

    /**
     * PT session schedule item.
     */
    data class PersonalTraining(
        override val id: UUID,
        val memberId: UUID,
        override val date: LocalDate,
        override val startTime: LocalTime,
        override val endTime: LocalTime,
        override val status: String,
        val price: String?
    ) : ScheduleItem() {
        constructor(session: PersonalTrainingSession) : this(
            id = session.id,
            memberId = session.memberId,
            date = session.sessionDate,
            startTime = session.startTime,
            endTime = session.endTime,
            status = session.status.name,
            price = session.price?.toString()
        )

        override fun isActive(): Boolean = status in listOf("CONFIRMED", "IN_PROGRESS")
    }

    /**
     * Group class schedule item.
     */
    data class GroupClass(
        override val id: UUID,
        val classId: UUID,
        val className: String,
        override val date: LocalDate,
        override val startTime: LocalTime,
        override val endTime: LocalTime,
        override val status: String,
        val capacity: Int?,
        val bookedCount: Int?
    ) : ScheduleItem() {
        constructor(session: ClassSession) : this(
            id = session.id,
            classId = session.gymClassId,
            className = "Group Class", // Will need to join with GymClass to get name
            date = session.sessionDate,
            startTime = session.startTime,
            endTime = session.endTime,
            status = session.status.name,
            capacity = session.maxCapacity,
            bookedCount = session.currentBookings
        )

        override fun isActive(): Boolean = status in listOf("SCHEDULED", "IN_PROGRESS")
    }
}

/**
 * Represents a schedule conflict between two items.
 */
data class ScheduleConflict(
    val date: LocalDate,
    val item1: ScheduleItem,
    val item2: ScheduleItem,
    val overlapStart: LocalTime,
    val overlapEnd: LocalTime
) {
    val overlapDurationMinutes: Long
        get() = java.time.temporal.ChronoUnit.MINUTES.between(overlapStart, overlapEnd)
}

/**
 * Represents an available time slot.
 */
data class TimeSlot(
    val startTime: LocalTime,
    val endTime: LocalTime
) {
    val durationMinutes: Long
        get() = java.time.temporal.ChronoUnit.MINUTES.between(startTime, endTime)
}
