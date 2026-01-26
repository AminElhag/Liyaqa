package com.liyaqa.accesscontrol.api

import com.liyaqa.accesscontrol.application.commands.*
import com.liyaqa.accesscontrol.application.services.*
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/access-control")
@Tag(name = "Access Control", description = "Access control device and zone management")
class AccessControlController(
    private val accessControlService: AccessControlService,
    private val cardManagementService: CardManagementService,
    private val biometricService: BiometricService,
    private val timeRuleService: TimeRuleService
) {
    // ========== Zones ==========

    @PostMapping("/zones")
    @PreAuthorize("hasAuthority('access_control_manage')")
    @Operation(summary = "Create an access zone")
    fun createZone(@Valid @RequestBody request: CreateZoneRequest): ResponseEntity<AccessZoneResponse> {
        val command = CreateZoneCommand(
            locationId = request.locationId,
            name = request.name,
            nameAr = request.nameAr,
            zoneType = request.zoneType,
            maxOccupancy = request.maxOccupancy,
            genderRestriction = request.genderRestriction,
            requireSpecificPlans = request.requireSpecificPlans
        )
        val zone = accessControlService.createZone(command)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(AccessZoneResponse.from(zone, request.requireSpecificPlans))
    }

    @GetMapping("/zones")
    @PreAuthorize("hasAuthority('access_control_view')")
    @Operation(summary = "List access zones")
    fun listZones(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<AccessZoneResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"))
        val zonesPage = accessControlService.listZones(pageable)
        return ResponseEntity.ok(PageResponse(
            content = zonesPage.content.map { AccessZoneResponse.from(it) },
            page = zonesPage.number,
            size = zonesPage.size,
            totalElements = zonesPage.totalElements,
            totalPages = zonesPage.totalPages,
            first = zonesPage.isFirst,
            last = zonesPage.isLast
        ))
    }

    @GetMapping("/zones/{id}")
    @PreAuthorize("hasAuthority('access_control_view')")
    @Operation(summary = "Get an access zone")
    fun getZone(@PathVariable id: UUID): ResponseEntity<AccessZoneResponse> {
        val zone = accessControlService.getZone(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(AccessZoneResponse.from(zone))
    }

    @GetMapping("/zones/location/{locationId}")
    @PreAuthorize("hasAuthority('access_control_view')")
    @Operation(summary = "Get zones by location")
    fun getZonesByLocation(@PathVariable locationId: UUID): ResponseEntity<List<AccessZoneResponse>> {
        val zones = accessControlService.listZonesByLocation(locationId)
        return ResponseEntity.ok(zones.map { AccessZoneResponse.from(it) })
    }

    @PutMapping("/zones/{id}")
    @PreAuthorize("hasAuthority('access_control_manage')")
    @Operation(summary = "Update an access zone")
    fun updateZone(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateZoneRequest
    ): ResponseEntity<AccessZoneResponse> {
        val command = UpdateZoneCommand(
            name = request.name,
            nameAr = request.nameAr,
            maxOccupancy = request.maxOccupancy,
            genderRestriction = request.genderRestriction,
            requireSpecificPlans = request.requireSpecificPlans,
            isActive = request.isActive
        )
        val zone = accessControlService.updateZone(id, command)
        return ResponseEntity.ok(AccessZoneResponse.from(zone, request.requireSpecificPlans))
    }

    @DeleteMapping("/zones/{id}")
    @PreAuthorize("hasAuthority('access_control_manage')")
    @Operation(summary = "Delete an access zone")
    fun deleteZone(@PathVariable id: UUID): ResponseEntity<Void> {
        accessControlService.deleteZone(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Devices ==========

    @PostMapping("/devices")
    @PreAuthorize("hasAuthority('access_control_manage')")
    @Operation(summary = "Create an access device")
    fun createDevice(@Valid @RequestBody request: CreateDeviceRequest): ResponseEntity<AccessDeviceResponse> {
        val command = CreateDeviceCommand(
            locationId = request.locationId,
            deviceType = request.deviceType,
            deviceName = request.deviceName,
            deviceNameAr = request.deviceNameAr,
            manufacturer = request.manufacturer,
            model = request.model,
            serialNumber = request.serialNumber,
            ipAddress = request.ipAddress,
            apiEndpoint = request.apiEndpoint,
            apiKey = request.apiKey,
            zoneId = request.zoneId,
            direction = request.direction,
            config = request.config
        )
        val device = accessControlService.createDevice(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(AccessDeviceResponse.from(device))
    }

    @GetMapping("/devices")
    @PreAuthorize("hasAuthority('access_control_view')")
    @Operation(summary = "List access devices")
    fun listDevices(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<AccessDeviceResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "deviceName"))
        val devicesPage = accessControlService.listDevices(pageable)
        return ResponseEntity.ok(PageResponse(
            content = devicesPage.content.map { AccessDeviceResponse.from(it) },
            page = devicesPage.number,
            size = devicesPage.size,
            totalElements = devicesPage.totalElements,
            totalPages = devicesPage.totalPages,
            first = devicesPage.isFirst,
            last = devicesPage.isLast
        ))
    }

    @GetMapping("/devices/{id}")
    @PreAuthorize("hasAuthority('access_control_view')")
    @Operation(summary = "Get an access device")
    fun getDevice(@PathVariable id: UUID): ResponseEntity<AccessDeviceResponse> {
        val device = accessControlService.getDevice(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(AccessDeviceResponse.from(device))
    }

    @PutMapping("/devices/{id}")
    @PreAuthorize("hasAuthority('access_control_manage')")
    @Operation(summary = "Update an access device")
    fun updateDevice(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateDeviceRequest
    ): ResponseEntity<AccessDeviceResponse> {
        val command = UpdateDeviceCommand(
            deviceName = request.deviceName,
            deviceNameAr = request.deviceNameAr,
            ipAddress = request.ipAddress,
            apiEndpoint = request.apiEndpoint,
            apiKey = request.apiKey,
            zoneId = request.zoneId,
            direction = request.direction,
            status = request.status,
            config = request.config
        )
        val device = accessControlService.updateDevice(id, command)
        return ResponseEntity.ok(AccessDeviceResponse.from(device))
    }

    @PostMapping("/devices/{id}/heartbeat")
    @Operation(summary = "Update device heartbeat")
    fun updateHeartbeat(@PathVariable id: UUID): ResponseEntity<Void> {
        accessControlService.updateDeviceHeartbeat(id)
        return ResponseEntity.ok().build()
    }

    @DeleteMapping("/devices/{id}")
    @PreAuthorize("hasAuthority('access_control_manage')")
    @Operation(summary = "Delete an access device")
    fun deleteDevice(@PathVariable id: UUID): ResponseEntity<Void> {
        accessControlService.deleteDevice(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Time Rules ==========

    @PostMapping("/rules")
    @PreAuthorize("hasAuthority('access_control_manage')")
    @Operation(summary = "Create a time rule")
    fun createRule(@Valid @RequestBody request: CreateTimeRuleRequest): ResponseEntity<AccessTimeRuleResponse> {
        val command = CreateTimeRuleCommand(
            zoneId = request.zoneId,
            planId = request.planId,
            memberId = request.memberId,
            name = request.name,
            nameAr = request.nameAr,
            dayOfWeek = request.dayOfWeek,
            startTime = request.startTime,
            endTime = request.endTime,
            accessType = request.accessType,
            priority = request.priority,
            validFrom = request.validFrom,
            validUntil = request.validUntil
        )
        val rule = timeRuleService.createRule(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(AccessTimeRuleResponse.from(rule))
    }

    @GetMapping("/rules")
    @PreAuthorize("hasAuthority('access_control_view')")
    @Operation(summary = "List time rules")
    fun listRules(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<AccessTimeRuleResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "priority"))
        val rulesPage = timeRuleService.listRules(pageable)
        return ResponseEntity.ok(PageResponse(
            content = rulesPage.content.map { AccessTimeRuleResponse.from(it) },
            page = rulesPage.number,
            size = rulesPage.size,
            totalElements = rulesPage.totalElements,
            totalPages = rulesPage.totalPages,
            first = rulesPage.isFirst,
            last = rulesPage.isLast
        ))
    }

    @GetMapping("/rules/{id}")
    @PreAuthorize("hasAuthority('access_control_view')")
    @Operation(summary = "Get a time rule")
    fun getRule(@PathVariable id: UUID): ResponseEntity<AccessTimeRuleResponse> {
        val rule = timeRuleService.getRule(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(AccessTimeRuleResponse.from(rule))
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasAuthority('access_control_manage')")
    @Operation(summary = "Update a time rule")
    fun updateRule(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTimeRuleRequest
    ): ResponseEntity<AccessTimeRuleResponse> {
        val command = UpdateTimeRuleCommand(
            name = request.name,
            nameAr = request.nameAr,
            dayOfWeek = request.dayOfWeek,
            startTime = request.startTime,
            endTime = request.endTime,
            accessType = request.accessType,
            priority = request.priority,
            isActive = request.isActive,
            validFrom = request.validFrom,
            validUntil = request.validUntil
        )
        val rule = timeRuleService.updateRule(id, command)
        return ResponseEntity.ok(AccessTimeRuleResponse.from(rule))
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasAuthority('access_control_manage')")
    @Operation(summary = "Delete a time rule")
    fun deleteRule(@PathVariable id: UUID): ResponseEntity<Void> {
        timeRuleService.deleteRule(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Cards ==========

    @PostMapping("/cards")
    @PreAuthorize("hasAuthority('access_cards_manage')")
    @Operation(summary = "Issue an access card")
    fun issueCard(@Valid @RequestBody request: IssueCardRequest): ResponseEntity<MemberAccessCardResponse> {
        val command = IssueCardCommand(
            memberId = request.memberId,
            cardType = request.cardType,
            cardNumber = request.cardNumber,
            facilityCode = request.facilityCode,
            expiresAt = request.expiresAt,
            notes = request.notes
        )
        val card = cardManagementService.issueCard(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(MemberAccessCardResponse.from(card))
    }

    @GetMapping("/cards")
    @PreAuthorize("hasAuthority('access_cards_view')")
    @Operation(summary = "List access cards")
    fun listCards(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<MemberAccessCardResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "issuedAt"))
        val cardsPage = cardManagementService.listCards(pageable)
        return ResponseEntity.ok(PageResponse(
            content = cardsPage.content.map { MemberAccessCardResponse.from(it) },
            page = cardsPage.number,
            size = cardsPage.size,
            totalElements = cardsPage.totalElements,
            totalPages = cardsPage.totalPages,
            first = cardsPage.isFirst,
            last = cardsPage.isLast
        ))
    }

    @GetMapping("/cards/{id}")
    @PreAuthorize("hasAuthority('access_cards_view')")
    @Operation(summary = "Get an access card")
    fun getCard(@PathVariable id: UUID): ResponseEntity<MemberAccessCardResponse> {
        val card = cardManagementService.getCard(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(MemberAccessCardResponse.from(card))
    }

    @GetMapping("/cards/member/{memberId}")
    @PreAuthorize("hasAuthority('access_cards_view')")
    @Operation(summary = "Get cards by member")
    fun getCardsByMember(@PathVariable memberId: UUID): ResponseEntity<List<MemberAccessCardResponse>> {
        val cards = cardManagementService.getCardsByMember(memberId)
        return ResponseEntity.ok(cards.map { MemberAccessCardResponse.from(it) })
    }

    @PutMapping("/cards/{id}")
    @PreAuthorize("hasAuthority('access_cards_manage')")
    @Operation(summary = "Update an access card")
    fun updateCard(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateCardRequest
    ): ResponseEntity<MemberAccessCardResponse> {
        val command = UpdateCardCommand(expiresAt = request.expiresAt, notes = request.notes)
        val card = cardManagementService.updateCard(id, command)
        return ResponseEntity.ok(MemberAccessCardResponse.from(card))
    }

    @PostMapping("/cards/{id}/suspend")
    @PreAuthorize("hasAuthority('access_cards_manage')")
    @Operation(summary = "Suspend a card")
    fun suspendCard(@PathVariable id: UUID): ResponseEntity<MemberAccessCardResponse> {
        val card = cardManagementService.suspendCard(id)
        return ResponseEntity.ok(MemberAccessCardResponse.from(card))
    }

    @PostMapping("/cards/{id}/reactivate")
    @PreAuthorize("hasAuthority('access_cards_manage')")
    @Operation(summary = "Reactivate a card")
    fun reactivateCard(@PathVariable id: UUID): ResponseEntity<MemberAccessCardResponse> {
        val card = cardManagementService.reactivateCard(id)
        return ResponseEntity.ok(MemberAccessCardResponse.from(card))
    }

    @PostMapping("/cards/{id}/lost")
    @PreAuthorize("hasAuthority('access_cards_manage')")
    @Operation(summary = "Report card lost")
    fun reportCardLost(@PathVariable id: UUID): ResponseEntity<MemberAccessCardResponse> {
        val card = cardManagementService.reportCardLost(id)
        return ResponseEntity.ok(MemberAccessCardResponse.from(card))
    }

    @DeleteMapping("/cards/{id}")
    @PreAuthorize("hasAuthority('access_cards_manage')")
    @Operation(summary = "Delete a card")
    fun deleteCard(@PathVariable id: UUID): ResponseEntity<Void> {
        cardManagementService.deleteCard(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Biometrics ==========

    @PostMapping("/biometrics")
    @PreAuthorize("hasAuthority('biometrics_manage')")
    @Operation(summary = "Enroll biometric")
    fun enrollBiometric(@Valid @RequestBody request: EnrollBiometricRequest): ResponseEntity<BiometricEnrollmentResponse> {
        val command = EnrollBiometricCommand(
            memberId = request.memberId,
            biometricType = request.biometricType,
            fingerPosition = request.fingerPosition,
            templateData = request.templateData,
            templateQuality = request.templateQuality,
            deviceId = request.deviceId
        )
        val enrollment = biometricService.enrollBiometric(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(BiometricEnrollmentResponse.from(enrollment))
    }

    @GetMapping("/biometrics")
    @PreAuthorize("hasAuthority('biometrics_view')")
    @Operation(summary = "List biometric enrollments")
    fun listBiometrics(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<BiometricEnrollmentResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "enrolledAt"))
        val enrollmentsPage = biometricService.listEnrollments(pageable)
        return ResponseEntity.ok(PageResponse(
            content = enrollmentsPage.content.map { BiometricEnrollmentResponse.from(it) },
            page = enrollmentsPage.number,
            size = enrollmentsPage.size,
            totalElements = enrollmentsPage.totalElements,
            totalPages = enrollmentsPage.totalPages,
            first = enrollmentsPage.isFirst,
            last = enrollmentsPage.isLast
        ))
    }

    @GetMapping("/biometrics/{id}")
    @PreAuthorize("hasAuthority('biometrics_view')")
    @Operation(summary = "Get biometric enrollment")
    fun getBiometric(@PathVariable id: UUID): ResponseEntity<BiometricEnrollmentResponse> {
        val enrollment = biometricService.getEnrollment(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(BiometricEnrollmentResponse.from(enrollment))
    }

    @GetMapping("/biometrics/member/{memberId}")
    @PreAuthorize("hasAuthority('biometrics_view')")
    @Operation(summary = "Get biometrics by member")
    fun getBiometricsByMember(@PathVariable memberId: UUID): ResponseEntity<List<BiometricEnrollmentResponse>> {
        val enrollments = biometricService.getEnrollmentsByMember(memberId)
        return ResponseEntity.ok(enrollments.map { BiometricEnrollmentResponse.from(it) })
    }

    @PostMapping("/biometrics/{id}/suspend")
    @PreAuthorize("hasAuthority('biometrics_manage')")
    @Operation(summary = "Suspend biometric")
    fun suspendBiometric(@PathVariable id: UUID): ResponseEntity<BiometricEnrollmentResponse> {
        val enrollment = biometricService.suspendEnrollment(id)
        return ResponseEntity.ok(BiometricEnrollmentResponse.from(enrollment))
    }

    @PostMapping("/biometrics/{id}/reactivate")
    @PreAuthorize("hasAuthority('biometrics_manage')")
    @Operation(summary = "Reactivate biometric")
    fun reactivateBiometric(@PathVariable id: UUID): ResponseEntity<BiometricEnrollmentResponse> {
        val enrollment = biometricService.reactivateEnrollment(id)
        return ResponseEntity.ok(BiometricEnrollmentResponse.from(enrollment))
    }

    @DeleteMapping("/biometrics/{id}")
    @PreAuthorize("hasAuthority('biometrics_manage')")
    @Operation(summary = "Delete biometric enrollment")
    fun deleteBiometric(@PathVariable id: UUID): ResponseEntity<Void> {
        biometricService.deleteEnrollment(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Access Processing ==========

    @PostMapping("/access")
    @Operation(summary = "Process access request")
    fun processAccess(@Valid @RequestBody request: ProcessAccessRequest): ResponseEntity<AccessLogResponse> {
        val command = ProcessAccessRequestCommand(
            deviceId = request.deviceId,
            accessMethod = request.accessMethod,
            direction = request.direction,
            credential = request.credential,
            confidenceScore = request.confidenceScore
        )
        val log = accessControlService.processAccessRequest(command)
        return ResponseEntity.ok(AccessLogResponse.from(log))
    }

    // ========== Access Logs ==========

    @GetMapping("/logs")
    @PreAuthorize("hasAuthority('access_logs_view')")
    @Operation(summary = "List access logs")
    fun listLogs(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<PageResponse<AccessLogResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"))
        val logsPage = accessControlService.getAccessLogs(pageable)
        return ResponseEntity.ok(PageResponse(
            content = logsPage.content.map { AccessLogResponse.from(it) },
            page = logsPage.number,
            size = logsPage.size,
            totalElements = logsPage.totalElements,
            totalPages = logsPage.totalPages,
            first = logsPage.isFirst,
            last = logsPage.isLast
        ))
    }

    @GetMapping("/logs/member/{memberId}")
    @PreAuthorize("hasAuthority('access_logs_view')")
    @Operation(summary = "Get logs by member")
    fun getLogsByMember(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<PageResponse<AccessLogResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"))
        val logsPage = accessControlService.getAccessLogsByMember(memberId, pageable)
        return ResponseEntity.ok(PageResponse(
            content = logsPage.content.map { AccessLogResponse.from(it) },
            page = logsPage.number,
            size = logsPage.size,
            totalElements = logsPage.totalElements,
            totalPages = logsPage.totalPages,
            first = logsPage.isFirst,
            last = logsPage.isLast
        ))
    }

    // ========== Occupancy ==========

    @GetMapping("/occupancy")
    @PreAuthorize("hasAuthority('occupancy_view')")
    @Operation(summary = "Get all zone occupancies")
    fun getAllOccupancies(): ResponseEntity<List<ZoneOccupancyResponse>> {
        val occupancies = accessControlService.getAllOccupancies()
        return ResponseEntity.ok(occupancies.map { ZoneOccupancyResponse.from(it) })
    }

    @GetMapping("/occupancy/zone/{zoneId}")
    @PreAuthorize("hasAuthority('occupancy_view')")
    @Operation(summary = "Get zone occupancy")
    fun getZoneOccupancy(@PathVariable zoneId: UUID): ResponseEntity<ZoneOccupancyResponse> {
        val occupancy = accessControlService.getZoneOccupancy(zoneId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ZoneOccupancyResponse.from(occupancy))
    }
}
