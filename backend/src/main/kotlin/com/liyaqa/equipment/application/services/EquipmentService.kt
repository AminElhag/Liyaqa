package com.liyaqa.equipment.application.services

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.equipment.application.commands.*
import com.liyaqa.equipment.domain.model.*
import com.liyaqa.equipment.domain.ports.*
import com.liyaqa.shared.domain.TenantContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

@Service
@Transactional
class EquipmentService(
    private val providerRepository: EquipmentProviderRepository,
    private val configRepository: EquipmentProviderConfigRepository,
    private val unitRepository: EquipmentUnitRepository,
    private val profileRepository: MemberEquipmentProfileRepository,
    private val workoutRepository: EquipmentWorkoutRepository,
    private val syncJobRepository: EquipmentSyncJobRepository,
    private val objectMapper: ObjectMapper
) {
    // ========== Providers ==========

    fun listProviders(): List<EquipmentProvider> = providerRepository.findAllActive()

    fun getProvider(id: UUID): EquipmentProvider? = providerRepository.findById(id)

    // ========== Provider Configs ==========

    fun listConfigs(pageable: Pageable): Page<EquipmentProviderConfig> =
        configRepository.findAll(pageable)

    fun getConfig(id: UUID): EquipmentProviderConfig? = configRepository.findById(id)

    fun getConfigByProviderId(providerId: UUID): EquipmentProviderConfig? =
        configRepository.findByProviderId(providerId)

    fun createConfig(command: CreateProviderConfigCommand): EquipmentProviderConfig {
        val config = EquipmentProviderConfig(
            providerId = command.providerId,
            apiKeyEncrypted = command.apiKey, // TODO: encrypt
            apiSecretEncrypted = command.apiSecret,
            oauthClientId = command.oauthClientId,
            oauthClientSecretEncrypted = command.oauthClientSecret,
            webhookSecretEncrypted = command.webhookSecret,
            customConfig = command.customConfig?.let { objectMapper.writeValueAsString(it) } ?: "{}",
            syncIntervalMinutes = command.syncIntervalMinutes
        )
        // tenantId is automatically set by BaseEntity's @PrePersist
        return configRepository.save(config)
    }

    fun updateConfig(id: UUID, command: UpdateProviderConfigCommand): EquipmentProviderConfig {
        val config = configRepository.findById(id)
            ?: throw IllegalArgumentException("Provider config not found: $id")

        command.apiKey?.let { config.apiKeyEncrypted = it }
        command.apiSecret?.let { config.apiSecretEncrypted = it }
        command.oauthClientId?.let { config.oauthClientId = it }
        command.oauthClientSecret?.let { config.oauthClientSecretEncrypted = it }
        command.webhookSecret?.let { config.webhookSecretEncrypted = it }
        command.customConfig?.let { config.customConfig = objectMapper.writeValueAsString(it) }
        command.isActive?.let { config.isActive = it }
        command.syncEnabled?.let { config.syncEnabled = it }
        command.syncIntervalMinutes?.let { config.syncIntervalMinutes = it }

        return configRepository.save(config)
    }

    fun updateConfigOAuthTokens(id: UUID, command: UpdateOAuthTokensCommand): EquipmentProviderConfig {
        val config = configRepository.findById(id)
            ?: throw IllegalArgumentException("Provider config not found: $id")

        config.oauthAccessTokenEncrypted = command.accessToken
        command.refreshToken?.let { config.oauthRefreshTokenEncrypted = it }
        config.oauthTokenExpiresAt = command.expiresAt

        return configRepository.save(config)
    }

    fun deleteConfig(id: UUID) = configRepository.delete(id)

    // ========== Equipment Units ==========

    fun listUnits(pageable: Pageable): Page<EquipmentUnit> = unitRepository.findAll(pageable)

    fun listUnitsByLocation(locationId: UUID, pageable: Pageable): Page<EquipmentUnit> =
        unitRepository.findByLocationId(locationId, pageable)

    fun listUnitsByType(equipmentType: EquipmentType, pageable: Pageable): Page<EquipmentUnit> =
        unitRepository.findByType(equipmentType, pageable)

    fun getUnit(id: UUID): EquipmentUnit? = unitRepository.findById(id)

    fun createUnit(command: CreateEquipmentUnitCommand): EquipmentUnit {
        val unit = EquipmentUnit(
            locationId = command.locationId,
            providerId = command.providerId,
            externalId = command.externalId,
            equipmentType = command.equipmentType,
            name = command.name,
            nameAr = command.nameAr,
            model = command.model,
            serialNumber = command.serialNumber,
            manufacturer = command.manufacturer,
            zone = command.zone,
            floorNumber = command.floorNumber,
            positionX = command.positionX,
            positionY = command.positionY,
            metadata = command.metadata?.let { objectMapper.writeValueAsString(it) } ?: "{}"
        )
        // tenantId is automatically set by BaseEntity's @PrePersist
        return unitRepository.save(unit)
    }

    fun updateUnit(id: UUID, command: UpdateEquipmentUnitCommand): EquipmentUnit {
        val unit = unitRepository.findById(id)
            ?: throw IllegalArgumentException("Equipment unit not found: $id")

        command.name?.let { unit.name = it }
        command.nameAr?.let { unit.nameAr = it }
        command.equipmentType?.let { unit.equipmentType = it }
        command.model?.let { unit.model = it }
        command.serialNumber?.let { unit.serialNumber = it }
        command.status?.let { unit.status = it }
        command.zone?.let { unit.zone = it }
        command.floorNumber?.let { unit.floorNumber = it }
        command.positionX?.let { unit.positionX = it }
        command.positionY?.let { unit.positionY = it }
        command.metadata?.let { unit.metadata = objectMapper.writeValueAsString(it) }

        return unitRepository.save(unit)
    }

    fun markUnitConnected(id: UUID): EquipmentUnit {
        val unit = unitRepository.findById(id)
            ?: throw IllegalArgumentException("Equipment unit not found: $id")
        unit.markConnected()
        return unitRepository.save(unit)
    }

    fun markUnitDisconnected(id: UUID): EquipmentUnit {
        val unit = unitRepository.findById(id)
            ?: throw IllegalArgumentException("Equipment unit not found: $id")
        unit.markDisconnected()
        return unitRepository.save(unit)
    }

    fun deleteUnit(id: UUID) = unitRepository.delete(id)

    // ========== Member Profiles ==========

    fun getMemberProfiles(memberId: UUID): List<MemberEquipmentProfile> =
        profileRepository.findByMemberId(memberId)

    fun getMemberProfile(memberId: UUID, providerId: UUID): MemberEquipmentProfile? =
        profileRepository.findByMemberIdAndProviderId(memberId, providerId)

    fun createMemberProfile(command: CreateMemberProfileCommand): MemberEquipmentProfile {
        val profile = MemberEquipmentProfile(
            memberId = command.memberId,
            providerId = command.providerId,
            externalMemberId = command.externalMemberId,
            externalUsername = command.externalUsername
        )
        // tenantId is automatically set by BaseEntity's @PrePersist
        return profileRepository.save(profile)
    }

    fun updateMemberProfile(id: UUID, command: UpdateMemberProfileCommand): MemberEquipmentProfile {
        val profile = profileRepository.findById(id)
            ?: throw IllegalArgumentException("Member profile not found: $id")

        command.externalMemberId?.let { profile.externalMemberId = it }
        command.externalUsername?.let { profile.externalUsername = it }
        command.syncEnabled?.let { profile.syncEnabled = it }

        return profileRepository.save(profile)
    }

    fun updateMemberOAuthTokens(id: UUID, command: UpdateMemberOAuthTokensCommand): MemberEquipmentProfile {
        val profile = profileRepository.findById(id)
            ?: throw IllegalArgumentException("Member profile not found: $id")

        profile.oauthAccessTokenEncrypted = command.accessToken
        command.refreshToken?.let { profile.oauthRefreshTokenEncrypted = it }
        profile.oauthTokenExpiresAt = command.expiresAt

        return profileRepository.save(profile)
    }

    fun deleteMemberProfile(id: UUID) = profileRepository.delete(id)

    // ========== Workouts ==========

    fun listWorkouts(pageable: Pageable): Page<EquipmentWorkout> = workoutRepository.findAll(pageable)

    fun listMemberWorkouts(memberId: UUID, pageable: Pageable): Page<EquipmentWorkout> =
        workoutRepository.findByMemberId(memberId, pageable)

    fun listMemberWorkoutsByDateRange(memberId: UUID, startDate: Instant, endDate: Instant): List<EquipmentWorkout> =
        workoutRepository.findByMemberIdAndDateRange(memberId, startDate, endDate)

    fun listEquipmentWorkouts(equipmentUnitId: UUID, pageable: Pageable): Page<EquipmentWorkout> =
        workoutRepository.findByEquipmentUnitId(equipmentUnitId, pageable)

    fun getWorkout(id: UUID): EquipmentWorkout? = workoutRepository.findById(id)

    fun createWorkout(command: CreateWorkoutCommand): EquipmentWorkout {
        val workout = EquipmentWorkout(
            tenantId = TenantContext.getCurrentTenantId(),
            memberId = command.memberId,
            providerId = command.providerId,
            equipmentUnitId = command.equipmentUnitId,
            externalWorkoutId = command.externalWorkoutId,
            workoutType = command.workoutType,
            equipmentType = command.equipmentType,
            startedAt = command.startedAt,
            endedAt = command.endedAt,
            durationSeconds = command.durationSeconds,
            distanceMeters = command.distanceMeters,
            steps = command.steps,
            floorsClimbed = command.floorsClimbed,
            caloriesTotal = command.caloriesTotal,
            caloriesActive = command.caloriesActive,
            avgHeartRate = command.avgHeartRate,
            maxHeartRate = command.maxHeartRate,
            heartRateZones = command.heartRateZones?.let { objectMapper.writeValueAsString(it) },
            avgPaceSecondsPerKm = command.avgPaceSecondsPerKm,
            avgSpeedKmh = command.avgSpeedKmh,
            maxSpeedKmh = command.maxSpeedKmh,
            avgPowerWatts = command.avgPowerWatts,
            maxPowerWatts = command.maxPowerWatts,
            avgCadence = command.avgCadence,
            totalReps = command.totalReps,
            totalSets = command.totalSets,
            totalWeightKg = command.totalWeightKg,
            exercises = command.exercises?.let { objectMapper.writeValueAsString(it) },
            rawData = command.rawData?.let { objectMapper.writeValueAsString(it) }
        )
        return workoutRepository.save(workout)
    }

    fun getMemberWorkoutStats(memberId: UUID): WorkoutStats {
        val totalWorkouts = workoutRepository.countByMemberId(memberId)
        val totalDuration = workoutRepository.getTotalDurationByMemberId(memberId) ?: 0
        val totalCalories = workoutRepository.getTotalCaloriesByMemberId(memberId) ?: 0

        return WorkoutStats(
            totalWorkouts = totalWorkouts,
            totalDurationSeconds = totalDuration,
            totalCalories = totalCalories
        )
    }

    // ========== Sync Jobs ==========

    fun startSyncJob(command: StartSyncJobCommand): EquipmentSyncJob {
        val config = configRepository.findById(command.providerConfigId)
            ?: throw IllegalArgumentException("Provider config not found: ${command.providerConfigId}")

        val job = EquipmentSyncJob(
            tenantId = config.tenantId,
            providerConfigId = command.providerConfigId,
            jobType = command.jobType
        )
        job.start()
        return syncJobRepository.save(job)
    }

    fun getSyncJob(id: UUID): EquipmentSyncJob? = syncJobRepository.findById(id)

    fun getSyncJobsForConfig(providerConfigId: UUID, pageable: Pageable): Page<EquipmentSyncJob> =
        syncJobRepository.findByProviderConfigId(providerConfigId, pageable)

    fun getLatestSyncJob(providerConfigId: UUID): EquipmentSyncJob? =
        syncJobRepository.findLatestByProviderConfigId(providerConfigId)
}

data class WorkoutStats(
    val totalWorkouts: Long,
    val totalDurationSeconds: Long,
    val totalCalories: Long
) {
    val totalDurationMinutes: Long get() = totalDurationSeconds / 60
    val totalDurationHours: Double get() = totalDurationSeconds / 3600.0
}
