package com.liyaqa.equipment.api

import com.liyaqa.equipment.application.commands.*
import com.liyaqa.equipment.application.services.EquipmentService
import com.liyaqa.equipment.domain.model.EquipmentType
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.*

@RestController
@RequestMapping("/api/equipment")
@Tag(name = "Equipment", description = "Connected fitness equipment management")
class EquipmentController(
    private val equipmentService: EquipmentService
) {
    // ========== Providers ==========

    @GetMapping("/providers")
    @PreAuthorize("hasAuthority('equipment_view')")
    @Operation(summary = "List available equipment providers")
    fun listProviders(): ResponseEntity<List<EquipmentProviderResponse>> {
        val providers = equipmentService.listProviders()
        return ResponseEntity.ok(providers.map { EquipmentProviderResponse.from(it) })
    }

    @GetMapping("/providers/{id}")
    @PreAuthorize("hasAuthority('equipment_view')")
    @Operation(summary = "Get a provider")
    fun getProvider(@PathVariable id: UUID): ResponseEntity<EquipmentProviderResponse> {
        val provider = equipmentService.getProvider(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(EquipmentProviderResponse.from(provider))
    }

    // ========== Provider Configs ==========

    @GetMapping("/configs")
    @PreAuthorize("hasAuthority('equipment_config')")
    @Operation(summary = "List provider configurations")
    fun listConfigs(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<EquipmentProviderConfigResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"))
        val configsPage = equipmentService.listConfigs(pageable)
        return ResponseEntity.ok(PageResponse(
            content = configsPage.content.map { EquipmentProviderConfigResponse.from(it) },
            page = configsPage.number,
            size = configsPage.size,
            totalElements = configsPage.totalElements,
            totalPages = configsPage.totalPages,
            first = configsPage.isFirst,
            last = configsPage.isLast
        ))
    }

    @GetMapping("/configs/{id}")
    @PreAuthorize("hasAuthority('equipment_config')")
    @Operation(summary = "Get a provider configuration")
    fun getConfig(@PathVariable id: UUID): ResponseEntity<EquipmentProviderConfigResponse> {
        val config = equipmentService.getConfig(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(EquipmentProviderConfigResponse.from(config))
    }

    @PostMapping("/configs")
    @PreAuthorize("hasAuthority('equipment_config')")
    @Operation(summary = "Create a provider configuration")
    fun createConfig(
        @Valid @RequestBody request: CreateProviderConfigRequest
    ): ResponseEntity<EquipmentProviderConfigResponse> {
        val command = CreateProviderConfigCommand(
            providerId = request.providerId,
            apiKey = request.apiKey,
            apiSecret = request.apiSecret,
            oauthClientId = request.oauthClientId,
            oauthClientSecret = request.oauthClientSecret,
            webhookSecret = request.webhookSecret,
            customConfig = request.customConfig,
            syncIntervalMinutes = request.syncIntervalMinutes
        )
        val config = equipmentService.createConfig(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(EquipmentProviderConfigResponse.from(config))
    }

    @PutMapping("/configs/{id}")
    @PreAuthorize("hasAuthority('equipment_config')")
    @Operation(summary = "Update a provider configuration")
    fun updateConfig(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateProviderConfigRequest
    ): ResponseEntity<EquipmentProviderConfigResponse> {
        val command = UpdateProviderConfigCommand(
            apiKey = request.apiKey,
            apiSecret = request.apiSecret,
            oauthClientId = request.oauthClientId,
            oauthClientSecret = request.oauthClientSecret,
            webhookSecret = request.webhookSecret,
            customConfig = request.customConfig,
            isActive = request.isActive,
            syncEnabled = request.syncEnabled,
            syncIntervalMinutes = request.syncIntervalMinutes
        )
        val config = equipmentService.updateConfig(id, command)
        return ResponseEntity.ok(EquipmentProviderConfigResponse.from(config))
    }

    @DeleteMapping("/configs/{id}")
    @PreAuthorize("hasAuthority('equipment_config')")
    @Operation(summary = "Delete a provider configuration")
    fun deleteConfig(@PathVariable id: UUID): ResponseEntity<Void> {
        equipmentService.deleteConfig(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Equipment Units ==========

    @GetMapping("/units")
    @PreAuthorize("hasAuthority('equipment_view')")
    @Operation(summary = "List equipment units")
    fun listUnits(
        @RequestParam(required = false) locationId: UUID?,
        @RequestParam(required = false) type: EquipmentType?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<PageResponse<EquipmentUnitResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"))
        val unitsPage = when {
            locationId != null -> equipmentService.listUnitsByLocation(locationId, pageable)
            type != null -> equipmentService.listUnitsByType(type, pageable)
            else -> equipmentService.listUnits(pageable)
        }
        return ResponseEntity.ok(PageResponse(
            content = unitsPage.content.map { EquipmentUnitResponse.from(it) },
            page = unitsPage.number,
            size = unitsPage.size,
            totalElements = unitsPage.totalElements,
            totalPages = unitsPage.totalPages,
            first = unitsPage.isFirst,
            last = unitsPage.isLast
        ))
    }

    @GetMapping("/units/{id}")
    @PreAuthorize("hasAuthority('equipment_view')")
    @Operation(summary = "Get an equipment unit")
    fun getUnit(@PathVariable id: UUID): ResponseEntity<EquipmentUnitResponse> {
        val unit = equipmentService.getUnit(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(EquipmentUnitResponse.from(unit))
    }

    @PostMapping("/units")
    @PreAuthorize("hasAuthority('equipment_manage')")
    @Operation(summary = "Create an equipment unit")
    fun createUnit(
        @Valid @RequestBody request: CreateEquipmentUnitRequest
    ): ResponseEntity<EquipmentUnitResponse> {
        val command = CreateEquipmentUnitCommand(
            locationId = request.locationId,
            providerId = request.providerId,
            externalId = request.externalId,
            equipmentType = request.equipmentType,
            name = request.name,
            nameAr = request.nameAr,
            model = request.model,
            serialNumber = request.serialNumber,
            manufacturer = request.manufacturer,
            zone = request.zone,
            floorNumber = request.floorNumber,
            positionX = request.positionX,
            positionY = request.positionY,
            metadata = request.metadata
        )
        val unit = equipmentService.createUnit(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(EquipmentUnitResponse.from(unit))
    }

    @PutMapping("/units/{id}")
    @PreAuthorize("hasAuthority('equipment_manage')")
    @Operation(summary = "Update an equipment unit")
    fun updateUnit(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateEquipmentUnitRequest
    ): ResponseEntity<EquipmentUnitResponse> {
        val command = UpdateEquipmentUnitCommand(
            name = request.name,
            nameAr = request.nameAr,
            equipmentType = request.equipmentType,
            model = request.model,
            serialNumber = request.serialNumber,
            status = request.status,
            zone = request.zone,
            floorNumber = request.floorNumber,
            positionX = request.positionX,
            positionY = request.positionY,
            metadata = request.metadata
        )
        val unit = equipmentService.updateUnit(id, command)
        return ResponseEntity.ok(EquipmentUnitResponse.from(unit))
    }

    @PostMapping("/units/{id}/connected")
    @PreAuthorize("hasAuthority('equipment_manage')")
    @Operation(summary = "Mark equipment as connected")
    fun markConnected(@PathVariable id: UUID): ResponseEntity<EquipmentUnitResponse> {
        val unit = equipmentService.markUnitConnected(id)
        return ResponseEntity.ok(EquipmentUnitResponse.from(unit))
    }

    @PostMapping("/units/{id}/disconnected")
    @PreAuthorize("hasAuthority('equipment_manage')")
    @Operation(summary = "Mark equipment as disconnected")
    fun markDisconnected(@PathVariable id: UUID): ResponseEntity<EquipmentUnitResponse> {
        val unit = equipmentService.markUnitDisconnected(id)
        return ResponseEntity.ok(EquipmentUnitResponse.from(unit))
    }

    @DeleteMapping("/units/{id}")
    @PreAuthorize("hasAuthority('equipment_manage')")
    @Operation(summary = "Delete an equipment unit")
    fun deleteUnit(@PathVariable id: UUID): ResponseEntity<Void> {
        equipmentService.deleteUnit(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Workouts ==========

    @GetMapping("/workouts")
    @PreAuthorize("hasAuthority('equipment_view')")
    @Operation(summary = "List workouts")
    fun listWorkouts(
        @RequestParam(required = false) memberId: UUID?,
        @RequestParam(required = false) equipmentUnitId: UUID?,
        @RequestParam(required = false) startDate: Instant?,
        @RequestParam(required = false) endDate: Instant?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<PageResponse<EquipmentWorkoutResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"))
        val workoutsPage = when {
            memberId != null && startDate != null && endDate != null -> {
                val workouts = equipmentService.listMemberWorkoutsByDateRange(memberId, startDate, endDate)
                // Manual pagination for date range query
                val start = page * size
                val end = minOf(start + size, workouts.size)
                val content = if (start < workouts.size) workouts.subList(start, end) else emptyList()
                return ResponseEntity.ok(PageResponse(
                    content = content.map { EquipmentWorkoutResponse.from(it) },
                    page = page,
                    size = size,
                    totalElements = workouts.size.toLong(),
                    totalPages = (workouts.size + size - 1) / size,
                    first = page == 0,
                    last = end >= workouts.size
                ))
            }
            memberId != null -> equipmentService.listMemberWorkouts(memberId, pageable)
            equipmentUnitId != null -> equipmentService.listEquipmentWorkouts(equipmentUnitId, pageable)
            else -> equipmentService.listWorkouts(pageable)
        }
        return ResponseEntity.ok(PageResponse(
            content = workoutsPage.content.map { EquipmentWorkoutResponse.from(it) },
            page = workoutsPage.number,
            size = workoutsPage.size,
            totalElements = workoutsPage.totalElements,
            totalPages = workoutsPage.totalPages,
            first = workoutsPage.isFirst,
            last = workoutsPage.isLast
        ))
    }

    @GetMapping("/workouts/{id}")
    @PreAuthorize("hasAuthority('equipment_view')")
    @Operation(summary = "Get a workout")
    fun getWorkout(@PathVariable id: UUID): ResponseEntity<EquipmentWorkoutResponse> {
        val workout = equipmentService.getWorkout(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(EquipmentWorkoutResponse.from(workout))
    }

    @PostMapping("/workouts")
    @PreAuthorize("hasAuthority('equipment_manage')")
    @Operation(summary = "Create a workout (manual entry)")
    fun createWorkout(
        @Valid @RequestBody request: CreateWorkoutRequest
    ): ResponseEntity<EquipmentWorkoutResponse> {
        val command = CreateWorkoutCommand(
            memberId = request.memberId,
            providerId = request.providerId,
            equipmentUnitId = request.equipmentUnitId,
            externalWorkoutId = request.externalWorkoutId,
            workoutType = request.workoutType,
            equipmentType = request.equipmentType,
            startedAt = request.startedAt,
            endedAt = request.endedAt,
            durationSeconds = request.durationSeconds,
            distanceMeters = request.distanceMeters,
            steps = request.steps,
            floorsClimbed = request.floorsClimbed,
            caloriesTotal = request.caloriesTotal,
            caloriesActive = request.caloriesActive,
            avgHeartRate = request.avgHeartRate,
            maxHeartRate = request.maxHeartRate,
            heartRateZones = request.heartRateZones,
            avgPaceSecondsPerKm = request.avgPaceSecondsPerKm,
            avgSpeedKmh = request.avgSpeedKmh,
            maxSpeedKmh = request.maxSpeedKmh,
            avgPowerWatts = request.avgPowerWatts,
            maxPowerWatts = request.maxPowerWatts,
            avgCadence = request.avgCadence,
            totalReps = request.totalReps,
            totalSets = request.totalSets,
            totalWeightKg = request.totalWeightKg,
            exercises = request.exercises,
            rawData = request.rawData
        )
        val workout = equipmentService.createWorkout(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(EquipmentWorkoutResponse.from(workout))
    }

    @GetMapping("/members/{memberId}/stats")
    @PreAuthorize("hasAuthority('equipment_view')")
    @Operation(summary = "Get member workout stats")
    fun getMemberStats(@PathVariable memberId: UUID): ResponseEntity<WorkoutStatsResponse> {
        val stats = equipmentService.getMemberWorkoutStats(memberId)
        return ResponseEntity.ok(WorkoutStatsResponse.from(stats))
    }

    // ========== Member Profiles ==========

    @GetMapping("/members/{memberId}/profiles")
    @PreAuthorize("hasAuthority('equipment_view')")
    @Operation(summary = "Get member's equipment profiles")
    fun getMemberProfiles(@PathVariable memberId: UUID): ResponseEntity<List<MemberEquipmentProfileResponse>> {
        val profiles = equipmentService.getMemberProfiles(memberId)
        return ResponseEntity.ok(profiles.map { MemberEquipmentProfileResponse.from(it) })
    }

    @PostMapping("/profiles")
    @PreAuthorize("hasAuthority('equipment_manage')")
    @Operation(summary = "Create a member equipment profile")
    fun createMemberProfile(
        @Valid @RequestBody request: CreateMemberProfileRequest
    ): ResponseEntity<MemberEquipmentProfileResponse> {
        val command = CreateMemberProfileCommand(
            memberId = request.memberId,
            providerId = request.providerId,
            externalMemberId = request.externalMemberId,
            externalUsername = request.externalUsername
        )
        val profile = equipmentService.createMemberProfile(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(MemberEquipmentProfileResponse.from(profile))
    }

    @PutMapping("/profiles/{id}")
    @PreAuthorize("hasAuthority('equipment_manage')")
    @Operation(summary = "Update a member equipment profile")
    fun updateMemberProfile(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateMemberProfileRequest
    ): ResponseEntity<MemberEquipmentProfileResponse> {
        val command = UpdateMemberProfileCommand(
            externalMemberId = request.externalMemberId,
            externalUsername = request.externalUsername,
            syncEnabled = request.syncEnabled
        )
        val profile = equipmentService.updateMemberProfile(id, command)
        return ResponseEntity.ok(MemberEquipmentProfileResponse.from(profile))
    }

    @DeleteMapping("/profiles/{id}")
    @PreAuthorize("hasAuthority('equipment_manage')")
    @Operation(summary = "Delete a member equipment profile")
    fun deleteMemberProfile(@PathVariable id: UUID): ResponseEntity<Void> {
        equipmentService.deleteMemberProfile(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Sync Jobs ==========

    @PostMapping("/configs/{configId}/sync")
    @PreAuthorize("hasAuthority('equipment_sync')")
    @Operation(summary = "Start a sync job")
    fun startSync(
        @PathVariable configId: UUID,
        @Valid @RequestBody request: StartSyncRequest
    ): ResponseEntity<EquipmentSyncJobResponse> {
        val command = StartSyncJobCommand(
            providerConfigId = configId,
            jobType = request.jobType
        )
        val job = equipmentService.startSyncJob(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(EquipmentSyncJobResponse.from(job))
    }

    @GetMapping("/configs/{configId}/sync-jobs")
    @PreAuthorize("hasAuthority('equipment_config')")
    @Operation(summary = "List sync jobs for a config")
    fun listSyncJobs(
        @PathVariable configId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<EquipmentSyncJobResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val jobsPage = equipmentService.getSyncJobsForConfig(configId, pageable)
        return ResponseEntity.ok(PageResponse(
            content = jobsPage.content.map { EquipmentSyncJobResponse.from(it) },
            page = jobsPage.number,
            size = jobsPage.size,
            totalElements = jobsPage.totalElements,
            totalPages = jobsPage.totalPages,
            first = jobsPage.isFirst,
            last = jobsPage.isLast
        ))
    }
}
