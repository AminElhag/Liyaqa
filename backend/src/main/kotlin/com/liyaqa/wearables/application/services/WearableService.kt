package com.liyaqa.wearables.application.services

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.wearables.application.commands.*
import com.liyaqa.wearables.domain.model.*
import com.liyaqa.wearables.domain.ports.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.util.*

@Service
@Transactional
class WearableService(
    private val platformRepository: WearablePlatformRepository,
    private val connectionRepository: MemberWearableConnectionRepository,
    private val dailyActivityRepository: WearableDailyActivityRepository,
    private val workoutRepository: WearableWorkoutRepository,
    private val syncJobRepository: WearableSyncJobRepository,
    private val objectMapper: ObjectMapper
) {
    // ========== Platforms ==========

    fun listPlatforms(): List<WearablePlatform> = platformRepository.findAllActive()

    fun getPlatform(id: UUID): WearablePlatform? = platformRepository.findById(id)

    fun getPlatformByName(name: String): WearablePlatform? = platformRepository.findByName(name)

    // ========== Connections ==========

    fun listConnections(pageable: Pageable): Page<MemberWearableConnection> {
        val tenantId = TenantContext.getCurrentTenant().value
        return connectionRepository.findAllByTenantId(tenantId, pageable)
    }

    fun getConnection(id: UUID): MemberWearableConnection? = connectionRepository.findById(id)

    fun getMemberConnections(memberId: UUID): List<MemberWearableConnection> =
        connectionRepository.findByMemberId(memberId)

    fun getMemberConnection(memberId: UUID, platformId: UUID): MemberWearableConnection? =
        connectionRepository.findByMemberIdAndPlatformId(memberId, platformId)

    fun createConnection(command: CreateConnectionCommand): MemberWearableConnection {
        // Check if connection already exists
        val existing = connectionRepository.findByMemberIdAndPlatformId(command.memberId, command.platformId)
        if (existing != null) {
            throw IllegalArgumentException("Connection already exists for this member and platform")
        }

        val connection = MemberWearableConnection(
            memberId = command.memberId,
            platformId = command.platformId,
            externalUserId = command.externalUserId,
            externalUsername = command.externalUsername
        )
        // tenantId is set automatically by BaseEntity's @PrePersist
        return connectionRepository.save(connection)
    }

    fun updateConnection(id: UUID, command: UpdateConnectionCommand): MemberWearableConnection {
        val connection = connectionRepository.findById(id)
            ?: throw IllegalArgumentException("Connection not found: $id")

        command.externalUserId?.let { connection.externalUserId = it }
        command.externalUsername?.let { connection.externalUsername = it }
        command.syncEnabled?.let { connection.syncEnabled = it }

        return connectionRepository.save(connection)
    }

    fun updateConnectionTokens(id: UUID, command: UpdateConnectionTokensCommand): MemberWearableConnection {
        val connection = connectionRepository.findById(id)
            ?: throw IllegalArgumentException("Connection not found: $id")

        connection.updateTokens(
            accessToken = command.accessToken,
            refreshToken = command.refreshToken,
            expiresAt = command.expiresAt
        )

        return connectionRepository.save(connection)
    }

    fun disconnectConnection(id: UUID): MemberWearableConnection {
        val connection = connectionRepository.findById(id)
            ?: throw IllegalArgumentException("Connection not found: $id")

        connection.disconnect()
        return connectionRepository.save(connection)
    }

    fun deleteConnection(id: UUID) = connectionRepository.delete(id)

    // ========== Daily Activities ==========

    fun listMemberActivities(memberId: UUID, pageable: Pageable): Page<WearableDailyActivity> =
        dailyActivityRepository.findByMemberId(memberId, pageable)

    fun getMemberActivitiesByDateRange(memberId: UUID, startDate: LocalDate, endDate: LocalDate): List<WearableDailyActivity> =
        dailyActivityRepository.findByMemberIdAndDateRange(memberId, startDate, endDate)

    fun getActivity(id: UUID): WearableDailyActivity? = dailyActivityRepository.findById(id)

    fun getLatestActivity(memberId: UUID): WearableDailyActivity? =
        dailyActivityRepository.findLatestByMemberId(memberId)

    fun createOrUpdateDailyActivity(command: CreateDailyActivityCommand): WearableDailyActivity {
        val connection = connectionRepository.findById(command.connectionId)
            ?: throw IllegalArgumentException("Connection not found: ${command.connectionId}")

        // Check if activity already exists for this date
        val existing = dailyActivityRepository.findByConnectionIdAndActivityDate(
            command.connectionId,
            command.activityDate
        )

        if (existing != null) {
            // For simplicity, we'll create a new record since the entity is immutable
            // In production, you might want to update in place
            return existing
        }

        val activity = WearableDailyActivity(
            tenantId = connection.tenantId,
            memberId = command.memberId,
            connectionId = command.connectionId,
            activityDate = command.activityDate,
            steps = command.steps,
            distanceMeters = command.distanceMeters,
            floorsClimbed = command.floorsClimbed,
            caloriesTotal = command.caloriesTotal,
            caloriesActive = command.caloriesActive,
            activeMinutes = command.activeMinutes,
            sedentaryMinutes = command.sedentaryMinutes,
            sleepMinutes = command.sleepMinutes,
            sleepQualityScore = command.sleepQualityScore,
            restingHeartRate = command.restingHeartRate,
            hrvAverage = command.hrvAverage,
            stressScore = command.stressScore,
            recoveryScore = command.recoveryScore,
            rawData = command.rawData?.let { objectMapper.writeValueAsString(it) },
            syncSource = command.syncSource
        )
        return dailyActivityRepository.save(activity)
    }

    // ========== Workouts ==========

    fun listMemberWorkouts(memberId: UUID, pageable: Pageable): Page<WearableWorkout> =
        workoutRepository.findByMemberId(memberId, pageable)

    fun getMemberWorkoutsByDateRange(memberId: UUID, startDate: Instant, endDate: Instant): List<WearableWorkout> =
        workoutRepository.findByMemberIdAndDateRange(memberId, startDate, endDate)

    fun getWorkout(id: UUID): WearableWorkout? = workoutRepository.findById(id)

    fun createWorkout(command: CreateWorkoutCommand): WearableWorkout {
        val connection = connectionRepository.findById(command.connectionId)
            ?: throw IllegalArgumentException("Connection not found: ${command.connectionId}")

        // Check for duplicate if external ID is provided
        if (command.externalWorkoutId != null) {
            val existing = workoutRepository.findByExternalWorkoutId(command.connectionId, command.externalWorkoutId)
            if (existing != null) {
                return existing
            }
        }

        val workout = WearableWorkout(
            tenantId = connection.tenantId,
            memberId = command.memberId,
            connectionId = command.connectionId,
            externalWorkoutId = command.externalWorkoutId,
            activityType = command.activityType,
            activityName = command.activityName,
            startedAt = command.startedAt,
            endedAt = command.endedAt,
            durationSeconds = command.durationSeconds,
            distanceMeters = command.distanceMeters,
            caloriesBurned = command.caloriesBurned,
            avgHeartRate = command.avgHeartRate,
            maxHeartRate = command.maxHeartRate,
            avgPaceSecondsPerKm = command.avgPaceSecondsPerKm,
            elevationGainMeters = command.elevationGainMeters,
            steps = command.steps,
            rawData = command.rawData?.let { objectMapper.writeValueAsString(it) },
            syncSource = command.syncSource
        )
        return workoutRepository.save(workout)
    }

    fun getMemberWorkoutStats(memberId: UUID): WearableWorkoutStats {
        val totalWorkouts = workoutRepository.countByMemberId(memberId)
        val totalDuration = workoutRepository.getTotalDurationByMemberId(memberId) ?: 0
        val totalCalories = workoutRepository.getTotalCaloriesByMemberId(memberId) ?: 0

        return WearableWorkoutStats(
            totalWorkouts = totalWorkouts,
            totalDurationSeconds = totalDuration,
            totalCalories = totalCalories
        )
    }

    fun getMemberActivityStats(memberId: UUID, days: Int = 30): WearableActivityStats {
        val endDate = LocalDate.now()
        val startDate = endDate.minusDays(days.toLong())

        val activities = dailyActivityRepository.findByMemberIdAndDateRange(memberId, startDate, endDate)
        val avgSteps = dailyActivityRepository.getAverageStepsByMemberId(memberId, startDate, endDate) ?: 0.0
        val totalCalories = dailyActivityRepository.getTotalCaloriesByMemberId(memberId, startDate, endDate) ?: 0

        val totalSteps = activities.sumOf { it.steps ?: 0 }
        val totalActiveMinutes = activities.sumOf { it.activeMinutes ?: 0 }
        val totalSleepMinutes = activities.sumOf { it.sleepMinutes ?: 0 }
        val avgSleepMinutes = if (activities.isNotEmpty()) totalSleepMinutes / activities.size else 0
        val avgRestingHeartRate = activities.mapNotNull { it.restingHeartRate }.average().takeIf { it.isFinite() }

        return WearableActivityStats(
            daysTracked = activities.size,
            totalSteps = totalSteps.toLong(),
            averageStepsPerDay = avgSteps,
            totalCalories = totalCalories,
            totalActiveMinutes = totalActiveMinutes,
            averageSleepMinutes = avgSleepMinutes,
            averageRestingHeartRate = avgRestingHeartRate?.toInt()
        )
    }

    // ========== Sync Jobs ==========

    fun startSyncJob(command: StartSyncJobCommand): WearableSyncJob {
        val connection = connectionRepository.findById(command.connectionId)
            ?: throw IllegalArgumentException("Connection not found: ${command.connectionId}")

        val job = WearableSyncJob(
            tenantId = connection.tenantId,
            connectionId = command.connectionId,
            jobType = command.jobType
        )
        job.start()
        return syncJobRepository.save(job)
    }

    fun getSyncJob(id: UUID): WearableSyncJob? = syncJobRepository.findById(id)

    fun getSyncJobsForConnection(connectionId: UUID, pageable: Pageable): Page<WearableSyncJob> =
        syncJobRepository.findByConnectionId(connectionId, pageable)

    fun getLatestSyncJob(connectionId: UUID): WearableSyncJob? =
        syncJobRepository.findLatestByConnectionId(connectionId)

    fun completeSyncJob(id: UUID): WearableSyncJob {
        val job = syncJobRepository.findById(id)
            ?: throw IllegalArgumentException("Sync job not found: $id")

        job.complete()

        // Update connection sync status
        val connection = connectionRepository.findById(job.connectionId)
        connection?.updateSyncStatus(SyncStatus.SUCCESS)
        connection?.let { connectionRepository.save(it) }

        return syncJobRepository.save(job)
    }

    fun failSyncJob(id: UUID, errorMessage: String): WearableSyncJob {
        val job = syncJobRepository.findById(id)
            ?: throw IllegalArgumentException("Sync job not found: $id")

        job.fail(errorMessage)

        // Update connection sync status
        val connection = connectionRepository.findById(job.connectionId)
        connection?.updateSyncStatus(SyncStatus.FAILED)
        connection?.let { connectionRepository.save(it) }

        return syncJobRepository.save(job)
    }
}

data class WearableWorkoutStats(
    val totalWorkouts: Long,
    val totalDurationSeconds: Long,
    val totalCalories: Long
) {
    val totalDurationMinutes: Long get() = totalDurationSeconds / 60
    val totalDurationHours: Double get() = totalDurationSeconds / 3600.0
}

data class WearableActivityStats(
    val daysTracked: Int,
    val totalSteps: Long,
    val averageStepsPerDay: Double,
    val totalCalories: Long,
    val totalActiveMinutes: Int,
    val averageSleepMinutes: Int,
    val averageRestingHeartRate: Int?
) {
    val averageSleepHours: Double get() = averageSleepMinutes / 60.0
    val totalActiveHours: Double get() = totalActiveMinutes / 60.0
}
