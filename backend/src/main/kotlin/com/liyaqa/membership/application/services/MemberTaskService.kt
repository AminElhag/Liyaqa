package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.MemberTask
import com.liyaqa.membership.domain.model.TaskOutcome
import com.liyaqa.membership.domain.model.TaskPriority
import com.liyaqa.membership.domain.model.TaskStatus
import com.liyaqa.membership.domain.model.TaskType
import com.liyaqa.membership.domain.ports.MemberTaskRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

data class CreateTaskCommand(
    val memberId: UUID,
    val taskType: TaskType,
    val title: String,
    val description: String? = null,
    val dueDate: LocalDate? = null,
    val dueTime: LocalTime? = null,
    val priority: TaskPriority = TaskPriority.MEDIUM,
    val assignedToUserId: UUID? = null,
    val metadata: Map<String, Any>? = null
)

data class UpdateTaskCommand(
    val title: String? = null,
    val description: String? = null,
    val dueDate: LocalDate? = null,
    val dueTime: LocalTime? = null,
    val priority: TaskPriority? = null,
    val assignedToUserId: UUID? = null
)

data class CompleteTaskCommand(
    val outcome: TaskOutcome,
    val notes: String? = null
)

data class TaskStats(
    val totalPending: Long,
    val totalInProgress: Long,
    val totalOverdue: Long,
    val totalDueToday: Long,
    val completedThisWeek: Long
)

