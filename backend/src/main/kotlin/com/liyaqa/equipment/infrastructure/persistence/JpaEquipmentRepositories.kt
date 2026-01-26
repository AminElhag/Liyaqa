package com.liyaqa.equipment.infrastructure.persistence

import com.liyaqa.equipment.domain.model.*
import com.liyaqa.equipment.domain.ports.*
import com.liyaqa.shared.domain.TenantContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

// ========== JPA Interfaces ==========

interface JpaEquipmentProviderRepository : JpaRepository<EquipmentProvider, UUID> {
    fun findByName(name: String): EquipmentProvider?
    fun findByIsActiveTrue(): List<EquipmentProvider>
}

interface JpaEquipmentProviderConfigRepository : JpaRepository<EquipmentProviderConfig, UUID> {
    fun findByTenantIdAndProviderId(tenantId: UUID, providerId: UUID): EquipmentProviderConfig?
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<EquipmentProviderConfig>
    fun findByTenantIdAndIsActiveTrue(tenantId: UUID): List<EquipmentProviderConfig>

    @Query("""
        SELECT c FROM EquipmentProviderConfig c
        WHERE c.tenantId = :tenantId
        AND c.isActive = true
        AND c.syncEnabled = true
        AND (c.lastSyncAt IS NULL OR c.lastSyncAt < :cutoffTime)
    """)
    fun findDueForSync(@Param("tenantId") tenantId: UUID, @Param("cutoffTime") cutoffTime: Instant): List<EquipmentProviderConfig>
}

interface JpaEquipmentUnitRepository : JpaRepository<EquipmentUnit, UUID> {
    fun findByTenantIdAndProviderIdAndExternalId(tenantId: UUID, providerId: UUID, externalId: String): EquipmentUnit?
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<EquipmentUnit>
    fun findByTenantIdAndLocationId(tenantId: UUID, locationId: UUID, pageable: Pageable): Page<EquipmentUnit>
    fun findByTenantIdAndProviderId(tenantId: UUID, providerId: UUID): List<EquipmentUnit>
    fun findByTenantIdAndEquipmentType(tenantId: UUID, equipmentType: EquipmentType, pageable: Pageable): Page<EquipmentUnit>
    fun countByTenantIdAndLocationId(tenantId: UUID, locationId: UUID): Long
    fun countByTenantIdAndStatus(tenantId: UUID, status: EquipmentStatus): Long
}

interface JpaMemberEquipmentProfileRepository : JpaRepository<MemberEquipmentProfile, UUID> {
    fun findByTenantIdAndMemberId(tenantId: UUID, memberId: UUID): List<MemberEquipmentProfile>
    fun findByTenantIdAndMemberIdAndProviderId(tenantId: UUID, memberId: UUID, providerId: UUID): MemberEquipmentProfile?
    fun findByProviderIdAndExternalMemberId(providerId: UUID, externalMemberId: String): MemberEquipmentProfile?
}

interface JpaEquipmentWorkoutRepository : JpaRepository<EquipmentWorkout, UUID> {
    fun findByProviderIdAndExternalWorkoutId(providerId: UUID, externalWorkoutId: String): EquipmentWorkout?
    fun findByTenantIdAndMemberId(tenantId: UUID, memberId: UUID, pageable: Pageable): Page<EquipmentWorkout>

    @Query("""
        SELECT w FROM EquipmentWorkout w
        WHERE w.tenantId = :tenantId
        AND w.memberId = :memberId
        AND w.startedAt >= :startDate
        AND w.startedAt < :endDate
        ORDER BY w.startedAt DESC
    """)
    fun findByMemberIdAndDateRange(
        @Param("tenantId") tenantId: UUID,
        @Param("memberId") memberId: UUID,
        @Param("startDate") startDate: Instant,
        @Param("endDate") endDate: Instant
    ): List<EquipmentWorkout>

