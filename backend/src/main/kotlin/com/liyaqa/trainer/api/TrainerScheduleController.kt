package com.liyaqa.trainer.api

import com.liyaqa.trainer.application.commands.UpdateTrainerAvailabilityCommand
import com.liyaqa.trainer.application.services.PersonalTrainingService
import com.liyaqa.trainer.application.services.TrainerScheduleService
import com.liyaqa.trainer.application.services.TrainerService
import com.liyaqa.trainer.domain.model.PTSessionStatus
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.UUID

/**
 * REST controller for trainer schedule and availability management.
 *
 * Endpoints:
 * - Get trainer schedule
 * - Update trainer availability
 * - Get upcoming sessions
 */
@RestController
@RequestMapping("/api/trainer-portal/schedule")
@Tag(name = "Trainer Portal - Schedule", description = "Trainer schedule and availability management")
class TrainerScheduleController(
    private val trainerScheduleService: TrainerScheduleService,
    private val trainerService: TrainerService,
    private val personalTrainingService: PersonalTrainingService
) {
    private val logger = LoggerFactory.getLogger(TrainerScheduleController::class.java)

    @GetMapping
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "Get trainer schedule", description = "Get trainer's complete schedule including availability and upcoming sessions")
    fun getSchedule(@RequestParam trainerId: UUID): ResponseEntity<TrainerScheduleResponse> {
        logger.debug("Fetching schedule for trainer $trainerId")

        val today = LocalDate.now()
        val futureDate = today.plusDays(30)

        val upcomingSessions = personalTrainingService.getTrainerSessionsBetweenDates(trainerId, today, futureDate, PageRequest.of(0, 100)).content
        val trainer = trainerService.getTrainer(trainerId)
        val availability = trainerService.deserializeAvailability(trainer.availability)

        val response = TrainerScheduleResponse(
            trainerId = trainerId,
            availability = availability?.let { AvailabilityResponse.from(it) },
            upcomingSessions = upcomingSessions.map { session ->
                UpcomingSessionResponse(
                    sessionId = session.id,
                    sessionType = "PT",
                    sessionDate = session.sessionDate,
                    startTime = session.startTime,
                    endTime = session.endTime,
                    clientName = null, // TODO: Fetch member name
                    className = null,
                    location = null,
                    status = session.status.name
                )
            },
            unavailableDates = emptyList() // TODO: Implement time blocks
        )

        return ResponseEntity.ok(response)
    }

    @PutMapping("/availability")
    @PreAuthorize("hasAuthority('trainer_portal_update') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "Update trainer availability", description = "Update trainer's weekly availability schedule")
    fun updateAvailability(
        @RequestParam trainerId: UUID,
        @Valid @RequestBody request: UpdateAvailabilityRequest
    ): ResponseEntity<TrainerScheduleResponse> {
        logger.debug("Updating availability for trainer $trainerId")

        // Convert AvailabilityInput to command format
        val command = UpdateTrainerAvailabilityCommand(
            trainerId = trainerId,
            availability = com.liyaqa.trainer.application.commands.AvailabilityInput(
                monday = request.availability.monday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                tuesday = request.availability.tuesday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                wednesday = request.availability.wednesday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                thursday = request.availability.thursday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                friday = request.availability.friday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                saturday = request.availability.saturday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                sunday = request.availability.sunday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) }
            )
        )

        val updatedTrainer = trainerService.updateTrainerAvailability(command)
        val availability = trainerService.deserializeAvailability(updatedTrainer.availability)

        val today = LocalDate.now()
        val futureDate = today.plusDays(30)
        val upcomingSessions = personalTrainingService.getTrainerSessionsBetweenDates(trainerId, today, futureDate, PageRequest.of(0, 100)).content

        val response = TrainerScheduleResponse(
            trainerId = trainerId,
            availability = availability?.let { AvailabilityResponse.from(it) },
            upcomingSessions = upcomingSessions.map { session ->
                UpcomingSessionResponse(
                    sessionId = session.id,
                    sessionType = "PT",
                    sessionDate = session.sessionDate,
                    startTime = session.startTime,
                    endTime = session.endTime,
                    clientName = null,
                    className = null,
                    location = null,
                    status = session.status.name
                )
            },
            unavailableDates = emptyList()
        )

        logger.info("Updated availability for trainer $trainerId")
        return ResponseEntity.ok(response)
    }

    @GetMapping("/upcoming-sessions")
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "Get upcoming sessions", description = "Get list of upcoming sessions for a trainer")
    fun getUpcomingSessions(
        @RequestParam trainerId: UUID,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?,
        @RequestParam(defaultValue = "30") daysAhead: Int
    ): ResponseEntity<List<UpcomingSessionResponse>> {
        logger.debug("Fetching upcoming sessions for trainer $trainerId")

        val start = startDate ?: LocalDate.now()
        val end = endDate ?: LocalDate.now().plusDays(daysAhead.toLong())

        val sessions = personalTrainingService.getTrainerSessionsBetweenDates(trainerId, start, end, PageRequest.of(0, 1000)).content

        val responses = sessions
            .filter { it.status == PTSessionStatus.CONFIRMED || it.status == PTSessionStatus.REQUESTED }
            .map { session ->
                UpcomingSessionResponse(
                    sessionId = session.id,
                    sessionType = "PT",
                    sessionDate = session.sessionDate,
                    startTime = session.startTime,
                    endTime = session.endTime,
                    clientName = null, // TODO: Fetch member name
                    className = null,
                    location = null,
                    status = session.status.name
                )
            }

        return ResponseEntity.ok(responses)
    }

    @GetMapping("/today")
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "Get today's schedule", description = "Get all sessions scheduled for today")
    fun getTodaySchedule(@RequestParam trainerId: UUID): ResponseEntity<List<UpcomingSessionResponse>> {
        logger.debug("Fetching today's schedule for trainer $trainerId")

        val today = LocalDate.now()
        val sessions = personalTrainingService.getTrainerSessionsOnDate(trainerId, today)

        val responses = sessions.map { session ->
            UpcomingSessionResponse(
                sessionId = session.id,
                sessionType = "PT",
                sessionDate = session.sessionDate,
                startTime = session.startTime,
                endTime = session.endTime,
                clientName = null,
                className = null,
                location = null,
                status = session.status.name
            )
        }

        return ResponseEntity.ok(responses)
    }
}
