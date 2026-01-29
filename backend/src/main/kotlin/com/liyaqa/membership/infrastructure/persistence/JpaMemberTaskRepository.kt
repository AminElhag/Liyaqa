package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.MemberTask
import com.liyaqa.membership.domain.model.TaskPriority
import com.liyaqa.membership.domain.model.TaskStatus
import com.liyaqa.membership.domain.model.TaskType
import com.liyaqa.membership.domain.ports.MemberTaskRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataMemberTaskRepository : JpaRepository<MemberTask, UUID> {

    fun findByMemberIdOrderByDueDateAscPriorityDesc(memberId: UUID, pageable: Pageable): Page<MemberTask>

    @Query("""
        SELECT t FROM MemberTask t
        WHERE t.memberId = :memberId AND t.status IN :statuses
        ORDER BY t.dueDate ASC, t.priority DESC
    """)
    fun findByMemberIdAndStatus(
        @Param("memberId") memberId: UUID,
        @Param("statuses") statuses: List<TaskStatus>,
        pageable: Pageable
    ): Page<MemberTask>

    fun findByAssignedToUserIdOrderByDueDateAscPriorityDesc(userId: UUID, pageable: Pageable): Page<MemberTask>

    @Query("""
        SELECT t FROM MemberTask t
        WHERE t.assignedToUserId = :userId AND t.status IN :statuses
        ORDER BY t.dueDate ASC, t.priority DESC
    """)
    fun findByAssignedToUserIdAndStatus(
        @Param("userId") userId: UUID,
        @Param("statuses") statuses: List<TaskStatus>,
        pageable: Pageable
    ): Page<MemberTask>

    @Query("""
        SELECT t FROM MemberTask t
        WHERE t.assignedToUserId = :userId AND t.dueDate = :dueDate
        ORDER BY t.priority DESC, t.dueTime ASC
    """)
    fun findByAssignedToUserIdAndDueDate(
        @Param("userId") userId: UUID,
        @Param("dueDate") dueDate: LocalDate,
        pageable: Pageable
    ): Page<MemberTask>

    @Query("""
        SELECT t FROM MemberTask t
        WHERE t.dueDate < :today AND t.status IN ('PENDING', 'IN_PROGRESS')
        ORDER BY t.dueDate ASC, t.priority DESC
    """)
    fun findOverdueTasks(@Param("today") today: LocalDate, pageable: Pageable): Page<MemberTask>

    @Query("""
        SELECT t FROM MemberTask t
        WHERE t.assignedToUserId = :userId
        AND t.dueDate < :today
        AND t.status IN ('PENDING', 'IN_PROGRESS')
        ORDER BY t.dueDate ASC, t.priority DESC
    """)
    fun findOverdueTasksByAssignee(
        @Param("userId") userId: UUID,
        @Param("today") today: LocalDate,
        pageable: Pageable
    ): Page<MemberTask>

    @Query("""
        SELECT t FROM MemberTask t
        WHERE t.dueDate = :today AND t.status IN ('PENDING', 'IN_PROGRESS')
        ORDER BY t.priority DESC, t.dueTime ASC
    """)
    fun findTasksDueToday(@Param("today") today: LocalDate, pageable: Pageable): Page<MemberTask>

    @Query("""
        SELECT t FROM MemberTask t
        WHERE t.assignedToUserId = :userId
        AND t.dueDate = :today
        AND t.status IN ('PENDING', 'IN_PROGRESS')
        ORDER BY t.priority DESC, t.dueTime ASC
    """)
    fun findTasksDueTodayByAssignee(
        @Param("userId") userId: UUID,
        @Param("today") today: LocalDate,
        pageable: Pageable
    ): Page<MemberTask>

    fun findByTaskTypeOrderByDueDateAscPriorityDesc(taskType: TaskType, pageable: Pageable): Page<MemberTask>

    @Query("""
        SELECT t FROM MemberTask t
        WHERE t.assignedToUserId IS NULL AND t.status = 'PENDING'
        ORDER BY t.priority DESC, t.dueDate ASC
    """)
    fun findUnassignedTasks(pageable: Pageable): Page<MemberTask>

    fun countByAssignedToUserIdAndStatusIn(userId: UUID, statuses: List<TaskStatus>): Long

    fun countByStatus(status: TaskStatus): Long

    @Query("SELECT COUNT(t) FROM MemberTask t WHERE t.dueDate < :today AND t.status IN ('PENDING', 'IN_PROGRESS')")
    fun countOverdue(@Param("today") today: LocalDate): Long

    @Query("SELECT COUNT(t) FROM MemberTask t WHERE t.dueDate = :today AND t.status IN ('PENDING', 'IN_PROGRESS')")
    fun countDueToday(@Param("today") today: LocalDate): Long

    fun existsByMemberIdAndTaskTypeAndStatusIn(memberId: UUID, taskType: TaskType, statuses: List<TaskStatus>): Boolean

    @Query("""
        SELECT t FROM MemberTask t
        WHERE t.dueDate = :dueDate
        AND t.reminderSent = FALSE
        AND t.status IN ('PENDING', 'IN_PROGRESS')
    """)
    fun findPendingReminderTasks(@Param("dueDate") dueDate: LocalDate): List<MemberTask>

    @Modifying
    @Query("DELETE FROM MemberTask t WHERE t.memberId = :memberId")
    fun deleteByMemberId(@Param("memberId") memberId: UUID)

    @Query("""
        SELECT t FROM MemberTask t
        WHERE t.priority IN :priorities AND t.status IN :statuses
        ORDER BY t.priority DESC, t.dueDate ASC
    """)
    fun findByPriorityAndStatus(
        @Param("priorities") priorities: List<TaskPriority>,
        @Param("statuses") statuses: List<TaskStatus>,
        pageable: Pageable
    ): Page<MemberTask>
}

