package com.liyaqa.membership.api

import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.membership.application.services.CompleteTaskCommand
import com.liyaqa.membership.application.services.CreateTaskCommand
import com.liyaqa.membership.application.services.MemberTaskService
import com.liyaqa.membership.application.services.UpdateTaskCommand
import com.liyaqa.membership.domain.model.TaskStatus
import com.liyaqa.membership.domain.model.TaskType
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.shared.api.PageResponse
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
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
import java.util.UUID

@RestController
@RequestMapping("/api")
class MemberTaskController(
    private val taskService: MemberTaskService,
    private val memberRepository: MemberRepository,
    private val userRepository: UserRepository
) {

    private fun getCurrentUserId(user: JwtUserPrincipal?): UUID? {
        return user?.userId
    }

    private fun enrichTaskResponse(task: com.liyaqa.membership.domain.model.MemberTask): MemberTaskResponse {
        val member = memberRepository.findById(task.memberId).orElse(null)
        val assignee = task.assignedToUserId?.let { userRepository.findById(it).orElse(null) }
        return MemberTaskResponse.from(
            task = task,
            memberName = member?.fullName?.en,
            assignedToName = assignee?.displayName?.en
        )
    }

    /**
     * Create a new task.
     */
    @PostMapping("/tasks")
    @PreAuthorize("hasAnyAuthority('tasks_create', 'members_manage')")
    fun createTask(
        @Valid @RequestBody request: CreateTaskRequest
    ): ResponseEntity<MemberTaskResponse> {
        val task = taskService.createTask(
            CreateTaskCommand(
                memberId = request.memberId,
                taskType = request.taskType,
                title = request.title,
                description = request.description,
                dueDate = request.dueDate,
                dueTime = request.dueTime,
                priority = request.priority,
                assignedToUserId = request.assignedToUserId,
                metadata = request.metadata
            )
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(enrichTaskResponse(task))
    }

    /**
     * Get a task by ID.
     */
    @GetMapping("/tasks/{taskId}")
    @PreAuthorize("hasAnyAuthority('tasks_view', 'members_view')")
    fun getTask(
        @PathVariable taskId: UUID
    ): ResponseEntity<MemberTaskResponse> {
        val task = taskService.getTask(taskId)
        return ResponseEntity.ok(enrichTaskResponse(task))
    }

    /**
     * Update a task.
     */
    @PutMapping("/tasks/{taskId}")
    @PreAuthorize("hasAnyAuthority('tasks_manage', 'members_manage')")
    fun updateTask(
        @PathVariable taskId: UUID,
        @Valid @RequestBody request: UpdateTaskRequest
    ): ResponseEntity<MemberTaskResponse> {
        val task = taskService.updateTask(
            taskId,
            UpdateTaskCommand(
                title = request.title,
                description = request.description,
                dueDate = request.dueDate,
                dueTime = request.dueTime,
                priority = request.priority,
                assignedToUserId = request.assignedToUserId
            )
        )
        return ResponseEntity.ok(enrichTaskResponse(task))
    }

    /**
     * Assign a task to a user.
     */
    @PostMapping("/tasks/{taskId}/assign")
    @PreAuthorize("hasAnyAuthority('tasks_manage', 'members_manage')")
    fun assignTask(
        @PathVariable taskId: UUID,
        @Valid @RequestBody request: AssignTaskRequest
    ): ResponseEntity<MemberTaskResponse> {
        val task = taskService.assignTask(taskId, request.assigneeUserId)
        return ResponseEntity.ok(enrichTaskResponse(task))
    }

    /**
     * Unassign a task.
     */
    @PostMapping("/tasks/{taskId}/unassign")
    @PreAuthorize("hasAnyAuthority('tasks_manage', 'members_manage')")
    fun unassignTask(
        @PathVariable taskId: UUID
    ): ResponseEntity<MemberTaskResponse> {
        val task = taskService.unassignTask(taskId)
        return ResponseEntity.ok(enrichTaskResponse(task))
    }

    /**
     * Start a task.
     */
    @PostMapping("/tasks/{taskId}/start")
    @PreAuthorize("hasAnyAuthority('tasks_manage', 'members_manage')")
    fun startTask(
        @PathVariable taskId: UUID
    ): ResponseEntity<MemberTaskResponse> {
        val task = taskService.startTask(taskId)
        return ResponseEntity.ok(enrichTaskResponse(task))
    }

    /**
     * Complete a task.
     */
    @PostMapping("/tasks/{taskId}/complete")
    @PreAuthorize("hasAnyAuthority('tasks_manage', 'members_manage')")
    fun completeTask(
        @PathVariable taskId: UUID,
        @Valid @RequestBody request: CompleteTaskRequest,
        @AuthenticationPrincipal user: JwtUserPrincipal?
    ): ResponseEntity<MemberTaskResponse> {
        val userId = getCurrentUserId(user) ?: throw IllegalStateException("User not authenticated")
        val task = taskService.completeTask(
            taskId,
            CompleteTaskCommand(outcome = request.outcome, notes = request.notes),
            userId
        )
        return ResponseEntity.ok(enrichTaskResponse(task))
    }

    /**
     * Cancel a task.
     */
    @PostMapping("/tasks/{taskId}/cancel")
    @PreAuthorize("hasAnyAuthority('tasks_manage', 'members_manage')")
    fun cancelTask(
        @PathVariable taskId: UUID,
        @RequestParam reason: String?
    ): ResponseEntity<MemberTaskResponse> {
        val task = taskService.cancelTask(taskId, reason)
        return ResponseEntity.ok(enrichTaskResponse(task))
    }

    /**
     * Snooze a task.
     */
    @PostMapping("/tasks/{taskId}/snooze")
    @PreAuthorize("hasAnyAuthority('tasks_manage', 'members_manage')")
    fun snoozeTask(
        @PathVariable taskId: UUID,
        @Valid @RequestBody request: SnoozeTaskRequest
    ): ResponseEntity<MemberTaskResponse> {
        val task = taskService.snoozeTask(taskId, request.newDueDate)
        return ResponseEntity.ok(enrichTaskResponse(task))
    }

    /**
     * Reschedule a task.
     */
    @PostMapping("/tasks/{taskId}/reschedule")
    @PreAuthorize("hasAnyAuthority('tasks_manage', 'members_manage')")
    fun rescheduleTask(
        @PathVariable taskId: UUID,
        @Valid @RequestBody request: RescheduleTaskRequest
    ): ResponseEntity<MemberTaskResponse> {
        val task = taskService.rescheduleTask(taskId, request.newDueDate, request.newDueTime)
        return ResponseEntity.ok(enrichTaskResponse(task))
    }

    /**
     * Get tasks for a member.
     */
    @GetMapping("/members/{memberId}/tasks")
    @PreAuthorize("hasAnyAuthority('tasks_view', 'members_view')")
    fun getMemberTasks(
        @PathVariable memberId: UUID,
        @RequestParam statuses: List<TaskStatus>?,
        @PageableDefault(size = 20, sort = ["dueDate"], direction = Sort.Direction.ASC) pageable: Pageable
    ): ResponseEntity<PageResponse<MemberTaskResponse>> {
        val page = taskService.getTasksForMember(memberId, statuses, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { enrichTaskResponse(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get my tasks (assigned to current user).
     */
    @GetMapping("/tasks/my-tasks")
    @PreAuthorize("isAuthenticated()")
    fun getMyTasks(
        @RequestParam statuses: List<TaskStatus>?,
        @PageableDefault(size = 20, sort = ["dueDate"], direction = Sort.Direction.ASC) pageable: Pageable,
        @AuthenticationPrincipal user: JwtUserPrincipal?
    ): ResponseEntity<PageResponse<MemberTaskResponse>> {
        val userId = getCurrentUserId(user) ?: throw IllegalStateException("User not authenticated")
        val page = taskService.getMyTasks(userId, statuses, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { enrichTaskResponse(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get my tasks for today (dashboard widget).
     */
    @GetMapping("/tasks/my-tasks/today")
    @PreAuthorize("isAuthenticated()")
    fun getMyTasksToday(
        @AuthenticationPrincipal user: JwtUserPrincipal?
    ): ResponseEntity<MyTasksResponse> {
        val userId = getCurrentUserId(user) ?: throw IllegalStateException("User not authenticated")
        val stats = taskService.getMyTaskStats(userId)
        val overdue = taskService.getMyOverdueTasks(userId, PageRequest.of(0, 10))
        val dueToday = taskService.getMyTasksToday(userId, PageRequest.of(0, 10))
        val upcoming = taskService.getMyTasks(
            userId,
            listOf(TaskStatus.PENDING, TaskStatus.IN_PROGRESS),
            PageRequest.of(0, 10)
        )

        return ResponseEntity.ok(
            MyTasksResponse(
                stats = TaskStatsResponse.from(stats),
                overdue = overdue.content.map { enrichTaskResponse(it) },
                dueToday = dueToday.content.map { enrichTaskResponse(it) },
                upcoming = upcoming.content.map { enrichTaskResponse(it) }
            )
        )
    }

    /**
     * Get my tasks for a specific date.
     */
    @GetMapping("/tasks/my-tasks/by-date")
    @PreAuthorize("isAuthenticated()")
    fun getMyTasksForDate(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate,
        @PageableDefault(size = 20) pageable: Pageable,
        @AuthenticationPrincipal user: JwtUserPrincipal?
    ): ResponseEntity<PageResponse<MemberTaskResponse>> {
        val userId = getCurrentUserId(user) ?: throw IllegalStateException("User not authenticated")
        val page = taskService.getMyTasksForDate(userId, date, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { enrichTaskResponse(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get overdue tasks.
     */
    @GetMapping("/tasks/overdue")
    @PreAuthorize("hasAnyAuthority('tasks_view', 'dashboard_view')")
    fun getOverdueTasks(
        @PageableDefault(size = 20, sort = ["dueDate"], direction = Sort.Direction.ASC) pageable: Pageable
    ): ResponseEntity<PageResponse<MemberTaskResponse>> {
        val page = taskService.getOverdueTasks(pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { enrichTaskResponse(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get unassigned tasks.
     */
    @GetMapping("/tasks/unassigned")
    @PreAuthorize("hasAnyAuthority('tasks_view', 'tasks_manage')")
    fun getUnassignedTasks(
        @PageableDefault(size = 20, sort = ["priority"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<PageResponse<MemberTaskResponse>> {
        val page = taskService.getUnassignedTasks(pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { enrichTaskResponse(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get tasks by type.
     */
    @GetMapping("/tasks/by-type/{taskType}")
    @PreAuthorize("hasAnyAuthority('tasks_view', 'dashboard_view')")
    fun getTasksByType(
        @PathVariable taskType: TaskType,
        @PageableDefault(size = 20, sort = ["dueDate"], direction = Sort.Direction.ASC) pageable: Pageable
    ): ResponseEntity<PageResponse<MemberTaskResponse>> {
        val page = taskService.getTasksByType(taskType, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { enrichTaskResponse(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get global task statistics.
     */
    @GetMapping("/tasks/stats")
    @PreAuthorize("hasAnyAuthority('tasks_view', 'dashboard_view')")
    fun getTaskStats(): ResponseEntity<TaskStatsResponse> {
        val stats = taskService.getGlobalTaskStats()
        return ResponseEntity.ok(TaskStatsResponse.from(stats))
    }

    /**
     * Get available task types.
     */
    @GetMapping("/tasks/types")
    @PreAuthorize("isAuthenticated()")
    fun getTaskTypes(): ResponseEntity<List<TaskType>> {
        return ResponseEntity.ok(TaskType.entries)
    }
}
