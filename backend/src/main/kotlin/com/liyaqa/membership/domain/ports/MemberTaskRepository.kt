package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.MemberTask
import com.liyaqa.membership.domain.model.TaskPriority
import com.liyaqa.membership.domain.model.TaskStatus
import com.liyaqa.membership.domain.model.TaskType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface MemberTaskRepository {

    fun save(task: MemberTask): MemberTask

    fun saveAll(tasks: List<MemberTask>): List<MemberTask>

    fun findById(id: UUID): Optional<MemberTask>

    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MemberTask>

    fun findByMemberIdAndStatus(memberId: UUID, statuses: List<TaskStatus>, pageable: Pageable): Page<MemberTask>

    fun findByAssignedToUserId(userId: UUID, pageable: Pageable): Page<MemberTask>

    fun findByAssignedToUserIdAndStatus(
        userId: UUID,
        statuses: List<TaskStatus>,
        pageable: Pageable
    ): Page<MemberTask>

    fun findByAssignedToUserIdAndDueDate(
        userId: UUID,
        dueDate: LocalDate,
        pageable: Pageable
    ): Page<MemberTask>

    fun findOverdueTasks(pageable: Pageable): Page<MemberTask>

    fun findOverdueTasksByAssignee(userId: UUID, pageable: Pageable): Page<MemberTask>

    fun findTasksDueToday(pageable: Pageable): Page<MemberTask>

    fun findTasksDueTodayByAssignee(userId: UUID, pageable: Pageable): Page<MemberTask>

    fun findByTaskType(taskType: TaskType, pageable: Pageable): Page<MemberTask>

    fun findUnassignedTasks(pageable: Pageable): Page<MemberTask>

    fun countByAssignedToUserIdAndStatus(userId: UUID, statuses: List<TaskStatus>): Long

    fun countByStatus(status: TaskStatus): Long

    fun countOverdue(): Long

    fun countDueToday(): Long

    fun existsByMemberIdAndTaskTypeAndStatusIn(
        memberId: UUID,
        taskType: TaskType,
        statuses: List<TaskStatus>
    ): Boolean

    fun findPendingReminderTasks(dueDate: LocalDate): List<MemberTask>

    fun deleteByMemberId(memberId: UUID)

    fun findByPriorityAndStatus(
        priorities: List<TaskPriority>,
        statuses: List<TaskStatus>,
        pageable: Pageable
    ): Page<MemberTask>
}
