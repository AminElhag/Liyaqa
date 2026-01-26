package com.liyaqa.accesscontrol.api

import com.liyaqa.accesscontrol.domain.model.*
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

// ========== Request DTOs ==========

data class CreateZoneRequest(
    @field:NotNull val locationId: UUID,
    @field:NotBlank @field:Size(max = 100) val name: String,
    @field:Size(max = 100) val nameAr: String? = null,
    @field:NotNull val zoneType: ZoneType,
    @field:Min(1) val maxOccupancy: Int? = null,
    val genderRestriction: GenderRestriction? = null,
    val requireSpecificPlans: List<UUID>? = null
)

data class UpdateZoneRequest(
    @field:Size(max = 100) val name: String? = null,
    @field:Size(max = 100) val nameAr: String? = null,
    @field:Min(1) val maxOccupancy: Int? = null,
    val genderRestriction: GenderRestriction? = null,
    val requireSpecificPlans: List<UUID>? = null,
    val isActive: Boolean? = null
)

data class CreateDeviceRequest(
    @field:NotNull val locationId: UUID,
    @field:NotNull val deviceType: DeviceType,
    @field:NotBlank @field:Size(max = 100) val deviceName: String,
    @field:Size(max = 100) val deviceNameAr: String? = null,
    @field:Size(max = 50) val manufacturer: String? = null,
    @field:Size(max = 50) val model: String? = null,
    @field:Size(max = 100) val serialNumber: String? = null,
    @field:Size(max = 45) val ipAddress: String? = null,
    @field:Size(max = 255) val apiEndpoint: String? = null,
    val apiKey: String? = null,
    val zoneId: UUID? = null,
    @field:NotNull val direction: DeviceDirection,
    val config: Map<String, Any>? = null
)

data class UpdateDeviceRequest(
    @field:Size(max = 100) val deviceName: String? = null,
    @field:Size(max = 100) val deviceNameAr: String? = null,
    @field:Size(max = 45) val ipAddress: String? = null,
    @field:Size(max = 255) val apiEndpoint: String? = null,
    val apiKey: String? = null,
    val zoneId: UUID? = null,
    val direction: DeviceDirection? = null,
    val status: DeviceStatus? = null,
    val config: Map<String, Any>? = null
)

data class CreateTimeRuleRequest(
    val zoneId: UUID? = null,
    val planId: UUID? = null,
    val memberId: UUID? = null,
    @field:NotBlank @field:Size(max = 100) val name: String,
    @field:Size(max = 100) val nameAr: String? = null,
    @field:Min(0) @field:Max(6) val dayOfWeek: Int? = null,
    @field:NotNull val startTime: LocalTime,
    @field:NotNull val endTime: LocalTime,
    @field:NotNull val accessType: AccessRuleType,
    val priority: Int = 0,
    val validFrom: LocalDate? = null,
    val validUntil: LocalDate? = null
)

data class UpdateTimeRuleRequest(
    @field:Size(max = 100) val name: String? = null,
    @field:Size(max = 100) val nameAr: String? = null,
    @field:Min(0) @field:Max(6) val dayOfWeek: Int? = null,
    val startTime: LocalTime? = null,
    val endTime: LocalTime? = null,
    val accessType: AccessRuleType? = null,
    val priority: Int? = null,
    val isActive: Boolean? = null,
    val validFrom: LocalDate? = null,
    val validUntil: LocalDate? = null
)

data class IssueCardRequest(
    @field:NotNull val memberId: UUID,
    @field:NotNull val cardType: CardType,
    @field:NotBlank @field:Size(max = 100) val cardNumber: String,
    @field:Size(max = 20) val facilityCode: String? = null,
    val expiresAt: Instant? = null,
    @field:Size(max = 500) val notes: String? = null
)

data class UpdateCardRequest(
    val expiresAt: Instant? = null,
    @field:Size(max = 500) val notes: String? = null
)

data class EnrollBiometricRequest(
    @field:NotNull val memberId: UUID,
    @field:NotNull val biometricType: BiometricType,
    val fingerPosition: FingerPosition? = null,
    @field:NotBlank val templateData: String,
    @field:Min(0) @field:Max(100) val templateQuality: Int? = null,
    val deviceId: UUID? = null
)

data class ProcessAccessRequest(
    @field:NotNull val deviceId: UUID,
    @field:NotNull val accessMethod: AccessMethod,
    @field:NotNull val direction: AccessDirection,
    @field:NotBlank val credential: String,
    val confidenceScore: Double? = null
)

// ========== Response DTOs ==========

data class AccessZoneResponse(
    val id: UUID,
    val locationId: UUID,
    val name: String,
    val nameAr: String?,
    val zoneType: ZoneType,
    val maxOccupancy: Int?,
    val currentOccupancy: Int,
    val genderRestriction: GenderRestriction?,
    val requireSpecificPlans: List<UUID>?,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(zone: AccessZone, planIds: List<UUID>? = null) = AccessZoneResponse(
            id = zone.id,
            locationId = zone.locationId,
            name = zone.name,
            nameAr = zone.nameAr,
            zoneType = zone.zoneType,
            maxOccupancy = zone.maxOccupancy,
            currentOccupancy = zone.currentOccupancy,
            genderRestriction = zone.genderRestriction,
            requireSpecificPlans = planIds,
            isActive = zone.isActive,
            createdAt = zone.createdAt,
            updatedAt = zone.updatedAt
        )
    }
}

