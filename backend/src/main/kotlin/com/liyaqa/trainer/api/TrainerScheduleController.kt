package com.liyaqa.trainer.api

import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.trainer.application.commands.UpdateTrainerAvailabilityCommand
import com.liyaqa.trainer.application.services.PersonalTrainingService
import com.liyaqa.trainer.application.services.TrainerScheduleService
import com.liyaqa.trainer.application.services.TrainerSecurityService
import com.liyaqa.trainer.application.services.TrainerService
import com.liyaqa.trainer.domain.model.PersonalTrainingSession
import com.liyaqa.trainer.domain.ports.TrainerRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

/**
 * REST controller for trainer schedule and availability management.
 *
 * Endpoints:
 * - Get trainer schedule
 * - Update trainer availability
 * - Get upcoming sessions
 * - Create a PT session (trainer-initiated)
 */
@RestController
@RequestMapping("/api/trainer-portal/schedule")
@Tag(name = "Trainer Portal - Schedule", description = "Trainer schedule and availability management")
class TrainerScheduleController(
    private val trainerScheduleService: TrainerScheduleService,
    private val trainerService: TrainerService,
    private val personalTrainingService: PersonalTrainingService,
    private val trainerSecurityService: TrainerSecurityService,
    private val trainerRepository: TrainerRepository,
    private val memberRepository: MemberRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(TrainerScheduleController::class.java)

    @PostMapping("/sessions")
    @PreAuthorize("hasAuthority('pt_sessions_create') or @trainerSecurityService.isTrainer()")
    @Operation(summary = "Create PT session", description = "Trainer creates a PT session for a member (auto-confirmed)")
    fun createSession(
        @Valid @RequestBody request: CreateTrainerSessionRequest
    ): ResponseEntity<PTSessionResponse> {
        val trainerId = trainerSecurityService.getCurrentTrainerId()
            ?: throw NoSuchElementException("No trainer profile found for current user")

        logger.debug("Trainer $trainerId creating session for member ${request.memberId}")

        val session = personalTrainingService.requestSession(
            trainerId = trainerId,
            memberId = request.memberId,
            sessionDate = request.sessionDate,
            startTime = LocalTime.parse(request.startTime),
            durationMinutes = request.durationMinutes,
            notes = request.notes,
            locationId = request.locationId
        )

        // Auto-confirm: trainer-created sessions skip REQUESTED state
        val confirmedSession = personalTrainingService.confirmSession(session.id)

        logger.info("Trainer $trainerId created and confirmed session ${confirmedSession.id}")
        return ResponseEntity.status(HttpStatus.CREATED).body(buildPTSessionResponse(confirmedSession))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isTrainer()")
    @Operation(summary = "Get trainer schedule", description = "Get trainer's complete schedule including availability and upcoming sessions")
    fun getSchedule(@RequestParam(required = false) trainerId: UUID? = null): ResponseEntity<TrainerScheduleResponse> {
        val resolvedTrainerId = trainerId ?: trainerSecurityService.getCurrentTrainerId()
            ?: throw NoSuchElementException("No trainer profile found for current user")
        logger.debug("Fetching schedule for trainer $resolvedTrainerId")

        val today = LocalDate.now()
        val futureDate = today.plusDays(30)

        val upcomingSessions = personalTrainingService.getTrainerSessionsBetweenDates(resolvedTrainerId, today, futureDate, PageRequest.of(0, 100)).content
        val trainer = trainerService.getTrainer(resolvedTrainerId)
        val availability = trainerService.deserializeAvailability(trainer.availability)

        val response = TrainerScheduleResponse(
            trainerId = resolvedTrainerId,
            availability = availability?.let { AvailabilityResponse.from(it) },
            upcomingSessions = upcomingSessions.map { session -> buildUpcomingResponse(session) },
            unavailableDates = emptyList()
        )

        return ResponseEntity.ok(response)
    }

    @PutMapping("/availability")
    @PreAuthorize("hasAuthority('trainer_portal_update') or @trainerSecurityService.isTrainer()")
    @Operation(summary = "Update trainer availability", description = "Update trainer's weekly availability schedule")
    fun updateAvailability(
        @RequestParam(required = false) trainerId: UUID? = null,
        @Valid @RequestBody request: UpdateAvailabilityRequest
    ): ResponseEntity<TrainerScheduleResponse> {
        val resolvedTrainerId = trainerId ?: trainerSecurityService.getCurrentTrainerId()
            ?: throw NoSuchElementException("No trainer profile found for current user")
        logger.debug("Updating availability for trainer $resolvedTrainerId")

        // Convert AvailabilityInput to command format
        val command = UpdateTrainerAvailabilityCommand(
            trainerId = resolvedTrainerId,
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
        val upcomingSessions = personalTrainingService.getTrainerSessionsBetweenDates(resolvedTrainerId, today, futureDate, PageRequest.of(0, 100)).content

        val response = TrainerScheduleResponse(
            trainerId = resolvedTrainerId,
            availability = availability?.let { AvailabilityResponse.from(it) },
            upcomingSessions = upcomingSessions.map { session -> buildUpcomingResponse(session) },
            unavailableDates = emptyList()
        )

        logger.info("Updated availability for trainer $resolvedTrainerId")
        return ResponseEntity.ok(response)
    }

    @GetMapping("/upcoming-sessions")
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isTrainer()")
    @Operation(summary = "Get upcoming sessions", description = "Get list of sessions for a trainer within a date range")
    fun getUpcomingSessions(
        @RequestParam(required = false) trainerId: UUID? = null,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?,
        @RequestParam(defaultValue = "30") daysAhead: Int
    ): ResponseEntity<List<UpcomingSessionResponse>> {
        val resolvedTrainerId = trainerId ?: trainerSecurityService.getCurrentTrainerId()
            ?: throw NoSuchElementException("No trainer profile found for current user")
        logger.debug("Fetching upcoming sessions for trainer $resolvedTrainerId")

        val start = startDate ?: LocalDate.now()
        val end = endDate ?: LocalDate.now().plusDays(daysAhead.toLong())

        val sessions = personalTrainingService.getTrainerSessionsBetweenDates(resolvedTrainerId, start, end, PageRequest.of(0, 1000)).content

        // Return all sessions (no status filter) so the weekly view can show completed/cancelled
        val responses = sessions.map { session -> buildUpcomingResponse(session) }

        return ResponseEntity.ok(responses)
    }

    @GetMapping("/today")
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isTrainer()")
    @Operation(summary = "Get today's schedule", description = "Get all sessions scheduled for today")
    fun getTodaySchedule(@RequestParam(required = false) trainerId: UUID? = null): ResponseEntity<List<UpcomingSessionResponse>> {
        val resolvedTrainerId = trainerId ?: trainerSecurityService.getCurrentTrainerId()
            ?: throw NoSuchElementException("No trainer profile found for current user")
        logger.debug("Fetching today's schedule for trainer $resolvedTrainerId")

        val today = LocalDate.now()
        val sessions = personalTrainingService.getTrainerSessionsOnDate(resolvedTrainerId, today)

        val responses = sessions.map { session -> buildUpcomingResponse(session) }

        return ResponseEntity.ok(responses)
    }

    // ==================== HELPER METHODS ====================

    private fun getClientName(memberId: UUID): String? {
        val member = memberRepository.findById(memberId).orElse(null) ?: return null
        return member.fullName.get("en")?.ifBlank { null }
    }

    private fun buildUpcomingResponse(session: PersonalTrainingSession): UpcomingSessionResponse {
        return UpcomingSessionResponse(
            sessionId = session.id,
            sessionType = "PT",
            sessionDate = session.sessionDate,
            startTime = session.startTime,
            endTime = session.endTime,
            clientName = getClientName(session.memberId),
            className = null,
            location = null,
            status = session.status.name
        )
    }

    private fun buildPTSessionResponse(session: PersonalTrainingSession): PTSessionResponse {
        val trainer = trainerRepository.findById(session.trainerId).orElse(null)
        val trainerUser = trainer?.userId?.let { userRepository.findById(it).orElse(null) }
        val member = memberRepository.findById(session.memberId).orElse(null)

        return PTSessionResponse.from(
            session = session,
            trainerName = trainerUser?.displayName?.get("en"),
            memberName = member?.fullName?.get("en"),
            memberEmail = member?.email
        )
    }
}
