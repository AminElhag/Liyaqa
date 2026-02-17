package com.liyaqa.scheduling.api

import com.liyaqa.scheduling.application.commands.CreateClassScheduleCommand
import com.liyaqa.scheduling.application.services.ClassService
import com.liyaqa.scheduling.domain.model.DayOfWeek
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

@RestController
@RequestMapping("/api/classes")
class ClassController(
    private val classService: ClassService
) {
    // ==================== GYM CLASS ENDPOINTS ====================

    /**
     * Creates a new gym class.
     * Optionally creates schedules if provided in the request.
     * Trainers can create their own classes.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('classes_create')")
    fun createGymClass(@Valid @RequestBody request: CreateGymClassRequest): ResponseEntity<GymClassResponse> {
        val gymClass = classService.createGymClass(request.toCommand())

        // Create schedules if provided in the request
        request.schedules?.forEach { schedule ->
            classService.createSchedule(
                CreateClassScheduleCommand(
                    gymClassId = gymClass.id,
                    dayOfWeek = schedule.dayOfWeek,
                    startTime = LocalTime.parse(schedule.startTime),
                    endTime = LocalTime.parse(schedule.endTime)
                )
            )
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(GymClassResponse.from(gymClass))
    }

    /**
     * Gets a gym class by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getGymClass(@PathVariable id: UUID): ResponseEntity<GymClassResponse> {
        val gymClass = classService.getGymClass(id)
        val schedules = classService.getSchedulesByGymClass(id)
        return ResponseEntity.ok(GymClassResponse.from(gymClass, schedules))
    }

    /**
     * Lists all gym classes.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('classes_view')")
    fun getAllGymClasses(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<GymClassResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val classesPage = classService.getAllGymClasses(pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = classesPage.content.map { GymClassResponse.from(it) },
                page = classesPage.number,
                size = classesPage.size,
                totalElements = classesPage.totalElements,
                totalPages = classesPage.totalPages,
                first = classesPage.isFirst,
                last = classesPage.isLast
            )
        )
    }

    /**
     * Gets gym classes by location.
     */
    @GetMapping("/location/{locationId}")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getGymClassesByLocation(
        @PathVariable locationId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<GymClassResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val classesPage = classService.getGymClassesByLocation(locationId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = classesPage.content.map { GymClassResponse.from(it) },
                page = classesPage.number,
                size = classesPage.size,
                totalElements = classesPage.totalElements,
                totalPages = classesPage.totalPages,
                first = classesPage.isFirst,
                last = classesPage.isLast
            )
        )
    }

    /**
     * Gets active gym classes by location.
     */
    @GetMapping("/location/{locationId}/active")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getActiveGymClassesByLocation(
        @PathVariable locationId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<GymClassResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val classesPage = classService.getActiveGymClassesByLocation(locationId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = classesPage.content.map { GymClassResponse.from(it) },
                page = classesPage.number,
                size = classesPage.size,
                totalElements = classesPage.totalElements,
                totalPages = classesPage.totalPages,
                first = classesPage.isFirst,
                last = classesPage.isLast
            )
        )
    }

    /**
     * Gets gym classes by trainer.
     */
    @GetMapping("/trainer/{trainerId}")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun getGymClassesByTrainer(
        @PathVariable trainerId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<GymClassResponse>> {
        val pageable = PageRequest.of(page, size)
        val classesPage = classService.getGymClassesByTrainer(trainerId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = classesPage.content.map { GymClassResponse.from(it) },
                page = classesPage.number,
                size = classesPage.size,
                totalElements = classesPage.totalElements,
                totalPages = classesPage.totalPages,
                first = classesPage.isFirst,
                last = classesPage.isLast
            )
        )
    }

    /**
     * Updates a gym class.
     * Trainers can update their own classes.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('classes_create')")
    fun updateGymClass(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateGymClassRequest
    ): ResponseEntity<GymClassResponse> {
        val gymClass = classService.updateGymClass(id, request.toCommand())
        return ResponseEntity.ok(GymClassResponse.from(gymClass))
    }

    /**
     * Activates a gym class.
     * Trainers can activate their own classes.
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('classes_create')")
    fun activateGymClass(@PathVariable id: UUID): ResponseEntity<GymClassResponse> {
        val gymClass = classService.activateGymClass(id)
        return ResponseEntity.ok(GymClassResponse.from(gymClass))
    }

    /**
     * Deactivates a gym class.
     * Trainers can deactivate their own classes.
     */
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('classes_create')")
    fun deactivateGymClass(@PathVariable id: UUID): ResponseEntity<GymClassResponse> {
        val gymClass = classService.deactivateGymClass(id)
        return ResponseEntity.ok(GymClassResponse.from(gymClass))
    }

    /**
     * Archives a gym class.
     */
    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('classes_delete')")
    fun archiveGymClass(@PathVariable id: UUID): ResponseEntity<GymClassResponse> {
        val gymClass = classService.archiveGymClass(id)
        return ResponseEntity.ok(GymClassResponse.from(gymClass))
    }

    /**
     * Assigns a trainer to a gym class.
     */
    @PostMapping("/{id}/assign-trainer/{trainerId}")
    @PreAuthorize("hasAuthority('classes_delete')")
    fun assignTrainerToGymClass(
        @PathVariable id: UUID,
        @PathVariable trainerId: UUID
    ): ResponseEntity<GymClassResponse> {
        val gymClass = classService.assignTrainerToGymClass(id, trainerId)
        return ResponseEntity.ok(GymClassResponse.from(gymClass))
    }

    // ==================== SCHEDULE ENDPOINTS ====================

    /**
     * Creates a recurring schedule for a gym class.
     * Trainers can create schedules for their own classes.
     */
    @PostMapping("/{classId}/schedules")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun createSchedule(
        @PathVariable classId: UUID,
        @Valid @RequestBody request: CreateClassScheduleRequest
    ): ResponseEntity<ClassScheduleResponse> {
        val command = request.copy(gymClassId = classId).toCommand()
        val schedule = classService.createSchedule(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(ClassScheduleResponse.from(schedule))
    }

    /**
     * Gets a schedule by ID.
     */
    @GetMapping("/schedules/{id}")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun getSchedule(@PathVariable id: UUID): ResponseEntity<ClassScheduleResponse> {
        val schedule = classService.getSchedule(id)
        return ResponseEntity.ok(ClassScheduleResponse.from(schedule))
    }

    /**
     * Gets all schedules for a gym class.
     */
    @GetMapping("/{classId}/schedules")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun getSchedulesByGymClass(@PathVariable classId: UUID): ResponseEntity<List<ClassScheduleResponse>> {
        val schedules = classService.getSchedulesByGymClass(classId)
        return ResponseEntity.ok(schedules.map { ClassScheduleResponse.from(it) })
    }

    /**
     * Gets active schedules for a gym class.
     */
    @GetMapping("/{classId}/schedules/active")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getActiveSchedulesByGymClass(@PathVariable classId: UUID): ResponseEntity<List<ClassScheduleResponse>> {
        val schedules = classService.getActiveSchedulesByGymClass(classId)
        return ResponseEntity.ok(schedules.map { ClassScheduleResponse.from(it) })
    }

    /**
     * Updates a schedule.
     * Trainers can update schedules for their own classes.
     */
    @PutMapping("/schedules/{id}")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun updateSchedule(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateClassScheduleRequest
    ): ResponseEntity<ClassScheduleResponse> {
        val schedule = classService.updateSchedule(id, request.toCommand())
        return ResponseEntity.ok(ClassScheduleResponse.from(schedule))
    }

    /**
     * Deactivates a schedule.
     * Trainers can deactivate schedules for their own classes.
     */
    @PostMapping("/schedules/{id}/deactivate")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun deactivateSchedule(@PathVariable id: UUID): ResponseEntity<ClassScheduleResponse> {
        val schedule = classService.deactivateSchedule(id)
        return ResponseEntity.ok(ClassScheduleResponse.from(schedule))
    }

    /**
     * Deletes a schedule.
     */
    @DeleteMapping("/{classId}/schedules/{id}")
    @PreAuthorize("hasAuthority('classes_delete')")
    fun deleteSchedule(@PathVariable classId: UUID, @PathVariable id: UUID): ResponseEntity<Unit> {
        classService.deleteSchedule(id)
        return ResponseEntity.noContent().build()
    }

    // ==================== SESSION ENDPOINTS ====================

    /**
     * Creates a single class session.
     * Trainers can create sessions for their own classes.
     */
    @PostMapping("/sessions")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun createSession(@Valid @RequestBody request: CreateClassSessionRequest): ResponseEntity<ClassSessionResponse> {
        val session = classService.createSession(request.toCommand())
        val gymClass = classService.getGymClassesMap(setOf(session.gymClassId))[session.gymClassId]
        return ResponseEntity.status(HttpStatus.CREATED).body(ClassSessionResponse.from(session, gymClass))
    }

    /**
     * Generates sessions from schedules for a date range.
     * Trainers can generate sessions for their own classes.
     */
    @PostMapping("/sessions/generate")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun generateSessions(@Valid @RequestBody request: GenerateSessionsRequest): ResponseEntity<List<ClassSessionResponse>> {
        val sessions = classService.generateSessionsFromSchedules(request.toCommand())
        val classMap = classService.getGymClassesMap(sessions.map { it.gymClassId }.toSet())
        return ResponseEntity.status(HttpStatus.CREATED).body(sessions.map { ClassSessionResponse.from(it, classMap[it.gymClassId]) })
    }

    /**
     * Gets a session by ID.
     */
    @GetMapping("/sessions/{id}")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getSession(@PathVariable id: UUID): ResponseEntity<ClassSessionResponse> {
        val session = classService.getSession(id)
        val gymClass = classService.getGymClassesMap(setOf(session.gymClassId))[session.gymClassId]
        return ResponseEntity.ok(ClassSessionResponse.from(session, gymClass))
    }

    /**
     * Gets sessions by gym class.
     */
    @GetMapping("/{classId}/sessions")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getSessionsByGymClass(
        @PathVariable classId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClassSessionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("sessionDate", "startTime"))
        val sessionsPage = classService.getSessionsByGymClass(classId, pageable)
        val classMap = classService.getGymClassesMap(setOf(classId))

        return ResponseEntity.ok(
            PageResponse(
                content = sessionsPage.content.map { ClassSessionResponse.from(it, classMap[it.gymClassId]) },
                page = sessionsPage.number,
                size = sessionsPage.size,
                totalElements = sessionsPage.totalElements,
                totalPages = sessionsPage.totalPages,
                first = sessionsPage.isFirst,
                last = sessionsPage.isLast
            )
        )
    }

    /**
     * Gets upcoming sessions by gym class.
     */
    @GetMapping("/{classId}/sessions/upcoming")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getUpcomingSessionsByGymClass(
        @PathVariable classId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClassSessionResponse>> {
        val pageable = PageRequest.of(page, size)
        val sessionsPage = classService.getUpcomingSessionsByGymClass(classId, pageable)
        val classMap = classService.getGymClassesMap(setOf(classId))

        return ResponseEntity.ok(
            PageResponse(
                content = sessionsPage.content.map { ClassSessionResponse.from(it, classMap[it.gymClassId]) },
                page = sessionsPage.number,
                size = sessionsPage.size,
                totalElements = sessionsPage.totalElements,
                totalPages = sessionsPage.totalPages,
                first = sessionsPage.isFirst,
                last = sessionsPage.isLast
            )
        )
    }

    /**
     * Gets sessions by date.
     */
    @GetMapping("/sessions/date/{date}")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun getSessionsByDate(
        @PathVariable date: LocalDate,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClassSessionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("startTime"))
        val sessionsPage = classService.getSessionsByDate(date, pageable)
        val classMap = classService.getGymClassesMap(sessionsPage.content.map { it.gymClassId }.toSet())

        return ResponseEntity.ok(
            PageResponse(
                content = sessionsPage.content.map { ClassSessionResponse.from(it, classMap[it.gymClassId]) },
                page = sessionsPage.number,
                size = sessionsPage.size,
                totalElements = sessionsPage.totalElements,
                totalPages = sessionsPage.totalPages,
                first = sessionsPage.isFirst,
                last = sessionsPage.isLast
            )
        )
    }

    /**
     * Gets sessions in a date range.
     */
    @GetMapping("/sessions")
    @PreAuthorize("hasAuthority('sessions_view')")
    fun getSessionsByDateRange(
        @RequestParam startDate: LocalDate,
        @RequestParam endDate: LocalDate,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClassSessionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("sessionDate", "startTime"))
        val sessionsPage = classService.getSessionsByDateRange(startDate, endDate, pageable)
        val classMap = classService.getGymClassesMap(sessionsPage.content.map { it.gymClassId }.toSet())

        return ResponseEntity.ok(
            PageResponse(
                content = sessionsPage.content.map { ClassSessionResponse.from(it, classMap[it.gymClassId]) },
                page = sessionsPage.number,
                size = sessionsPage.size,
                totalElements = sessionsPage.totalElements,
                totalPages = sessionsPage.totalPages,
                first = sessionsPage.isFirst,
                last = sessionsPage.isLast
            )
        )
    }

    /**
     * Gets sessions by location.
     */
    @GetMapping("/sessions/location/{locationId}")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getSessionsByLocation(
        @PathVariable locationId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClassSessionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("sessionDate", "startTime"))
        val sessionsPage = classService.getSessionsByLocation(locationId, pageable)
        val classMap = classService.getGymClassesMap(sessionsPage.content.map { it.gymClassId }.toSet())

        return ResponseEntity.ok(
            PageResponse(
                content = sessionsPage.content.map { ClassSessionResponse.from(it, classMap[it.gymClassId]) },
                page = sessionsPage.number,
                size = sessionsPage.size,
                totalElements = sessionsPage.totalElements,
                totalPages = sessionsPage.totalPages,
                first = sessionsPage.isFirst,
                last = sessionsPage.isLast
            )
        )
    }

    /**
     * Gets upcoming sessions at a location.
     */
    @GetMapping("/sessions/location/{locationId}/upcoming")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getUpcomingSessionsByLocation(
        @PathVariable locationId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClassSessionResponse>> {
        val pageable = PageRequest.of(page, size)
        val sessionsPage = classService.getUpcomingSessionsByLocation(locationId, pageable)
        val classMap = classService.getGymClassesMap(sessionsPage.content.map { it.gymClassId }.toSet())

        return ResponseEntity.ok(
            PageResponse(
                content = sessionsPage.content.map { ClassSessionResponse.from(it, classMap[it.gymClassId]) },
                page = sessionsPage.number,
                size = sessionsPage.size,
                totalElements = sessionsPage.totalElements,
                totalPages = sessionsPage.totalPages,
                first = sessionsPage.isFirst,
                last = sessionsPage.isLast
            )
        )
    }

    /**
     * Updates a session.
     * Trainers can update sessions they are assigned to.
     */
    @PutMapping("/sessions/{id}")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun updateSession(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateClassSessionRequest
    ): ResponseEntity<ClassSessionResponse> {
        val session = classService.updateSession(id, request.toCommand())
        val gymClass = classService.getGymClassesMap(setOf(session.gymClassId))[session.gymClassId]
        return ResponseEntity.ok(ClassSessionResponse.from(session, gymClass))
    }

    /**
     * Starts a session.
     * Trainers can start sessions they are assigned to.
     */
    @PostMapping("/sessions/{id}/start")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun startSession(@PathVariable id: UUID): ResponseEntity<ClassSessionResponse> {
        val session = classService.startSession(id)
        val gymClass = classService.getGymClassesMap(setOf(session.gymClassId))[session.gymClassId]
        return ResponseEntity.ok(ClassSessionResponse.from(session, gymClass))
    }

    /**
     * Completes a session.
     * Trainers can complete sessions they are assigned to.
     */
    @PostMapping("/sessions/{id}/complete")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun completeSession(@PathVariable id: UUID): ResponseEntity<ClassSessionResponse> {
        val session = classService.completeSession(id)
        val gymClass = classService.getGymClassesMap(setOf(session.gymClassId))[session.gymClassId]
        return ResponseEntity.ok(ClassSessionResponse.from(session, gymClass))
    }

    /**
     * Cancels a session.
     * Trainers can cancel sessions they are assigned to.
     */
    @PostMapping("/sessions/{id}/cancel")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun cancelSession(
        @PathVariable id: UUID,
        @RequestBody(required = false) request: CancelSessionRequest?
    ): ResponseEntity<ClassSessionResponse> {
        val session = classService.cancelSession(id, request?.reason)
        val gymClass = classService.getGymClassesMap(setOf(session.gymClassId))[session.gymClassId]
        return ResponseEntity.ok(ClassSessionResponse.from(session, gymClass))
    }

    /**
     * Assigns a trainer to a session.
     */
    @PostMapping("/sessions/{id}/assign-trainer/{trainerId}")
    @PreAuthorize("hasAuthority('sessions_update')")
    fun assignTrainerToSession(
        @PathVariable id: UUID,
        @PathVariable trainerId: UUID
    ): ResponseEntity<ClassSessionResponse> {
        val session = classService.assignTrainerToSession(id, trainerId)
        val gymClass = classService.getGymClassesMap(setOf(session.gymClassId))[session.gymClassId]
        return ResponseEntity.ok(ClassSessionResponse.from(session, gymClass))
    }

    /**
     * Deletes a session.
     * Only scheduled or cancelled sessions can be deleted.
     */
    @DeleteMapping("/sessions/{id}")
    @PreAuthorize("hasAuthority('classes_delete')")
    fun deleteSession(@PathVariable id: UUID): ResponseEntity<Unit> {
        classService.deleteSession(id)
        return ResponseEntity.noContent().build()
    }
}
