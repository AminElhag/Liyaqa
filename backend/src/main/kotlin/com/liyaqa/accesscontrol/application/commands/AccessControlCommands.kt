package com.liyaqa.accesscontrol.application.commands

import com.liyaqa.accesscontrol.domain.model.*
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

// ========== Zone Commands ==========

data class CreateZoneCommand(
    val locationId: UUID,
    val name: String,
    val nameAr: String? = null,
    val zoneType: ZoneType,
    val maxOccupancy: Int? = null,
    val genderRestriction: GenderRestriction? = null,
    val requireSpecificPlans: List<UUID>? = null
)

data class UpdateZoneCommand(
    val name: String? = null,
    val nameAr: String? = null,
    val maxOccupancy: Int? = null,
    val genderRestriction: GenderRestriction? = null,
    val requireSpecificPlans: List<UUID>? = null,
    val isActive: Boolean? = null
)

// ========== Device Commands ==========

data class CreateDeviceCommand(
    val locationId: UUID,
    val deviceType: DeviceType,
    val deviceName: String,
    val deviceNameAr: String? = null,
    val manufacturer: String? = null,
    val model: String? = null,
    val serialNumber: String? = null,
    val ipAddress: String? = null,
    val apiEndpoint: String? = null,
    val apiKey: String? = null,
    val zoneId: UUID? = null,
    val direction: DeviceDirection,
    val config: Map<String, Any>? = null
)

data class UpdateDeviceCommand(
    val deviceName: String? = null,
    val deviceNameAr: String? = null,
    val ipAddress: String? = null,
    val apiEndpoint: String? = null,
    val apiKey: String? = null,
    val zoneId: UUID? = null,
    val direction: DeviceDirection? = null,
    val status: DeviceStatus? = null,
    val config: Map<String, Any>? = null
)

// ========== Time Rule Commands ==========

data class CreateTimeRuleCommand(
    val zoneId: UUID? = null,
    val planId: UUID? = null,
    val memberId: UUID? = null,
    val name: String,
    val nameAr: String? = null,
    val dayOfWeek: Int? = null,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val accessType: AccessRuleType,
    val priority: Int = 0,
    val validFrom: LocalDate? = null,
    val validUntil: LocalDate? = null
)

data class UpdateTimeRuleCommand(
    val name: String? = null,
    val nameAr: String? = null,
    val dayOfWeek: Int? = null,
    val startTime: LocalTime? = null,
    val endTime: LocalTime? = null,
    val accessType: AccessRuleType? = null,
    val priority: Int? = null,
    val isActive: Boolean? = null,
    val validFrom: LocalDate? = null,
    val validUntil: LocalDate? = null
)

// ========== Card Commands ==========

data class IssueCardCommand(
    val memberId: UUID,
    val cardType: CardType,
    val cardNumber: String,
    val facilityCode: String? = null,
    val expiresAt: Instant? = null,
    val notes: String? = null
)

data class UpdateCardCommand(
    val expiresAt: Instant? = null,
    val notes: String? = null
)

// ========== Biometric Commands ==========

data class EnrollBiometricCommand(
    val memberId: UUID,
    val biometricType: BiometricType,
    val fingerPosition: FingerPosition? = null,
    val templateData: String,
    val templateQuality: Int? = null,
    val deviceId: UUID? = null
)

// ========== Access Request Commands ==========

data class ProcessAccessRequestCommand(
    val deviceId: UUID,
    val accessMethod: AccessMethod,
    val direction: AccessDirection,
    val credential: String, // Card number or biometric ID
    val confidenceScore: Double? = null // For biometric
)
