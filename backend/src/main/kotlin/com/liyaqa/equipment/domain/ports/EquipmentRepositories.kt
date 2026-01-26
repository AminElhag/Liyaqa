package com.liyaqa.equipment.domain.ports

import com.liyaqa.equipment.domain.model.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.*

interface EquipmentProviderRepository {
    fun findById(id: UUID): EquipmentProvider?
    fun findByName(name: String): EquipmentProvider?
    fun findAll(): List<EquipmentProvider>
    fun findAllActive(): List<EquipmentProvider>
    fun save(provider: EquipmentProvider): EquipmentProvider
}

interface EquipmentProviderConfigRepository {
    fun findById(id: UUID): EquipmentProviderConfig?
    fun findByProviderId(providerId: UUID): EquipmentProviderConfig?
    fun findAll(pageable: Pageable): Page<EquipmentProviderConfig>
    fun findAllActive(): List<EquipmentProviderConfig>
    fun findDueForSync(): List<EquipmentProviderConfig>
    fun save(config: EquipmentProviderConfig): EquipmentProviderConfig
    fun delete(id: UUID)
}

interface EquipmentUnitRepository {
    fun findById(id: UUID): EquipmentUnit?
    fun findByExternalId(providerId: UUID, externalId: String): EquipmentUnit?
    fun findAll(pageable: Pageable): Page<EquipmentUnit>
    fun findByLocationId(locationId: UUID, pageable: Pageable): Page<EquipmentUnit>
    fun findByProviderId(providerId: UUID): List<EquipmentUnit>
    fun findByType(equipmentType: EquipmentType, pageable: Pageable): Page<EquipmentUnit>
    fun countByLocationId(locationId: UUID): Long
    fun countByStatus(status: EquipmentStatus): Long
    fun save(unit: EquipmentUnit): EquipmentUnit
    fun delete(id: UUID)
}

interface MemberEquipmentProfileRepository {
    fun findById(id: UUID): MemberEquipmentProfile?
    fun findByMemberId(memberId: UUID): List<MemberEquipmentProfile>
    fun findByMemberIdAndProviderId(memberId: UUID, providerId: UUID): MemberEquipmentProfile?
    fun findByExternalMemberId(providerId: UUID, externalMemberId: String): MemberEquipmentProfile?
    fun save(profile: MemberEquipmentProfile): MemberEquipmentProfile
    fun delete(id: UUID)
}

interface EquipmentWorkoutRepository {
    fun findById(id: UUID): EquipmentWorkout?
    fun findByExternalWorkoutId(providerId: UUID, externalWorkoutId: String): EquipmentWorkout?
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<EquipmentWorkout>
    fun findByMemberIdAndDateRange(memberId: UUID, startDate: Instant, endDate: Instant): List<EquipmentWorkout>
    fun findByEquipmentUnitId(equipmentUnitId: UUID, pageable: Pageable): Page<EquipmentWorkout>
    fun findAll(pageable: Pageable): Page<EquipmentWorkout>
    fun countByMemberId(memberId: UUID): Long
    fun getTotalDurationByMemberId(memberId: UUID): Long?
    fun getTotalCaloriesByMemberId(memberId: UUID): Long?
    fun save(workout: EquipmentWorkout): EquipmentWorkout
    fun saveAll(workouts: List<EquipmentWorkout>): List<EquipmentWorkout>
}

interface EquipmentSyncJobRepository {
    fun findById(id: UUID): EquipmentSyncJob?
    fun findByProviderConfigId(providerConfigId: UUID, pageable: Pageable): Page<EquipmentSyncJob>
    fun findLatestByProviderConfigId(providerConfigId: UUID): EquipmentSyncJob?
    fun findRunning(): List<EquipmentSyncJob>
    fun save(job: EquipmentSyncJob): EquipmentSyncJob
}
