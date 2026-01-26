package com.liyaqa.accesscontrol.infrastructure.persistence

import com.liyaqa.accesscontrol.domain.model.*
import com.liyaqa.accesscontrol.domain.ports.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

// ========== Access Zone ==========

interface SpringDataAccessZoneRepository : JpaRepository<AccessZone, UUID> {
    fun findByLocationId(locationId: UUID): List<AccessZone>

    @Query("SELECT z FROM AccessZone z WHERE z.locationId = :locationId AND z.isActive = true")
    fun findActiveByLocationId(@Param("locationId") locationId: UUID): List<AccessZone>
}

@Repository
class JpaAccessZoneRepository(
    private val springRepo: SpringDataAccessZoneRepository
) : AccessZoneRepository {
    override fun save(zone: AccessZone) = springRepo.save(zone)
    override fun findById(id: UUID) = springRepo.findById(id).orElse(null)
    override fun findByLocationId(locationId: UUID) = springRepo.findByLocationId(locationId)
    override fun findAll(pageable: Pageable) = springRepo.findAll(pageable)
    override fun findActiveByLocationId(locationId: UUID) = springRepo.findActiveByLocationId(locationId)
    override fun delete(zone: AccessZone) = springRepo.delete(zone)
}

// ========== Access Device ==========

interface SpringDataAccessDeviceRepository : JpaRepository<AccessDevice, UUID> {
    fun findByLocationId(locationId: UUID): List<AccessDevice>
    fun findByZoneId(zoneId: UUID): List<AccessDevice>

    @Query("SELECT d FROM AccessDevice d WHERE d.locationId = :locationId AND d.status = 'ACTIVE'")
    fun findActiveByLocationId(@Param("locationId") locationId: UUID): List<AccessDevice>

    @Query("SELECT d FROM AccessDevice d WHERE d.isOnline = false AND d.status = 'ACTIVE'")
    fun findOfflineDevices(): List<AccessDevice>
}

@Repository
class JpaAccessDeviceRepository(
    private val springRepo: SpringDataAccessDeviceRepository
) : AccessDeviceRepository {
    override fun save(device: AccessDevice) = springRepo.save(device)
    override fun findById(id: UUID) = springRepo.findById(id).orElse(null)
    override fun findByLocationId(locationId: UUID) = springRepo.findByLocationId(locationId)
    override fun findByZoneId(zoneId: UUID) = springRepo.findByZoneId(zoneId)
    override fun findAll(pageable: Pageable) = springRepo.findAll(pageable)
    override fun findActiveByLocationId(locationId: UUID) = springRepo.findActiveByLocationId(locationId)
    override fun findOfflineDevices() = springRepo.findOfflineDevices()
    override fun delete(device: AccessDevice) = springRepo.delete(device)
}

// ========== Access Time Rule ==========

interface SpringDataAccessTimeRuleRepository : JpaRepository<AccessTimeRule, UUID> {
    fun findByZoneId(zoneId: UUID): List<AccessTimeRule>
    fun findByPlanId(planId: UUID): List<AccessTimeRule>
    fun findByMemberId(memberId: UUID): List<AccessTimeRule>

    @Query("SELECT r FROM AccessTimeRule r WHERE r.isActive = true")
    fun findActiveRules(): List<AccessTimeRule>
}

@Repository
class JpaAccessTimeRuleRepository(
    private val springRepo: SpringDataAccessTimeRuleRepository
) : AccessTimeRuleRepository {
    override fun save(rule: AccessTimeRule) = springRepo.save(rule)
    override fun findById(id: UUID) = springRepo.findById(id).orElse(null)
    override fun findAll(pageable: Pageable) = springRepo.findAll(pageable)
    override fun findByZoneId(zoneId: UUID) = springRepo.findByZoneId(zoneId)
    override fun findByPlanId(planId: UUID) = springRepo.findByPlanId(planId)
    override fun findByMemberId(memberId: UUID) = springRepo.findByMemberId(memberId)
    override fun findActiveRules() = springRepo.findActiveRules()
    override fun delete(rule: AccessTimeRule) = springRepo.delete(rule)
}

// ========== Member Access Card ==========

interface SpringDataMemberAccessCardRepository : JpaRepository<MemberAccessCard, UUID> {
    fun findByMemberId(memberId: UUID): List<MemberAccessCard>
    fun findByCardNumber(cardNumber: String): MemberAccessCard?

    @Query("SELECT c FROM MemberAccessCard c WHERE c.memberId = :memberId AND c.status = 'ACTIVE'")
    fun findActiveByMemberId(@Param("memberId") memberId: UUID): List<MemberAccessCard>
}

@Repository
class JpaMemberAccessCardRepository(
    private val springRepo: SpringDataMemberAccessCardRepository
) : MemberAccessCardRepository {
    override fun save(card: MemberAccessCard) = springRepo.save(card)
    override fun findById(id: UUID) = springRepo.findById(id).orElse(null)
    override fun findByMemberId(memberId: UUID) = springRepo.findByMemberId(memberId)
    override fun findByCardNumber(cardNumber: String) = springRepo.findByCardNumber(cardNumber)
    override fun findActiveByMemberId(memberId: UUID) = springRepo.findActiveByMemberId(memberId)
    override fun findAll(pageable: Pageable) = springRepo.findAll(pageable)
    override fun delete(card: MemberAccessCard) = springRepo.delete(card)
}