    fun findByTenantIdAndEquipmentUnitId(tenantId: UUID, equipmentUnitId: UUID, pageable: Pageable): Page<EquipmentWorkout>
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<EquipmentWorkout>
    fun countByTenantIdAndMemberId(tenantId: UUID, memberId: UUID): Long

    @Query("SELECT COALESCE(SUM(w.durationSeconds), 0) FROM EquipmentWorkout w WHERE w.tenantId = :tenantId AND w.memberId = :memberId")
    fun getTotalDurationByMemberId(@Param("tenantId") tenantId: UUID, @Param("memberId") memberId: UUID): Long?

    @Query("SELECT COALESCE(SUM(w.caloriesTotal), 0) FROM EquipmentWorkout w WHERE w.tenantId = :tenantId AND w.memberId = :memberId")
    fun getTotalCaloriesByMemberId(@Param("tenantId") tenantId: UUID, @Param("memberId") memberId: UUID): Long?
}

interface JpaEquipmentSyncJobRepository : JpaRepository<EquipmentSyncJob, UUID> {
    fun findByTenantIdAndProviderConfigId(tenantId: UUID, providerConfigId: UUID, pageable: Pageable): Page<EquipmentSyncJob>
    fun findFirstByTenantIdAndProviderConfigIdOrderByCreatedAtDesc(tenantId: UUID, providerConfigId: UUID): EquipmentSyncJob?
    fun findByStatus(status: SyncJobStatus): List<EquipmentSyncJob>
}

// ========== Repository Adapters ==========

@Repository
class EquipmentProviderRepositoryAdapter(
    private val jpa: JpaEquipmentProviderRepository
) : EquipmentProviderRepository {
    override fun findById(id: UUID) = jpa.findById(id).orElse(null)
    override fun findByName(name: String) = jpa.findByName(name)
    override fun findAll() = jpa.findAll()
    override fun findAllActive() = jpa.findByIsActiveTrue()
    override fun save(provider: EquipmentProvider) = jpa.save(provider)
}

@Repository
class EquipmentProviderConfigRepositoryAdapter(
    private val jpa: JpaEquipmentProviderConfigRepository
) : EquipmentProviderConfigRepository {
    private fun tenantId() = TenantContext.getCurrentTenantId()

    override fun findById(id: UUID) = jpa.findById(id).orElse(null)
    override fun findByProviderId(providerId: UUID) = jpa.findByTenantIdAndProviderId(tenantId(), providerId)
    override fun findAll(pageable: Pageable) = jpa.findByTenantId(tenantId(), pageable)
    override fun findAllActive() = jpa.findByTenantIdAndIsActiveTrue(tenantId())
    override fun findDueForSync(): List<EquipmentProviderConfig> {
        val cutoffTime = Instant.now().minusSeconds(3600) // 1 hour ago
        return jpa.findDueForSync(tenantId(), cutoffTime)
    }
    override fun save(config: EquipmentProviderConfig) = jpa.save(config)
    override fun delete(id: UUID) = jpa.deleteById(id)
}

@Repository
class EquipmentUnitRepositoryAdapter(
    private val jpa: JpaEquipmentUnitRepository
) : EquipmentUnitRepository {
    private fun tenantId() = TenantContext.getCurrentTenantId()

    override fun findById(id: UUID) = jpa.findById(id).orElse(null)
    override fun findByExternalId(providerId: UUID, externalId: String) =
        jpa.findByTenantIdAndProviderIdAndExternalId(tenantId(), providerId, externalId)
    override fun findAll(pageable: Pageable) = jpa.findByTenantId(tenantId(), pageable)
    override fun findByLocationId(locationId: UUID, pageable: Pageable) =
        jpa.findByTenantIdAndLocationId(tenantId(), locationId, pageable)
    override fun findByProviderId(providerId: UUID) = jpa.findByTenantIdAndProviderId(tenantId(), providerId)
    override fun findByType(equipmentType: EquipmentType, pageable: Pageable) =
        jpa.findByTenantIdAndEquipmentType(tenantId(), equipmentType, pageable)
    override fun countByLocationId(locationId: UUID) = jpa.countByTenantIdAndLocationId(tenantId(), locationId)
    override fun countByStatus(status: EquipmentStatus) = jpa.countByTenantIdAndStatus(tenantId(), status)
    override fun save(unit: EquipmentUnit) = jpa.save(unit)
    override fun delete(id: UUID) = jpa.deleteById(id)
}

