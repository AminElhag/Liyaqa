package com.liyaqa.trainer.api

import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.organization.domain.ports.LocationRepository
import com.liyaqa.trainer.application.services.PersonalTrainingService
import com.liyaqa.trainer.application.services.TrainerSecurityService
import com.liyaqa.trainer.domain.model.PTSessionStatus
import com.liyaqa.trainer.domain.model.PersonalTrainingSession
import com.liyaqa.trainer.domain.ports.TrainerRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

/**
 * REST controller for personal training session management.
 *
 * Endpoints for:
 * - Member PT booking
 * - Trainer session management
 * - Admin session overview
 */
@RestController
@RequestMapping("/api/pt-sessions")
@Tag(name = "Personal Training", description = "Personal training session booking and management")
class PersonalTrainingController(
    private val ptService: PersonalTrainingService,
    private val trainerRepository: TrainerRepository,
    private val memberRepository: MemberRepository,
    private val userRepository: UserRepository,
    private val locationRepository: LocationRepository,
    private val trainerSecurityService: TrainerSecurityService
) {

    // ==================== MEMBER BOOKING ====================

    @PostMapping
    @PreAuthorize("hasAuthority('pt_sessions_create')")
    @Operation(summary = "Book a PT session", description = "Member requests a personal training session with a trainer")
    fun bookSession(
        @Valid @RequestBody request: BookPTSessionRequest
    ): ResponseEntity<PTSessionResponse> {
        // Get the current user's member ID
        val authentication = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found")
        val userId = UUID.fromString(authentication.name)

        val member = memberRepository.findByUserId(userId)
            .orElseThrow { IllegalStateException("No member profile found for current user") }

        val session = ptService.requestSession(
            trainerId = request.trainerId,
            memberId = member.id,
            sessionDate = request.sessionDate,
            startTime = LocalTime.parse(request.startTime),
            durationMinutes = request.durationMinutes,
            notes = request.notes,
            locationId = request.locationId
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(buildSessionResponse(session))
    }

    @GetMapping("/trainers/{trainerId}/availability")
    @PreAuthorize("hasAuthority('pt_sessions_view')")
    @Operation(summary = "Get trainer availability", description = "Get available time slots for a trainer on a specific date")
    fun getTrainerAvailability(
        @PathVariable trainerId: UUID,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate,
        @RequestParam(defaultValue = "60") slotDurationMinutes: Int
    ): ResponseEntity<List<AvailableSlotResponse>> {
        val slots = ptService.getAvailableSlots(trainerId, date, slotDurationMinutes)
        return ResponseEntity.ok(slots.map { AvailableSlotResponse.from(it) })
    }

    // ==================== TRAINER OPERATIONS ====================

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAuthority('pt_sessions_update') or @trainerSecurityService.isOwnProfile(@personalTrainingController.getSessionTrainerId(#id))")
    @Operation(summary = "Confirm session", description = "Trainer confirms a pending session request")
    fun confirmSession(@PathVariable id: UUID): ResponseEntity<PTSessionResponse> {
        val session = ptService.confirmSession(id)
        return ResponseEntity.ok(buildSessionResponse(session))
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAuthority('pt_sessions_update') or @trainerSecurityService.isOwnProfile(@personalTrainingController.getSessionTrainerId(#id))")
    @Operation(summary = "Start session", description = "Trainer marks session as started")
    fun startSession(@PathVariable id: UUID): ResponseEntity<PTSessionResponse> {
        val session = ptService.startSession(id)
        return ResponseEntity.ok(buildSessionResponse(session))
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('pt_sessions_update') or @trainerSecurityService.isOwnProfile(@personalTrainingController.getSessionTrainerId(#id))")
    @Operation(summary = "Complete session", description = "Trainer marks session as completed")
    fun completeSession(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CompletePTSessionRequest?
    ): ResponseEntity<PTSessionResponse> {
        val session = ptService.completeSession(id, request?.trainerNotes)
        return ResponseEntity.ok(buildSessionResponse(session))
    }

    @PostMapping("/{id}/no-show")
    @PreAuthorize("hasAuthority('pt_sessions_update') or @trainerSecurityService.isOwnProfile(@personalTrainingController.getSessionTrainerId(#id))")
    @Operation(summary = "Mark no-show", description = "Trainer marks member as no-show")
    fun markNoShow(@PathVariable id: UUID): ResponseEntity<PTSessionResponse> {
        val session = ptService.markNoShow(id)
        return ResponseEntity.ok(buildSessionResponse(session))
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('pt_sessions_update')")
    @Operation(summary = "Cancel session", description = "Cancel a pending or confirmed session")
    fun cancelSession(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CancelPTSessionRequest?
    ): ResponseEntity<PTSessionResponse> {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found")
        val userId = UUID.fromString(authentication.name)

        val session = ptService.cancelSession(id, userId, request?.reason)
        return ResponseEntity.ok(buildSessionResponse(session))
    }

    @PostMapping("/{id}/reschedule")
    @PreAuthorize("hasAuthority('pt_sessions_update') or @trainerSecurityService.isOwnProfile(@personalTrainingController.getSessionTrainerId(#id))")
    @Operation(summary = "Reschedule session", description = "Reschedule a session to a new date/time")
    fun rescheduleSession(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ReschedulePTSessionRequest
    ): ResponseEntity<PTSessionResponse> {
        val session = ptService.rescheduleSession(
            sessionId = id,
            newDate = request.newDate,
            newStartTime = LocalTime.parse(request.newStartTime),
            newDurationMinutes = request.newDurationMinutes
        )
        return ResponseEntity.ok(buildSessionResponse(session))
    }

    // ==================== QUERY OPERATIONS ====================

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('pt_sessions_view')")
    @Operation(summary = "Get session by ID", description = "Get a personal training session by ID")
    fun getSession(@PathVariable id: UUID): ResponseEntity<PTSessionResponse> {
        val session = ptService.getSession(id)
        return ResponseEntity.ok(buildSessionResponse(session))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('pt_sessions_view')")
    @Operation(summary = "List all sessions", description = "List all PT sessions with filtering")
    fun getAllSessions(
        @RequestParam(required = false) trainerId: UUID?,
        @RequestParam(required = false) memberId: UUID?,
        @RequestParam(required = false) status: PTSessionStatus?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sessionDate") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<PTSessionSummaryResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))

        val sessionPage = when {
            trainerId != null && status != null -> ptService.getSessionsByTrainerAndStatus(trainerId, status, pageable)
            memberId != null && status != null -> ptService.getSessionsByMemberAndStatus(memberId, status, pageable)
            trainerId != null -> ptService.getSessionsByTrainer(trainerId, pageable)
            memberId != null -> ptService.getSessionsByMember(memberId, pageable)
            startDate != null && endDate != null -> ptService.getSessionsBetweenDates(startDate, endDate, pageable)
            else -> ptService.getAllSessions(pageable)
        }

        val response = PageResponse(
            content = sessionPage.content.map { session -> buildSessionSummary(session) },
            page = sessionPage.number,
            size = sessionPage.size,
            totalElements = sessionPage.totalElements,
            totalPages = sessionPage.totalPages,
            first = sessionPage.isFirst,
            last = sessionPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    // ==================== TRAINER'S OWN SESSIONS ====================

    @GetMapping("/my/pending")
    @PreAuthorize("hasAuthority('pt_sessions_view')")
    @Operation(summary = "Get my pending sessions", description = "Trainer gets their pending session requests")
    fun getMyPendingSessions(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<PTSessionSummaryResponse>> {
        val trainerId = trainerSecurityService.getCurrentTrainerId()
            ?: throw IllegalStateException("No trainer profile found for current user")

        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "sessionDate", "startTime"))
        val sessionPage = ptService.getPendingSessionsForTrainer(trainerId, pageable)

        val response = PageResponse(
            content = sessionPage.content.map { session -> buildSessionSummary(session) },
            page = sessionPage.number,
            size = sessionPage.size,
            totalElements = sessionPage.totalElements,
            totalPages = sessionPage.totalPages,
            first = sessionPage.isFirst,
            last = sessionPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/my/upcoming")
    @PreAuthorize("hasAuthority('pt_sessions_view')")
    @Operation(summary = "Get my upcoming sessions", description = "Trainer gets their upcoming confirmed sessions")
    fun getMyUpcomingSessions(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<PTSessionSummaryResponse>> {
        val trainerId = trainerSecurityService.getCurrentTrainerId()
            ?: throw IllegalStateException("No trainer profile found for current user")

        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "sessionDate", "startTime"))
        val sessionPage = ptService.getUpcomingSessionsForTrainer(trainerId, pageable)

        val response = PageResponse(
            content = sessionPage.content.map { session -> buildSessionSummary(session) },
            page = sessionPage.number,
            size = sessionPage.size,
            totalElements = sessionPage.totalElements,
            totalPages = sessionPage.totalPages,
            first = sessionPage.isFirst,
            last = sessionPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    // ==================== MEMBER'S OWN SESSIONS ====================

    @GetMapping("/member/upcoming")
    @PreAuthorize("hasAuthority('pt_sessions_view')")
    @Operation(summary = "Get my PT sessions", description = "Member gets their upcoming PT sessions")
    fun getMemberUpcomingSessions(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<PTSessionSummaryResponse>> {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found")
        val userId = UUID.fromString(authentication.name)

        val member = memberRepository.findByUserId(userId)
            .orElseThrow { IllegalStateException("No member profile found for current user") }

        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "sessionDate", "startTime"))
        val sessionPage = ptService.getUpcomingSessionsForMember(member.id, pageable)

        val response = PageResponse(
            content = sessionPage.content.map { session -> buildSessionSummary(session) },
            page = sessionPage.number,
            size = sessionPage.size,
            totalElements = sessionPage.totalElements,
            totalPages = sessionPage.totalPages,
            first = sessionPage.isFirst,
            last = sessionPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    // ==================== DELETE ====================

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('pt_sessions_delete')")
    @Operation(summary = "Delete session", description = "Permanently delete a PT session (admin only)")
    fun deleteSession(@PathVariable id: UUID): ResponseEntity<Void> {
        ptService.deleteSession(id)
        return ResponseEntity.noContent().build()
    }

    // ==================== HELPER METHODS ====================

    /**
     * Helper method used in @PreAuthorize to get the trainer ID of a session.
     */
    fun getSessionTrainerId(sessionId: UUID): UUID {
        return ptService.getSession(sessionId).trainerId
    }

    private fun buildSessionResponse(session: PersonalTrainingSession): PTSessionResponse {
        val trainer = trainerRepository.findById(session.trainerId).orElse(null)
        val trainerUser = trainer?.let { userRepository.findById(it.userId).orElse(null) }
        val member = memberRepository.findById(session.memberId).orElse(null)
        val location = session.locationId?.let { locationRepository.findById(it).orElse(null) }

        return PTSessionResponse.from(
            session = session,
            trainerName = trainerUser?.displayName?.get("en"),
            memberName = member?.fullName?.get("en"),
            memberEmail = member?.email,
            locationName = location?.name?.get("en")
        )
    }

    private fun buildSessionSummary(session: PersonalTrainingSession): PTSessionSummaryResponse {
        val trainer = trainerRepository.findById(session.trainerId).orElse(null)
        val trainerUser = trainer?.let { userRepository.findById(it.userId).orElse(null) }
        val member = memberRepository.findById(session.memberId).orElse(null)

        return PTSessionSummaryResponse.from(
            session = session,
            trainerName = trainerUser?.displayName?.get("en"),
            memberName = member?.fullName?.get("en")
        )
    }
}