@Service
@Transactional
class MemberTaskService(
    private val taskRepository: MemberTaskRepository
) {
    private val logger = LoggerFactory.getLogger(MemberTaskService::class.java)

    /**
     * Creates a new task.
     */
    fun createTask(command: CreateTaskCommand): MemberTask {
        val task = MemberTask(
            memberId = command.memberId,
            taskType = command.taskType,
            title = command.title,
            description = command.description,
            dueDate = command.dueDate ?: LocalDate.now(),
            dueTime = command.dueTime,
            priority = command.priority,
            assignedToUserId = command.assignedToUserId,
            metadata = command.metadata
        )

        val saved = taskRepository.save(task)
        logger.info("Created task ${saved.id} for member ${command.memberId}: ${command.title}")
        return saved
    }

    /**
     * Gets a task by ID.
     */
    @Transactional(readOnly = true)
    fun getTask(taskId: UUID): MemberTask {
        return taskRepository.findById(taskId).orElseThrow {
            NoSuchElementException("Task not found: $taskId")
        }
    }

    /**
     * Updates a task.
     */
    fun updateTask(taskId: UUID, command: UpdateTaskCommand): MemberTask {
        val task = getTask(taskId)

        command.title?.let { task.title = it }
        command.description?.let { task.description = it }
        command.dueDate?.let { task.dueDate = it }
        command.dueTime?.let { task.dueTime = it }
        command.priority?.let { task.priority = it }
        command.assignedToUserId?.let { task.assignedToUserId = it }

        val saved = taskRepository.save(task)
        logger.info("Updated task ${task.id}")
        return saved
    }

    /**
     * Assigns a task to a staff member.
     */
    fun assignTask(taskId: UUID, assigneeUserId: UUID): MemberTask {
        val task = getTask(taskId)
        task.assignTo(assigneeUserId)
        val saved = taskRepository.save(task)
        logger.info("Assigned task $taskId to user $assigneeUserId")
        return saved
    }

    /**
     * Unassigns a task.
     */
    fun unassignTask(taskId: UUID): MemberTask {
        val task = getTask(taskId)
        task.unassign()
        val saved = taskRepository.save(task)
        logger.info("Unassigned task $taskId")
        return saved
    }

    /**
     * Starts a task.
     */
    fun startTask(taskId: UUID): MemberTask {
        val task = getTask(taskId)
        task.start()
        val saved = taskRepository.save(task)
        logger.info("Started task $taskId")
        return saved
    }

    /**
     * Completes a task.
     */
    fun completeTask(taskId: UUID, command: CompleteTaskCommand, completedByUserId: UUID): MemberTask {
        val task = getTask(taskId)
        task.complete(command.outcome, command.notes, completedByUserId)
        val saved = taskRepository.save(task)
        logger.info("Completed task $taskId with outcome ${command.outcome}")
        return saved
    }

    /**
     * Cancels a task.
     */
    fun cancelTask(taskId: UUID, reason: String? = null): MemberTask {
        val task = getTask(taskId)
        task.cancel(reason)
        val saved = taskRepository.save(task)
        logger.info("Cancelled task $taskId")
        return saved
    }

    /**
     * Snoozes a task.
     */
    fun snoozeTask(taskId: UUID, newDueDate: LocalDate): MemberTask {
        val task = getTask(taskId)
        task.snooze(newDueDate)
        val saved = taskRepository.save(task)
        logger.info("Snoozed task $taskId until $newDueDate")
        return saved
    }

    /**
     * Reschedules a task.
     */
    fun rescheduleTask(taskId: UUID, newDueDate: LocalDate, newDueTime: LocalTime? = null): MemberTask {
        val task = getTask(taskId)
        task.reschedule(newDueDate, newDueTime)
        val saved = taskRepository.save(task)
        logger.info("Rescheduled task $taskId to $newDueDate")
        return saved
    }

    /**
     * Gets tasks for a member.
     */
    @Transactional(readOnly = true)
    fun getTasksForMember(memberId: UUID, statuses: List<TaskStatus>? = null, pageable: Pageable): Page<MemberTask> {
        return if (statuses != null && statuses.isNotEmpty()) {
            taskRepository.findByMemberIdAndStatus(memberId, statuses, pageable)
        } else {
            taskRepository.findByMemberId(memberId, pageable)
        }
    }

    /**
     * Gets tasks assigned to a user.
     */
    @Transactional(readOnly = true)
    fun getMyTasks(userId: UUID, statuses: List<TaskStatus>? = null, pageable: Pageable): Page<MemberTask> {
        return if (statuses != null && statuses.isNotEmpty()) {
            taskRepository.findByAssignedToUserIdAndStatus(userId, statuses, pageable)
        } else {
            taskRepository.findByAssignedToUserId(userId, pageable)
        }
    }

    /**
     * Gets tasks for a user on a specific date.
     */
    @Transactional(readOnly = true)
    fun getMyTasksForDate(userId: UUID, date: LocalDate, pageable: Pageable): Page<MemberTask> {
        return taskRepository.findByAssignedToUserIdAndDueDate(userId, date, pageable)
    }

    /**
     * Gets today's tasks for a user.
     */
    @Transactional(readOnly = true)
    fun getMyTasksToday(userId: UUID, pageable: Pageable): Page<MemberTask> {
        return taskRepository.findTasksDueTodayByAssignee(userId, pageable)
    }

    /**
     * Gets overdue tasks for a user.
     */
    @Transactional(readOnly = true)
    fun getMyOverdueTasks(userId: UUID, pageable: Pageable): Page<MemberTask> {
        return taskRepository.findOverdueTasksByAssignee(userId, pageable)
    }

    /**
     * Gets all overdue tasks.
     */
    @Transactional(readOnly = true)
    fun getOverdueTasks(pageable: Pageable): Page<MemberTask> {
        return taskRepository.findOverdueTasks(pageable)
    }

    /**
     * Gets all tasks due today.
     */
    @Transactional(readOnly = true)
    fun getTasksDueToday(pageable: Pageable): Page<MemberTask> {
        return taskRepository.findTasksDueToday(pageable)
    }

    /**
     * Gets unassigned tasks.
     */
    @Transactional(readOnly = true)
    fun getUnassignedTasks(pageable: Pageable): Page<MemberTask> {
        return taskRepository.findUnassignedTasks(pageable)
    }

    /**
     * Gets tasks by type.
     */
    @Transactional(readOnly = true)
    fun getTasksByType(taskType: TaskType, pageable: Pageable): Page<MemberTask> {
        return taskRepository.findByTaskType(taskType, pageable)
    }

    /**
     * Gets high priority tasks.
     */
    @Transactional(readOnly = true)
    fun getHighPriorityTasks(pageable: Pageable): Page<MemberTask> {
        return taskRepository.findByPriorityAndStatus(
            listOf(TaskPriority.HIGH, TaskPriority.URGENT),
            listOf(TaskStatus.PENDING, TaskStatus.IN_PROGRESS),
            pageable
        )
    }

    /**
     * Gets task statistics for a user.
     */
    @Transactional(readOnly = true)
    fun getMyTaskStats(userId: UUID): TaskStats {
        val pending = taskRepository.countByAssignedToUserIdAndStatus(userId, listOf(TaskStatus.PENDING))
        val inProgress = taskRepository.countByAssignedToUserIdAndStatus(userId, listOf(TaskStatus.IN_PROGRESS))
        // Simplified - would need additional query for overdue by user
        val overdue = taskRepository.countOverdue()
        val dueToday = taskRepository.countDueToday()

        return TaskStats(
            totalPending = pending,
            totalInProgress = inProgress,
            totalOverdue = overdue,
            totalDueToday = dueToday,
            completedThisWeek = 0 // Would need additional query
        )
    }

    /**
     * Gets global task statistics.
     */
    @Transactional(readOnly = true)
    fun getGlobalTaskStats(): TaskStats {
        return TaskStats(
            totalPending = taskRepository.countByStatus(TaskStatus.PENDING),
            totalInProgress = taskRepository.countByStatus(TaskStatus.IN_PROGRESS),
            totalOverdue = taskRepository.countOverdue(),
            totalDueToday = taskRepository.countDueToday(),
            completedThisWeek = 0 // Would need additional query
        )
    }

    /**
     * Checks if a task already exists for a member.
     */
    @Transactional(readOnly = true)
    fun hasOpenTask(memberId: UUID, taskType: TaskType): Boolean {
        return taskRepository.existsByMemberIdAndTaskTypeAndStatusIn(
            memberId,
            taskType,
            listOf(TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.SNOOZED)
        )
    }

    /**
     * Creates a task only if one doesn't already exist.
     */
    fun createTaskIfNotExists(command: CreateTaskCommand): MemberTask? {
        if (hasOpenTask(command.memberId, command.taskType)) {
            logger.debug("Task of type ${command.taskType} already exists for member ${command.memberId}")
            return null
        }
        return createTask(command)
    }
}
