package com.liyaqa.trainer.application.services

import com.liyaqa.scheduling.domain.model.DayOfWeek
import com.liyaqa.scheduling.domain.model.PTLocationType
import com.liyaqa.scheduling.domain.model.TrainerAvailabilityStatus
import com.liyaqa.trainer.domain.model.TrainerAvailability
import com.liyaqa.trainer.domain.ports.TrainerAvailabilityRepository
import com.liyaqa.trainer.domain.ports.TrainerRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

data class AvailabilitySlotInput(
    val dayOfWeek: DayOfWeek,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val locationType: PTLocationType = PTLocationType.CLUB,
    val locationId: UUID? = null,
    val isRecurring: Boolean = true,
    val effectiveFrom: LocalDate = LocalDate.now(),
    val effectiveUntil: LocalDate? = null
)

data class BlockSlotCommand(
    val trainerId: UUID,
    val dayOfWeek: DayOfWeek,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val effectiveFrom: LocalDate,
    val effectiveUntil: LocalDate? = null
)

@Service
@Transactional
class TrainerAvailabilityService(
    private val availabilityRepository: TrainerAvailabilityRepository,
    private val trainerRepository: TrainerRepository
) {
    private val logger = LoggerFactory.getLogger(TrainerAvailabilityService::class.java)

    /**
     * Bulk upsert availability slots for a trainer.
     * Replaces all existing slots for the trainer.
     */
    fun setAvailability(trainerId: UUID, slots: List<AvailabilitySlotInput>): List<TrainerAvailability> {
        require(trainerRepository.existsById(trainerId)) { "Trainer not found: $trainerId" }

        // Validate no overlapping slots on the same day
        slots.groupBy { it.dayOfWeek }.forEach { (day, daySlots) ->
            for (i in daySlots.indices) {
                for (j in i + 1 until daySlots.size) {
                    val a = daySlots[i]
                    val b = daySlots[j]
                    require(a.endTime <= b.startTime || b.endTime <= a.startTime) {
                        "Overlapping availability slots on $day: ${a.startTime}-${a.endTime} and ${b.startTime}-${b.endTime}"
                    }
                }
            }
        }

        // Delete existing availability
        availabilityRepository.deleteByTrainerId(trainerId)

        // Create new slots
        val entities = slots.map { slot ->
            TrainerAvailability(
                trainerId = trainerId,
                dayOfWeek = slot.dayOfWeek,
                startTime = slot.startTime,
                endTime = slot.endTime,
                locationType = slot.locationType,
                locationId = slot.locationId,
                isRecurring = slot.isRecurring,
                effectiveFrom = slot.effectiveFrom,
                effectiveUntil = slot.effectiveUntil,
                status = TrainerAvailabilityStatus.AVAILABLE
            )
        }

        val saved = availabilityRepository.saveAll(entities)
        logger.info("Set ${saved.size} availability slots for trainer $trainerId")
        return saved
    }

    /**
     * Get all availability slots for a trainer.
     */
    @Transactional(readOnly = true)
    fun getAvailability(trainerId: UUID): List<TrainerAvailability> {
        return availabilityRepository.findByTrainerId(trainerId)
    }

    /**
     * Get available (not booked/blocked) slots for a trainer on a specific date.
     */
    @Transactional(readOnly = true)
    fun getAvailableSlots(trainerId: UUID, date: LocalDate): List<TrainerAvailability> {
        val dayOfWeek = DayOfWeek.valueOf(date.dayOfWeek.name)
        return availabilityRepository.findAvailableByTrainerIdAndDayOfWeek(trainerId, dayOfWeek, date)
    }

    /**
     * Block a time slot (for meetings, holidays, etc.).
     */
    fun blockSlot(command: BlockSlotCommand): TrainerAvailability {
        require(trainerRepository.existsById(command.trainerId)) { "Trainer not found: ${command.trainerId}" }

        val slot = TrainerAvailability(
            trainerId = command.trainerId,
            dayOfWeek = command.dayOfWeek,
            startTime = command.startTime,
            endTime = command.endTime,
            locationType = PTLocationType.CLUB,
            isRecurring = false,
            effectiveFrom = command.effectiveFrom,
            effectiveUntil = command.effectiveUntil,
            status = TrainerAvailabilityStatus.BLOCKED
        )

        logger.info("Blocked slot for trainer ${command.trainerId} on ${command.dayOfWeek} ${command.startTime}-${command.endTime}")
        return availabilityRepository.save(slot)
    }

    /**
     * Check if a trainer is available at a specific date/time.
     */
    @Transactional(readOnly = true)
    fun isTrainerAvailable(trainerId: UUID, date: LocalDate, startTime: LocalTime, endTime: LocalTime): Boolean {
        val availableSlots = getAvailableSlots(trainerId, date)
        if (availableSlots.isEmpty()) {
            // No slots for this date — if trainer has no availability configured at all,
            // treat as unrestricted (available). Otherwise they're unavailable for this day.
            return !availabilityRepository.existsByTrainerId(trainerId)
        }
        return availableSlots.any { it.coversTimeRange(startTime, endTime) }
    }
}