// ========== Biometric Enrollment ==========

interface SpringDataBiometricEnrollmentRepository : JpaRepository<BiometricEnrollment, UUID> {
    fun findByMemberId(memberId: UUID): List<BiometricEnrollment>
    fun findByMemberIdAndBiometricType(memberId: UUID, biometricType: BiometricType): List<BiometricEnrollment>

    @Query("SELECT e FROM BiometricEnrollment e WHERE e.memberId = :memberId AND e.status = 'ACTIVE'")
    fun findActiveByMemberId(@Param("memberId") memberId: UUID): List<BiometricEnrollment>
}

@Repository
class JpaBiometricEnrollmentRepository(
    private val springRepo: SpringDataBiometricEnrollmentRepository
) : BiometricEnrollmentRepository {
    override fun save(enrollment: BiometricEnrollment) = springRepo.save(enrollment)
    override fun findById(id: UUID) = springRepo.findById(id).orElse(null)
    override fun findByMemberId(memberId: UUID) = springRepo.findByMemberId(memberId)
    override fun findActiveByMemberId(memberId: UUID) = springRepo.findActiveByMemberId(memberId)
    override fun findByMemberIdAndType(memberId: UUID, type: BiometricType) =
        springRepo.findByMemberIdAndBiometricType(memberId, type)
    override fun findAll(pageable: Pageable) = springRepo.findAll(pageable)
    override fun delete(enrollment: BiometricEnrollment) = springRepo.delete(enrollment)
}

// ========== Access Log ==========

interface SpringDataAccessLogRepository : JpaRepository<AccessLog, UUID> {
    fun findByDeviceId(deviceId: UUID, pageable: Pageable): Page<AccessLog>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<AccessLog>
    fun findByZoneId(zoneId: UUID, pageable: Pageable): Page<AccessLog>
    fun findByTimestampBetween(start: Instant, end: Instant, pageable: Pageable): Page<AccessLog>
    fun countByResultAndTimestampBetween(result: AccessResult, start: Instant, end: Instant): Long

    @Query("SELECT l FROM AccessLog l WHERE l.result = 'DENIED' AND l.timestamp BETWEEN :start AND :end")
    fun findDeniedByTimestampBetween(
        @Param("start") start: Instant,
        @Param("end") end: Instant,
        pageable: Pageable
    ): Page<AccessLog>
}

@Repository
class JpaAccessLogRepository(
    private val springRepo: SpringDataAccessLogRepository
) : AccessLogRepository {
    override fun save(log: AccessLog) = springRepo.save(log)
    override fun findById(id: UUID) = springRepo.findById(id).orElse(null)
    override fun findByDeviceId(deviceId: UUID, pageable: Pageable) = springRepo.findByDeviceId(deviceId, pageable)
    override fun findByMemberId(memberId: UUID, pageable: Pageable) = springRepo.findByMemberId(memberId, pageable)
    override fun findByZoneId(zoneId: UUID, pageable: Pageable) = springRepo.findByZoneId(zoneId, pageable)
    override fun findAll(pageable: Pageable) = springRepo.findAll(pageable)
    override fun findByTimestampBetween(start: Instant, end: Instant, pageable: Pageable) =
        springRepo.findByTimestampBetween(start, end, pageable)
    override fun countByResultAndTimestampBetween(result: AccessResult, start: Instant, end: Instant) =
        springRepo.countByResultAndTimestampBetween(result, start, end)
    override fun findDeniedByTimestampBetween(start: Instant, end: Instant, pageable: Pageable) =
        springRepo.findDeniedByTimestampBetween(start, end, pageable)
}

// ========== Zone Occupancy ==========

interface SpringDataZoneOccupancyRepository : JpaRepository<ZoneOccupancy, UUID> {
    fun findByZoneId(zoneId: UUID): ZoneOccupancy?
    fun findByTenantId(tenantId: UUID): List<ZoneOccupancy>
}

@Repository
class JpaZoneOccupancyRepository(
    private val springRepo: SpringDataZoneOccupancyRepository
) : ZoneOccupancyRepository {
    override fun save(occupancy: ZoneOccupancy) = springRepo.save(occupancy)
    override fun findByZoneId(zoneId: UUID) = springRepo.findByZoneId(zoneId)
    override fun findAll() = springRepo.findAll()
    override fun findByTenantId(tenantId: UUID) = springRepo.findByTenantId(tenantId)
}

// ========== Member Current Location ==========

interface SpringDataMemberCurrentLocationRepository : JpaRepository<MemberCurrentLocation, UUID> {
    fun findByMemberId(memberId: UUID): MemberCurrentLocation?
    fun findByZoneId(zoneId: UUID): List<MemberCurrentLocation>
    fun deleteByMemberId(memberId: UUID)
}

@Repository
class JpaMemberCurrentLocationRepository(
    private val springRepo: SpringDataMemberCurrentLocationRepository
) : MemberCurrentLocationRepository {
    override fun save(location: MemberCurrentLocation) = springRepo.save(location)
    override fun findByMemberId(memberId: UUID) = springRepo.findByMemberId(memberId)
    override fun findByZoneId(zoneId: UUID) = springRepo.findByZoneId(zoneId)
    override fun deleteByMemberId(memberId: UUID) = springRepo.deleteByMemberId(memberId)
}
