package com.liyaqa.wearables.domain.ports

import com.liyaqa.wearables.domain.model.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.time.LocalDate
import java.util.*

interface WearablePlatformRepository {
    fun findById(id: UUID): WearablePlatform?
    fun findByName(name: String): WearablePlatform?
    fun findAll(): List<WearablePlatform>
    fun findAllActive(): List<WearablePlatform>
    fun save(platform: WearablePlatform): WearablePlatform
}

interface MemberWearableConnectionRepository {
    fun findById(id: UUID): MemberWearableConnection?
    fun findByMemberId(memberId: UUID): List<MemberWearableConnection>
    fun findByMemberIdAndPlatformId(memberId: UUID, platformId: UUID): MemberWearableConnection?
    fun findByPlatformId(platformId: UUID, pageable: Pageable): Page<MemberWearableConnection>
    fun findAllByTenantId(tenantId: UUID, pageable: Pageable): Page<MemberWearableConnection>
    fun findSyncEnabled(): List<MemberWearableConnection>
    fun findDueForSync(lastSyncBefore: Instant): List<MemberWearableConnection>
    fun countByMemberId(memberId: UUID): Long
    fun save(connection: MemberWearableConnection): MemberWearableConnection
    fun delete(id: UUID)
}

interface WearableDailyActivityRepository {
    fun findById(id: UUID): WearableDailyActivity?
    fun findByConnectionIdAndActivityDate(connectionId: UUID, date: LocalDate): WearableDailyActivity?
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<WearableDailyActivity>
    fun findByMemberIdAndDateRange(memberId: UUID, startDate: LocalDate, endDate: LocalDate): List<WearableDailyActivity>
    fun findByConnectionId(connectionId: UUID, pageable: Pageable): Page<WearableDailyActivity>
    fun findLatestByMemberId(memberId: UUID): WearableDailyActivity?
    fun getAverageStepsByMemberId(memberId: UUID, startDate: LocalDate, endDate: LocalDate): Double?
    fun getTotalCaloriesByMemberId(memberId: UUID, startDate: LocalDate, endDate: LocalDate): Long?
    fun save(activity: WearableDailyActivity): WearableDailyActivity
    fun saveAll(activities: List<WearableDailyActivity>): List<WearableDailyActivity>
}

interface WearableWorkoutRepository {
    fun findById(id: UUID): WearableWorkout?
    fun findByExternalWorkoutId(connectionId: UUID, externalWorkoutId: String): WearableWorkout?
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<WearableWorkout>
    fun findByMemberIdAndDateRange(memberId: UUID, startDate: Instant, endDate: Instant): List<WearableWorkout>
    fun findByConnectionId(connectionId: UUID, pageable: Pageable): Page<WearableWorkout>
    fun countByMemberId(memberId: UUID): Long
    fun getTotalDurationByMemberId(memberId: UUID): Long?
    fun getTotalCaloriesByMemberId(memberId: UUID): Long?
    fun save(workout: WearableWorkout): WearableWorkout
    fun saveAll(workouts: List<WearableWorkout>): List<WearableWorkout>
}

interface WearableSyncJobRepository {
    fun findById(id: UUID): WearableSyncJob?
    fun findByConnectionId(connectionId: UUID, pageable: Pageable): Page<WearableSyncJob>
    fun findLatestByConnectionId(connectionId: UUID): WearableSyncJob?
    fun findRunning(): List<WearableSyncJob>
    fun findByStatus(status: SyncJobStatus): List<WearableSyncJob>
    fun save(job: WearableSyncJob): WearableSyncJob
}
