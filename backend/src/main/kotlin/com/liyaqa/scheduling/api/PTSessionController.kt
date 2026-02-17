package com.liyaqa.scheduling.api

import com.liyaqa.scheduling.application.services.PTSessionService
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/pt")
class PTSessionController(
    private val ptSessionService: PTSessionService
) {

    // ==================== PT CLASS ENDPOINTS ====================

    @PostMapping("/classes")
    @PreAuthorize("hasAuthority('classes_create')")
    fun createPTClass(@Valid @RequestBody request: CreatePTClassRequest): ResponseEntity<GymClassResponse> {
        val gymClass = ptSessionService.createPTClass(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(GymClassResponse.from(gymClass))
    }

    @PutMapping("/classes/{id}")
    @PreAuthorize("hasAuthority('classes_edit')")
    fun updatePTClass(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreatePTClassRequest
    ): ResponseEntity<GymClassResponse> {
        val gymClass = ptSessionService.updatePTClass(id, request.toCommand())
        return ResponseEntity.ok(GymClassResponse.from(gymClass))
    }

    @GetMapping("/classes")
    @PreAuthorize("hasAuthority('classes_view')")
    fun listPTClasses(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<GymClassResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val result = ptSessionService.listPTClasses(pageable)
        return ResponseEntity.ok(PageResponse(
            content = result.content.map { GymClassResponse.from(it) },
            page = result.number,
            size = result.size,
            totalElements = result.totalElements,
            totalPages = result.totalPages,
            first = result.isFirst,
            last = result.isLast
        ))
    }

    @GetMapping("/classes/{id}")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getPTClass(@PathVariable id: UUID): ResponseEntity<GymClassResponse> {
        val gymClass = ptSessionService.getPTClass(id)
        return ResponseEntity.ok(GymClassResponse.from(gymClass))
    }

    // ==================== PT SESSION ENDPOINTS ====================

    @PostMapping("/sessions")
    @PreAuthorize("hasAuthority('classes_create')")
    fun schedulePTSession(@Valid @RequestBody request: SchedulePTSessionRequest): ResponseEntity<ClassSessionResponse> {
        val session = ptSessionService.schedulePTSession(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(ClassSessionResponse.from(session))
    }

    @GetMapping("/sessions")
    @PreAuthorize("hasAuthority('classes_view')")
    fun listPTSessions(
        @RequestParam(required = false) trainerId: UUID?,
        @RequestParam(required = false) startDate: LocalDate?,
        @RequestParam(required = false) endDate: LocalDate?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClassSessionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "sessionDate"))
        val result = when {
            trainerId != null -> ptSessionService.getPTSessionsForTrainer(trainerId, pageable)
            startDate != null && endDate != null -> ptSessionService.getPTSessionsInRange(startDate, endDate, pageable)
            else -> ptSessionService.getPTSessionsInRange(LocalDate.now(), LocalDate.now().plusMonths(1), pageable)
        }
        return ResponseEntity.ok(PageResponse(
            content = result.content.map { ClassSessionResponse.from(it) },
            page = result.number,
            size = result.size,
            totalElements = result.totalElements,
            totalPages = result.totalPages,
            first = result.isFirst,
            last = result.isLast
        ))
    }

    // Note: Individual PT sessions are accessible via /api/classes/sessions/{id} from ClassController

    @PostMapping("/sessions/{id}/complete")
    @PreAuthorize("hasAuthority('classes_edit')")
    fun completePTSession(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CompletePTSessionRequest
    ): ResponseEntity<ClassSessionResponse> {
        val session = ptSessionService.completePTSession(request.toCommand(id))
        return ResponseEntity.ok(ClassSessionResponse.from(session))
    }

    @PostMapping("/sessions/{id}/cancel")
    @PreAuthorize("hasAuthority('classes_edit')")
    fun cancelPTSession(
        @PathVariable id: UUID,
        @RequestBody(required = false) request: CancelSessionRequest?
    ): ResponseEntity<ClassSessionResponse> {
        val session = ptSessionService.cancelPTSession(id, request?.reason)
        return ResponseEntity.ok(ClassSessionResponse.from(session))
    }

    @GetMapping("/trainer/{trainerId}/sessions")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getTrainerSessions(
        @PathVariable trainerId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClassSessionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "sessionDate"))
        val result = ptSessionService.getPTSessionsForTrainer(trainerId, pageable)
        return ResponseEntity.ok(PageResponse(
            content = result.content.map { ClassSessionResponse.from(it) },
            page = result.number,
            size = result.size,
            totalElements = result.totalElements,
            totalPages = result.totalPages,
            first = result.isFirst,
            last = result.isLast
        ))
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getDashboard(): ResponseEntity<PTDashboardStatsResponse> {
        return ResponseEntity.ok(ptSessionService.getPTDashboardStats())
    }
}
