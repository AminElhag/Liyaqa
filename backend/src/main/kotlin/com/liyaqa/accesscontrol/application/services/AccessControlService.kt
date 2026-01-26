package com.liyaqa.accesscontrol.application.services

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.accesscontrol.application.commands.*
import com.liyaqa.accesscontrol.domain.model.*
import com.liyaqa.accesscontrol.domain.ports.*
import com.liyaqa.shared.domain.TenantContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.*

@Service
@Transactional
class AccessControlService(
    private val zoneRepository: AccessZoneRepository,
    private val deviceRepository: AccessDeviceRepository,
    private val timeRuleRepository: AccessTimeRuleRepository,
    private val cardRepository: MemberAccessCardRepository,
    private val biometricRepository: BiometricEnrollmentRepository,
    private val accessLogRepository: AccessLogRepository,
    private val occupancyRepository: ZoneOccupancyRepository,
    private val memberLocationRepository: MemberCurrentLocationRepository,
    private val objectMapper: ObjectMapper
) {
    // ========== Zone Management ==========

    fun createZone(command: CreateZoneCommand): AccessZone {
        val zone = AccessZone(
            locationId = command.locationId,
            name = command.name,
            nameAr = command.nameAr,
            zoneType = command.zoneType,
            maxOccupancy = command.maxOccupancy,
            genderRestriction = command.genderRestriction,
            requireSpecificPlans = command.requireSpecificPlans?.let {
                objectMapper.writeValueAsString(it)
            }
        )
        // tenantId is automatically set by BaseEntity's @PrePersist

        val savedZone = zoneRepository.save(zone)

        // Initialize occupancy tracking
        val occupancy = ZoneOccupancy(
            tenantId = TenantContext.getCurrentTenantId(),
            zoneId = savedZone.id
        )
        occupancyRepository.save(occupancy)

        return savedZone
    }

    fun updateZone(id: UUID, command: UpdateZoneCommand): AccessZone {
        val zone = zoneRepository.findById(id)
            ?: throw IllegalArgumentException("Zone not found: $id")

        command.name?.let { zone.name = it }
        command.nameAr?.let { zone.nameAr = it }
        command.maxOccupancy?.let { zone.maxOccupancy = it }
        command.genderRestriction?.let { zone.genderRestriction = it }
        command.requireSpecificPlans?.let {
            zone.requireSpecificPlans = objectMapper.writeValueAsString(it)
        }
        command.isActive?.let { zone.isActive = it }

        return zoneRepository.save(zone)
    }

    fun getZone(id: UUID) = zoneRepository.findById(id)
    fun listZones(pageable: Pageable) = zoneRepository.findAll(pageable)
    fun listZonesByLocation(locationId: UUID) = zoneRepository.findByLocationId(locationId)
    fun deleteZone(id: UUID) {
        val zone = zoneRepository.findById(id)
            ?: throw IllegalArgumentException("Zone not found: $id")
        zoneRepository.delete(zone)
    }

    // ========== Device Management ==========

    fun createDevice(command: CreateDeviceCommand): AccessDevice {
        val device = AccessDevice(
            locationId = command.locationId,
            deviceType = command.deviceType,
            deviceName = command.deviceName,
            deviceNameAr = command.deviceNameAr,
            manufacturer = command.manufacturer,
            model = command.model,
            serialNumber = command.serialNumber,
            ipAddress = command.ipAddress,
            apiEndpoint = command.apiEndpoint,
            apiKeyEncrypted = command.apiKey, // Should encrypt in production
            zoneId = command.zoneId,
            direction = command.direction,
            config = command.config?.let { objectMapper.writeValueAsString(it) }
        )
        // tenantId is automatically set by BaseEntity's @PrePersist
        return deviceRepository.save(device)
    }

    fun updateDevice(id: UUID, command: UpdateDeviceCommand): AccessDevice {
        val device = deviceRepository.findById(id)
            ?: throw IllegalArgumentException("Device not found: $id")

        command.deviceName?.let { device.deviceName = it }
        command.deviceNameAr?.let { device.deviceNameAr = it }
        command.ipAddress?.let { device.ipAddress = it }
        command.apiEndpoint?.let { device.apiEndpoint = it }
        command.apiKey?.let { device.apiKeyEncrypted = it }
        command.zoneId?.let { device.zoneId = it }
        command.direction?.let { device.direction = it }
        command.status?.let { device.status = it }
        command.config?.let { device.config = objectMapper.writeValueAsString(it) }

        return deviceRepository.save(device)
    }

    fun getDevice(id: UUID) = deviceRepository.findById(id)
    fun listDevices(pageable: Pageable) = deviceRepository.findAll(pageable)
    fun listDevicesByLocation(locationId: UUID) = deviceRepository.findByLocationId(locationId)
    fun updateDeviceHeartbeat(id: UUID) {
        val device = deviceRepository.findById(id) ?: return
        device.updateHeartbeat()
        deviceRepository.save(device)
    }
    fun deleteDevice(id: UUID) {
        val device = deviceRepository.findById(id)
            ?: throw IllegalArgumentException("Device not found: $id")
        deviceRepository.delete(device)
    }

    // ========== Access Control Logic ==========

    fun processAccessRequest(command: ProcessAccessRequestCommand): AccessLog {
        val device = deviceRepository.findById(command.deviceId)
            ?: throw IllegalArgumentException("Device not found: ${command.deviceId}")

        val tenantId = device.tenantId
        val zoneId = device.zoneId

        // Find member by credential
        val (memberId, cardId, biometricId) = when (command.accessMethod) {
            AccessMethod.RFID, AccessMethod.BIOMETRIC -> {
                val card = cardRepository.findByCardNumber(command.credential)
                if (card != null) {
                    Triple(card.memberId, card.id, null)
                } else {
                    Triple<UUID?, UUID?, UUID?>(null, null, null)
                }
            }
            else -> Triple<UUID?, UUID?, UUID?>(null, null, null)
        }

        // Check if we found a valid member
        if (memberId == null) {
            return accessLogRepository.save(
                AccessLog.denied(
                    tenantId = tenantId,
                    deviceId = device.id,
                    zoneId = zoneId,
                    memberId = null,
                    accessMethod = command.accessMethod,
                    direction = command.direction,
                    denialReason = DenialReason.UNKNOWN_CREDENTIAL,
                    rawCredential = command.credential
                )
            )
        }

        // Check card validity
        if (cardId != null) {
            val card = cardRepository.findById(cardId)
            if (card != null && !card.isValid()) {
                val reason = when (card.status) {
                    CardStatus.SUSPENDED -> DenialReason.SUSPENDED_CARD
                    CardStatus.EXPIRED -> DenialReason.EXPIRED_MEMBERSHIP
                    else -> DenialReason.INVALID_CARD
                }
                return accessLogRepository.save(
                    AccessLog.denied(
                        tenantId = tenantId,
                        deviceId = device.id,
                        zoneId = zoneId,
                        memberId = memberId,
                        accessMethod = command.accessMethod,
                        direction = command.direction,
                        denialReason = reason,
                        cardId = cardId
                    )
                )
            }
        }

        // Check zone capacity (for entry)
        if (command.direction == AccessDirection.ENTRY && zoneId != null) {
            val zone = zoneRepository.findById(zoneId)
            if (zone != null && zone.isAtCapacity()) {
                return accessLogRepository.save(
                    AccessLog.denied(
                        tenantId = tenantId,
                        deviceId = device.id,
                        zoneId = zoneId,
                        memberId = memberId,
                        accessMethod = command.accessMethod,
                        direction = command.direction,
                        denialReason = DenialReason.CAPACITY_FULL,
                        cardId = cardId
                    )
                )
            }
        }

        // Check time rules
        val now = LocalDateTime.now()
        val applicableRules = timeRuleRepository.findActiveRules()
            .filter { rule ->
                (rule.zoneId == null || rule.zoneId == zoneId) &&
                rule.isApplicableAt(now)
            }
            .sortedByDescending { it.priority }

        val denyRule = applicableRules.find { it.accessType == AccessRuleType.DENY }
        if (denyRule != null) {
            return accessLogRepository.save(
                AccessLog.denied(
                    tenantId = tenantId,
                    deviceId = device.id,
                    zoneId = zoneId,
                    memberId = memberId,
                    accessMethod = command.accessMethod,
                    direction = command.direction,
                    denialReason = DenialReason.TIME_RESTRICTED,
                    cardId = cardId
                )
            )
        }

        // Grant access
        val log = accessLogRepository.save(
            AccessLog.granted(
                tenantId = tenantId,
                deviceId = device.id,
                zoneId = zoneId,
                memberId = memberId,
                accessMethod = command.accessMethod,
                direction = command.direction,
                cardId = cardId,
                biometricId = biometricId,
                confidenceScore = command.confidenceScore?.let { BigDecimal.valueOf(it) }
            )
        )

        // Update occupancy
        if (zoneId != null) {
            val occupancy = occupancyRepository.findByZoneId(zoneId)
                ?: ZoneOccupancy(tenantId = tenantId, zoneId = zoneId)

            when (command.direction) {
                AccessDirection.ENTRY -> {
                    occupancy.incrementCount()
                    // Update member location
                    val location = memberLocationRepository.findByMemberId(memberId)
                        ?: MemberCurrentLocation(tenantId = tenantId, memberId = memberId, zoneId = zoneId)
                    location.updateZone(zoneId)
                    memberLocationRepository.save(location)
                }
                AccessDirection.EXIT -> {
                    occupancy.decrementCount()
                    memberLocationRepository.deleteByMemberId(memberId)
                }
            }
            occupancyRepository.save(occupancy)
        }

        // Mark card as used
        if (cardId != null) {
            val card = cardRepository.findById(cardId)
            card?.markUsed()
            card?.let { cardRepository.save(it) }
        }

        return log
    }

    // ========== Access Logs ==========

    fun getAccessLogs(pageable: Pageable) = accessLogRepository.findAll(pageable)
    fun getAccessLogsByMember(memberId: UUID, pageable: Pageable) =
        accessLogRepository.findByMemberId(memberId, pageable)
    fun getAccessLogsByDevice(deviceId: UUID, pageable: Pageable) =
        accessLogRepository.findByDeviceId(deviceId, pageable)
    fun getAccessLogsByZone(zoneId: UUID, pageable: Pageable) =
        accessLogRepository.findByZoneId(zoneId, pageable)

    // ========== Occupancy ==========

    fun getZoneOccupancy(zoneId: UUID) = occupancyRepository.findByZoneId(zoneId)
    fun getAllOccupancies() = occupancyRepository.findAll()
    fun getMembersInZone(zoneId: UUID) = memberLocationRepository.findByZoneId(zoneId)
}