data class AccessDeviceResponse(
    val id: UUID,
    val locationId: UUID,
    val deviceType: DeviceType,
    val deviceName: String,
    val deviceNameAr: String?,
    val manufacturer: String?,
    val model: String?,
    val serialNumber: String?,
    val ipAddress: String?,
    val apiEndpoint: String?,
    val zoneId: UUID?,
    val direction: DeviceDirection,
    val isOnline: Boolean,
    val lastHeartbeat: Instant?,
    val status: DeviceStatus,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(device: AccessDevice) = AccessDeviceResponse(
            id = device.id,
            locationId = device.locationId,
            deviceType = device.deviceType,
            deviceName = device.deviceName,
            deviceNameAr = device.deviceNameAr,
            manufacturer = device.manufacturer,
            model = device.model,
            serialNumber = device.serialNumber,
            ipAddress = device.ipAddress,
            apiEndpoint = device.apiEndpoint,
            zoneId = device.zoneId,
            direction = device.direction,
            isOnline = device.isOnline,
            lastHeartbeat = device.lastHeartbeat,
            status = device.status,
            createdAt = device.createdAt,
            updatedAt = device.updatedAt
        )
    }
}

data class AccessTimeRuleResponse(
    val id: UUID,
    val zoneId: UUID?,
    val planId: UUID?,
    val memberId: UUID?,
    val name: String,
    val nameAr: String?,
    val dayOfWeek: Int?,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val accessType: AccessRuleType,
    val priority: Int,
    val isActive: Boolean,
    val validFrom: LocalDate?,
    val validUntil: LocalDate?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(rule: AccessTimeRule) = AccessTimeRuleResponse(
            id = rule.id,
            zoneId = rule.zoneId,
            planId = rule.planId,
            memberId = rule.memberId,
            name = rule.name,
            nameAr = rule.nameAr,
            dayOfWeek = rule.dayOfWeek,
            startTime = rule.startTime,
            endTime = rule.endTime,
            accessType = rule.accessType,
            priority = rule.priority,
            isActive = rule.isActive,
            validFrom = rule.validFrom,
            validUntil = rule.validUntil,
            createdAt = rule.createdAt,
            updatedAt = rule.updatedAt
        )
    }
}

data class MemberAccessCardResponse(
    val id: UUID,
    val memberId: UUID,
    val cardType: CardType,
    val cardNumber: String,
    val facilityCode: String?,
    val status: CardStatus,
    val issuedAt: Instant,
    val expiresAt: Instant?,
    val lastUsedAt: Instant?,
    val notes: String?,
    val isValid: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(card: MemberAccessCard) = MemberAccessCardResponse(
            id = card.id,
            memberId = card.memberId,
            cardType = card.cardType,
            cardNumber = card.cardNumber,
            facilityCode = card.facilityCode,
            status = card.status,
            issuedAt = card.issuedAt,
            expiresAt = card.expiresAt,
            lastUsedAt = card.lastUsedAt,
            notes = card.notes,
            isValid = card.isValid(),
            createdAt = card.createdAt,
            updatedAt = card.updatedAt
        )
    }
}

data class BiometricEnrollmentResponse(
    val id: UUID,
    val memberId: UUID,
    val biometricType: BiometricType,
    val fingerPosition: FingerPosition?,
    val templateQuality: Int?,
    val deviceId: UUID?,
    val enrolledAt: Instant,
    val status: BiometricStatus,
    val lastUsedAt: Instant?,
    val isValid: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(enrollment: BiometricEnrollment) = BiometricEnrollmentResponse(
            id = enrollment.id,
            memberId = enrollment.memberId,
            biometricType = enrollment.biometricType,
            fingerPosition = enrollment.fingerPosition,
            templateQuality = enrollment.templateQuality,
            deviceId = enrollment.deviceId,
            enrolledAt = enrollment.enrolledAt,
            status = enrollment.status,
            lastUsedAt = enrollment.lastUsedAt,
            isValid = enrollment.isValid(),
            createdAt = enrollment.createdAt,
            updatedAt = enrollment.updatedAt
        )
    }
}

data class AccessLogResponse(
    val id: UUID,
    val deviceId: UUID,
    val zoneId: UUID?,
    val memberId: UUID?,
    val accessMethod: AccessMethod,
    val cardId: UUID?,
    val biometricId: UUID?,
    val direction: AccessDirection,
    val result: AccessResult,
    val denialReason: DenialReason?,
    val confidenceScore: BigDecimal?,
    val timestamp: Instant
) {
    companion object {
        fun from(log: AccessLog) = AccessLogResponse(
            id = log.id,
            deviceId = log.deviceId,
            zoneId = log.zoneId,
            memberId = log.memberId,
            accessMethod = log.accessMethod,
            cardId = log.cardId,
            biometricId = log.biometricId,
            direction = log.direction,
            result = log.result,
            denialReason = log.denialReason,
            confidenceScore = log.confidenceScore,
            timestamp = log.timestamp
        )
    }
}

data class ZoneOccupancyResponse(
    val id: UUID,
    val zoneId: UUID,
    val currentCount: Int,
    val peakCountToday: Int,
    val peakTimeToday: Instant?,
    val lastEntryAt: Instant?,
    val lastExitAt: Instant?,
    val updatedAt: Instant
) {
    companion object {
        fun from(occupancy: ZoneOccupancy) = ZoneOccupancyResponse(
            id = occupancy.id,
            zoneId = occupancy.zoneId,
            currentCount = occupancy.currentCount,
            peakCountToday = occupancy.peakCountToday,
            peakTimeToday = occupancy.peakTimeToday,
            lastEntryAt = occupancy.lastEntryAt,
            lastExitAt = occupancy.lastExitAt,
            updatedAt = occupancy.updatedAt
        )
    }
}

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
