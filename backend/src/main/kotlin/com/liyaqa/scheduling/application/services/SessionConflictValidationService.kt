package com.liyaqa.scheduling.application.services

import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

@Service
class SessionConflictValidationService(
    private val sessionRepository: ClassSessionRepository
) {

    /**
     * Validates that a session does not conflict with existing sessions
     * for the same trainer or at the same location.
     *
     * @param trainerId trainer to check (skipped if null)
     * @param locationId location to check
     * @param sessionDate date of the session
     * @param startTime start time of the session
     * @param endTime end time of the session
     * @param excludeSessionId session to exclude from checks (for updates)
     * @throws IllegalStateException if a conflict is detected (mapped to HTTP 409)
     */
    fun validateNoConflicts(
        trainerId: UUID?,
        locationId: UUID,
        sessionDate: LocalDate,
        startTime: LocalTime,
        endTime: LocalTime,
        excludeSessionId: UUID? = null
    ) {
        if (trainerId != null) {
            val trainerConflicts = sessionRepository.findConflictingSessionsByTrainer(
                trainerId, sessionDate, startTime, endTime, excludeSessionId
            )
            if (trainerConflicts.isNotEmpty()) {
                val existing = trainerConflicts.first()
                throw IllegalStateException(
                    "Trainer scheduling conflict: trainer $trainerId already has a session " +
                    "on $sessionDate from ${existing.startTime} to ${existing.endTime}"
                )
            }
        }

        val locationConflicts = sessionRepository.findConflictingSessionsByLocation(
            locationId, sessionDate, startTime, endTime, excludeSessionId
        )
        if (locationConflicts.isNotEmpty()) {
            val existing = locationConflicts.first()
            throw IllegalStateException(
                "Location scheduling conflict: location $locationId already has a session " +
                "on $sessionDate from ${existing.startTime} to ${existing.endTime}"
            )
        }
    }
}
