package com.liyaqa.wearables.infrastructure.persistence

import com.liyaqa.wearables.domain.model.*
import com.liyaqa.wearables.domain.ports.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.time.LocalDate
import java.util.*

// ========== JPA Interfaces ==========

interface JpaWearablePlatformRepository : JpaRepository<WearablePlatform, UUID> {
    fun findByName(name: String): WearablePlatform?
    fun findByIsActiveTrue(): List<WearablePlatform>
}

interface JpaMemberWearableConnectionRepository : JpaRepository<MemberWearableConnection, UUID> {
    fun findByMemberId(memberId: UUID): List<MemberWearableConnection>
    fun findByMemberIdAndPlatformId(memberId: UUID, platformId: UUID): MemberWearableConnection?
    fun findByPlatformId(platformId: UUID, pageable: Pageable): Page<MemberWearableConnection>
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<MemberWearableConnection>
    fun findBySyncEnabledTrue(): List<MemberWearableConnection>

    @Query("SELECT c FROM MemberWearableConnection c WHERE c.syncEnabled = true AND (c.lastSyncAt IS NULL OR c.lastSyncAt < :lastSyncBefore)")
    fun findDueForSync(@Param("lastSyncBefore") lastSyncBefore: Instant): List<MemberWearableConnection>

    fun countByMemberId(memberId: UUID): Long
}

interface JpaWearableDailyActivityRepository : JpaRepository<WearableDailyActivity, UUID> {
    fun findByConnectionIdAndActivityDate(connectionId: UUID, activityDate: LocalDate): WearableDailyActivity?
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<WearableDailyActivity>

    @Query("SELECT a FROM WearableDailyActivity a WHERE a.memberId = :memberId AND a.activityDate BETWEEN :startDate AND :endDate ORDER BY a.activityDate DESC")
    fun findByMemberIdAndActivityDateBetween(
        @Param("memberId") memberId: UUID,
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): List<WearableDailyActivity>

    fun findByConnectionId(connectionId: UUID, pageable: Pageable): Page<WearableDailyActivity>

    @Query("SELECT a FROM WearableDailyActivity a WHERE a.memberId = :memberId ORDER BY a.activityDate DESC LIMIT 1")
    fun findFirstByMemberIdOrderByActivityDateDesc(@Param("memberId") memberId: UUID): WearableDailyActivity?

    @Query("SELECT AVG(a.steps) FROM WearableDailyActivity a WHERE a.memberId = :memberId AND a.activityDate BETWEEN :startDate AND :endDate AND a.steps IS NOT NULL")
    fun getAverageSteps(
        @Param("memberId") memberId: UUID,
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): Double?

    @Query("SELECT SUM(a.caloriesTotal) FROM WearableDailyActivity a WHERE a.memberId = :memberId AND a.activityDate BETWEEN :startDate AND :endDate")
    fun getTotalCalories(
        @Param("memberId") memberId: UUID,
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): Long?
}

interface JpaWearableWorkoutRepository : JpaRepository<WearableWorkout, UUID> {
    fun findByConnectionIdAndExternalWorkoutId(connectionId: UUID, externalWorkoutId: String): WearableWorkout?
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<WearableWorkout>

    @Query("SELECT w FROM WearableWorkout w WHERE w.memberId = :memberId AND w.startedAt BETWEEN :startDate AND :endDate ORDER BY w.startedAt DESC")
    fun findByMemberIdAndStartedAtBetween(
        @Param("memberId") memberId: UUID,
        @Param("startDate") startDate: Instant,
        @Param("endDate") endDate: Instant
    ): List<WearableWorkout>

    fun findByConnectionId(connectionId: UUID, pageable: Pageable): Page<WearableWorkout>
    fun countByMemberId(memberId: UUID): Long

    @Query("SELECT SUM(w.durationSeconds) FROM WearableWorkout w WHERE w.memberId = :memberId")
    fun getTotalDuration(@Param("memberId") memberId: UUID): Long?

    @Query("SELECT SUM(w.caloriesBurned) FROM WearableWorkout w WHERE w.memberId = :memberId")
    fun getTotalCalories(@Param("memberId") memberId: UUID): Long?
}

interface JpaWearableSyncJobRepository : JpaRepository<WearableSyncJob, UUID> {
    fun findByConnectionId(connectionId: UUID, pageable: Pageable): Page<WearableSyncJob>

    @Query("SELECT j FROM WearableSyncJob j WHERE j.connectionId = :connectionId ORDER BY j.createdAt DESC LIMIT 1")
    fun findFirstByConnectionIdOrderByCreatedAtDesc(@Param("connectionId") connectionId: UUID): WearableSyncJob?

    fun findByStatus(status: SyncJobStatus): List<WearableSyncJob>
}

// ========== Adapter Implementations ==========

@Repository
class WearablePlatformRepositoryAdapter(
    private val jpaRepository: JpaWearablePlatformRepository
) : WearablePlatformRepository {
    override fun findById(id: UUID) = jpaRepository.findById(id).orElse(null)
    override fun findByName(name: String) = jpaRepository.findByName(name)
    override fun findAll() = jpaRepository.findAll()
    override fun findAllActive() = jpaRepository.findByIsActiveTrue()
    override fun save(platform: WearablePlatform) = jpaRepository.save(platform)
}

