package com.liyaqa.accesscontrol.domain.ports

import com.liyaqa.accesscontrol.domain.model.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.*

interface AccessZoneRepository {
    fun save(zone: AccessZone): AccessZone
    fun findById(id: UUID): AccessZone?
    fun findByLocationId(locationId: UUID): List<AccessZone>
    fun findAll(pageable: Pageable): Page<AccessZone>
    fun findActiveByLocationId(locationId: UUID): List<AccessZone>
    fun delete(zone: AccessZone)
}

interface AccessDeviceRepository {
    fun save(device: AccessDevice): AccessDevice
    fun findById(id: UUID): AccessDevice?
    fun findByLocationId(locationId: UUID): List<AccessDevice>
    fun findByZoneId(zoneId: UUID): List<AccessDevice>
    fun findAll(pageable: Pageable): Page<AccessDevice>
    fun findActiveByLocationId(locationId: UUID): List<AccessDevice>
    fun findOfflineDevices(): List<AccessDevice>
    fun delete(device: AccessDevice)
}

interface AccessTimeRuleRepository {
    fun save(rule: AccessTimeRule): AccessTimeRule
    fun findById(id: UUID): AccessTimeRule?
    fun findAll(pageable: Pageable): Page<AccessTimeRule>
    fun findByZoneId(zoneId: UUID): List<AccessTimeRule>
    fun findByPlanId(planId: UUID): List<AccessTimeRule>
    fun findByMemberId(memberId: UUID): List<AccessTimeRule>
    fun findActiveRules(): List<AccessTimeRule>
    fun delete(rule: AccessTimeRule)
}

interface MemberAccessCardRepository {
    fun save(card: MemberAccessCard): MemberAccessCard
    fun findById(id: UUID): MemberAccessCard?
    fun findByMemberId(memberId: UUID): List<MemberAccessCard>
    fun findByCardNumber(cardNumber: String): MemberAccessCard?
    fun findActiveByMemberId(memberId: UUID): List<MemberAccessCard>
    fun findAll(pageable: Pageable): Page<MemberAccessCard>
    fun delete(card: MemberAccessCard)
}

interface BiometricEnrollmentRepository {
    fun save(enrollment: BiometricEnrollment): BiometricEnrollment
    fun findById(id: UUID): BiometricEnrollment?
    fun findByMemberId(memberId: UUID): List<BiometricEnrollment>
    fun findActiveByMemberId(memberId: UUID): List<BiometricEnrollment>
    fun findByMemberIdAndType(memberId: UUID, type: BiometricType): List<BiometricEnrollment>
    fun findAll(pageable: Pageable): Page<BiometricEnrollment>
    fun delete(enrollment: BiometricEnrollment)
}

interface AccessLogRepository {
    fun save(log: AccessLog): AccessLog
    fun findById(id: UUID): AccessLog?
    fun findByDeviceId(deviceId: UUID, pageable: Pageable): Page<AccessLog>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<AccessLog>
    fun findByZoneId(zoneId: UUID, pageable: Pageable): Page<AccessLog>
    fun findAll(pageable: Pageable): Page<AccessLog>
    fun findByTimestampBetween(start: Instant, end: Instant, pageable: Pageable): Page<AccessLog>
    fun countByResultAndTimestampBetween(result: AccessResult, start: Instant, end: Instant): Long
    fun findDeniedByTimestampBetween(start: Instant, end: Instant, pageable: Pageable): Page<AccessLog>
}

interface ZoneOccupancyRepository {
    fun save(occupancy: ZoneOccupancy): ZoneOccupancy
    fun findByZoneId(zoneId: UUID): ZoneOccupancy?
    fun findAll(): List<ZoneOccupancy>
    fun findByTenantId(tenantId: UUID): List<ZoneOccupancy>
}

interface MemberCurrentLocationRepository {
    fun save(location: MemberCurrentLocation): MemberCurrentLocation
    fun findByMemberId(memberId: UUID): MemberCurrentLocation?
    fun findByZoneId(zoneId: UUID): List<MemberCurrentLocation>
    fun deleteByMemberId(memberId: UUID)
}