@Repository
class JpaMemberTaskRepository(
    private val springDataRepository: SpringDataMemberTaskRepository
) : MemberTaskRepository {

    override fun save(task: MemberTask): MemberTask {
        return springDataRepository.save(task)
    }

    override fun saveAll(tasks: List<MemberTask>): List<MemberTask> {
        return springDataRepository.saveAll(tasks)
    }

    override fun findById(id: UUID): Optional<MemberTask> {
        return springDataRepository.findById(id)
    }

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MemberTask> {
        return springDataRepository.findByMemberIdOrderByDueDateAscPriorityDesc(memberId, pageable)
    }

    override fun findByMemberIdAndStatus(
        memberId: UUID,
        statuses: List<TaskStatus>,
        pageable: Pageable
    ): Page<MemberTask> {
        return springDataRepository.findByMemberIdAndStatus(memberId, statuses, pageable)
    }

    override fun findByAssignedToUserId(userId: UUID, pageable: Pageable): Page<MemberTask> {
        return springDataRepository.findByAssignedToUserIdOrderByDueDateAscPriorityDesc(userId, pageable)
    }

    override fun findByAssignedToUserIdAndStatus(
        userId: UUID,
        statuses: List<TaskStatus>,
        pageable: Pageable
    ): Page<MemberTask> {
        return springDataRepository.findByAssignedToUserIdAndStatus(userId, statuses, pageable)
    }

    override fun findByAssignedToUserIdAndDueDate(
        userId: UUID,
        dueDate: LocalDate,
        pageable: Pageable
    ): Page<MemberTask> {
        return springDataRepository.findByAssignedToUserIdAndDueDate(userId, dueDate, pageable)
    }

    override fun findOverdueTasks(pageable: Pageable): Page<MemberTask> {
        return springDataRepository.findOverdueTasks(LocalDate.now(), pageable)
    }

    override fun findOverdueTasksByAssignee(userId: UUID, pageable: Pageable): Page<MemberTask> {
        return springDataRepository.findOverdueTasksByAssignee(userId, LocalDate.now(), pageable)
    }

    override fun findTasksDueToday(pageable: Pageable): Page<MemberTask> {
        return springDataRepository.findTasksDueToday(LocalDate.now(), pageable)
    }

    override fun findTasksDueTodayByAssignee(userId: UUID, pageable: Pageable): Page<MemberTask> {
        return springDataRepository.findTasksDueTodayByAssignee(userId, LocalDate.now(), pageable)
    }

    override fun findByTaskType(taskType: TaskType, pageable: Pageable): Page<MemberTask> {
        return springDataRepository.findByTaskTypeOrderByDueDateAscPriorityDesc(taskType, pageable)
    }

    override fun findUnassignedTasks(pageable: Pageable): Page<MemberTask> {
        return springDataRepository.findUnassignedTasks(pageable)
    }

    override fun countByAssignedToUserIdAndStatus(userId: UUID, statuses: List<TaskStatus>): Long {
        return springDataRepository.countByAssignedToUserIdAndStatusIn(userId, statuses)
    }

    override fun countByStatus(status: TaskStatus): Long {
        return springDataRepository.countByStatus(status)
    }

    override fun countOverdue(): Long {
        return springDataRepository.countOverdue(LocalDate.now())
    }

    override fun countDueToday(): Long {
        return springDataRepository.countDueToday(LocalDate.now())
    }

    override fun existsByMemberIdAndTaskTypeAndStatusIn(
        memberId: UUID,
        taskType: TaskType,
        statuses: List<TaskStatus>
    ): Boolean {
        return springDataRepository.existsByMemberIdAndTaskTypeAndStatusIn(memberId, taskType, statuses)
    }

    override fun findPendingReminderTasks(dueDate: LocalDate): List<MemberTask> {
        return springDataRepository.findPendingReminderTasks(dueDate)
    }

    override fun deleteByMemberId(memberId: UUID) {
        springDataRepository.deleteByMemberId(memberId)
    }

    override fun findByPriorityAndStatus(
        priorities: List<TaskPriority>,
        statuses: List<TaskStatus>,
        pageable: Pageable
    ): Page<MemberTask> {
        return springDataRepository.findByPriorityAndStatus(priorities, statuses, pageable)
    }
}