@Repository
class MemberWearableConnectionRepositoryAdapter(
    private val jpaRepository: JpaMemberWearableConnectionRepository
) : MemberWearableConnectionRepository {
    override fun findById(id: UUID) = jpaRepository.findById(id).orElse(null)
    override fun findByMemberId(memberId: UUID) = jpaRepository.findByMemberId(memberId)
    override fun findByMemberIdAndPlatformId(memberId: UUID, platformId: UUID) =
        jpaRepository.findByMemberIdAndPlatformId(memberId, platformId)
    override fun findByPlatformId(platformId: UUID, pageable: Pageable) =
        jpaRepository.findByPlatformId(platformId, pageable)
    override fun findAllByTenantId(tenantId: UUID, pageable: Pageable) =
        jpaRepository.findByTenantId(tenantId, pageable)
    override fun findSyncEnabled() = jpaRepository.findBySyncEnabledTrue()
    override fun findDueForSync(lastSyncBefore: Instant) = jpaRepository.findDueForSync(lastSyncBefore)
    override fun countByMemberId(memberId: UUID) = jpaRepository.countByMemberId(memberId)
    override fun save(connection: MemberWearableConnection) = jpaRepository.save(connection)
    override fun delete(id: UUID) = jpaRepository.deleteById(id)
}

@Repository
class WearableDailyActivityRepositoryAdapter(
    private val jpaRepository: JpaWearableDailyActivityRepository
) : WearableDailyActivityRepository {
    override fun findById(id: UUID) = jpaRepository.findById(id).orElse(null)
    override fun findByConnectionIdAndActivityDate(connectionId: UUID, date: LocalDate) =
        jpaRepository.findByConnectionIdAndActivityDate(connectionId, date)
    override fun findByMemberId(memberId: UUID, pageable: Pageable) =
        jpaRepository.findByMemberId(memberId, pageable)
    override fun findByMemberIdAndDateRange(memberId: UUID, startDate: LocalDate, endDate: LocalDate) =
        jpaRepository.findByMemberIdAndActivityDateBetween(memberId, startDate, endDate)
    override fun findByConnectionId(connectionId: UUID, pageable: Pageable) =
        jpaRepository.findByConnectionId(connectionId, pageable)
    override fun findLatestByMemberId(memberId: UUID) =
        jpaRepository.findFirstByMemberIdOrderByActivityDateDesc(memberId)
    override fun getAverageStepsByMemberId(memberId: UUID, startDate: LocalDate, endDate: LocalDate) =
        jpaRepository.getAverageSteps(memberId, startDate, endDate)
    override fun getTotalCaloriesByMemberId(memberId: UUID, startDate: LocalDate, endDate: LocalDate) =
        jpaRepository.getTotalCalories(memberId, startDate, endDate)
    override fun save(activity: WearableDailyActivity) = jpaRepository.save(activity)
    override fun saveAll(activities: List<WearableDailyActivity>) = jpaRepository.saveAll(activities)
}

@Repository
class WearableWorkoutRepositoryAdapter(
    private val jpaRepository: JpaWearableWorkoutRepository
) : WearableWorkoutRepository {
    override fun findById(id: UUID) = jpaRepository.findById(id).orElse(null)
    override fun findByExternalWorkoutId(connectionId: UUID, externalWorkoutId: String) =
        jpaRepository.findByConnectionIdAndExternalWorkoutId(connectionId, externalWorkoutId)
    override fun findByMemberId(memberId: UUID, pageable: Pageable) =
        jpaRepository.findByMemberId(memberId, pageable)
    override fun findByMemberIdAndDateRange(memberId: UUID, startDate: Instant, endDate: Instant) =
        jpaRepository.findByMemberIdAndStartedAtBetween(memberId, startDate, endDate)
    override fun findByConnectionId(connectionId: UUID, pageable: Pageable) =
        jpaRepository.findByConnectionId(connectionId, pageable)
    override fun countByMemberId(memberId: UUID) = jpaRepository.countByMemberId(memberId)
    override fun getTotalDurationByMemberId(memberId: UUID) = jpaRepository.getTotalDuration(memberId)
    override fun getTotalCaloriesByMemberId(memberId: UUID) = jpaRepository.getTotalCalories(memberId)
    override fun save(workout: WearableWorkout) = jpaRepository.save(workout)
    override fun saveAll(workouts: List<WearableWorkout>) = jpaRepository.saveAll(workouts)
}

@Repository
class WearableSyncJobRepositoryAdapter(
    private val jpaRepository: JpaWearableSyncJobRepository
) : WearableSyncJobRepository {
    override fun findById(id: UUID) = jpaRepository.findById(id).orElse(null)
    override fun findByConnectionId(connectionId: UUID, pageable: Pageable) =
        jpaRepository.findByConnectionId(connectionId, pageable)
    override fun findLatestByConnectionId(connectionId: UUID) =
        jpaRepository.findFirstByConnectionIdOrderByCreatedAtDesc(connectionId)
    override fun findRunning() = jpaRepository.findByStatus(SyncJobStatus.RUNNING)
    override fun findByStatus(status: SyncJobStatus) = jpaRepository.findByStatus(status)
    override fun save(job: WearableSyncJob) = jpaRepository.save(job)
}