@Repository
class MemberEquipmentProfileRepositoryAdapter(
    private val jpa: JpaMemberEquipmentProfileRepository
) : MemberEquipmentProfileRepository {
    private fun tenantId() = TenantContext.getCurrentTenantId()

    override fun findById(id: UUID) = jpa.findById(id).orElse(null)
    override fun findByMemberId(memberId: UUID) = jpa.findByTenantIdAndMemberId(tenantId(), memberId)
    override fun findByMemberIdAndProviderId(memberId: UUID, providerId: UUID) =
        jpa.findByTenantIdAndMemberIdAndProviderId(tenantId(), memberId, providerId)
    override fun findByExternalMemberId(providerId: UUID, externalMemberId: String) =
        jpa.findByProviderIdAndExternalMemberId(providerId, externalMemberId)
    override fun save(profile: MemberEquipmentProfile) = jpa.save(profile)
    override fun delete(id: UUID) = jpa.deleteById(id)
}

@Repository
class EquipmentWorkoutRepositoryAdapter(
    private val jpa: JpaEquipmentWorkoutRepository
) : EquipmentWorkoutRepository {
    private fun tenantId() = TenantContext.getCurrentTenantId()

    override fun findById(id: UUID) = jpa.findById(id).orElse(null)
    override fun findByExternalWorkoutId(providerId: UUID, externalWorkoutId: String) =
        jpa.findByProviderIdAndExternalWorkoutId(providerId, externalWorkoutId)
    override fun findByMemberId(memberId: UUID, pageable: Pageable) =
        jpa.findByTenantIdAndMemberId(tenantId(), memberId, pageable)
    override fun findByMemberIdAndDateRange(memberId: UUID, startDate: Instant, endDate: Instant) =
        jpa.findByMemberIdAndDateRange(tenantId(), memberId, startDate, endDate)
    override fun findByEquipmentUnitId(equipmentUnitId: UUID, pageable: Pageable) =
        jpa.findByTenantIdAndEquipmentUnitId(tenantId(), equipmentUnitId, pageable)
    override fun findAll(pageable: Pageable) = jpa.findByTenantId(tenantId(), pageable)
    override fun countByMemberId(memberId: UUID) = jpa.countByTenantIdAndMemberId(tenantId(), memberId)
    override fun getTotalDurationByMemberId(memberId: UUID) = jpa.getTotalDurationByMemberId(tenantId(), memberId)
    override fun getTotalCaloriesByMemberId(memberId: UUID) = jpa.getTotalCaloriesByMemberId(tenantId(), memberId)
    override fun save(workout: EquipmentWorkout) = jpa.save(workout)
    override fun saveAll(workouts: List<EquipmentWorkout>) = jpa.saveAll(workouts)
}

@Repository
class EquipmentSyncJobRepositoryAdapter(
    private val jpa: JpaEquipmentSyncJobRepository
) : EquipmentSyncJobRepository {
    private fun tenantId() = TenantContext.getCurrentTenantId()

    override fun findById(id: UUID) = jpa.findById(id).orElse(null)
    override fun findByProviderConfigId(providerConfigId: UUID, pageable: Pageable) =
        jpa.findByTenantIdAndProviderConfigId(tenantId(), providerConfigId, pageable)
    override fun findLatestByProviderConfigId(providerConfigId: UUID) =
        jpa.findFirstByTenantIdAndProviderConfigIdOrderByCreatedAtDesc(tenantId(), providerConfigId)
    override fun findRunning() = jpa.findByStatus(SyncJobStatus.RUNNING)
    override fun save(job: EquipmentSyncJob) = jpa.save(job)
}
