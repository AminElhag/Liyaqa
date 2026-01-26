package com.liyaqa.wearables.api

import com.liyaqa.wearables.application.commands.*
import com.liyaqa.wearables.application.services.WearableService
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
import java.time.LocalDate
import java.util.*

@RestController
@RequestMapping("/api/wearables")
@Tag(name = "Wearables", description = "Wearable device integration management")
class WearableController(
    private val wearableService: WearableService
) {
    // ========== Platforms ==========

    @GetMapping("/platforms")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "List available wearable platforms")
    fun listPlatforms(): ResponseEntity<List<WearablePlatformResponse>> {
        val platforms = wearableService.listPlatforms()
        return ResponseEntity.ok(platforms.map { WearablePlatformResponse.from(it) })
    }

    @GetMapping("/platforms/{id}")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get a wearable platform")
    fun getPlatform(@PathVariable id: UUID): ResponseEntity<WearablePlatformResponse> {
        val platform = wearableService.getPlatform(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(WearablePlatformResponse.from(platform))
    }

    // ========== Connections ==========

    @GetMapping("/connections")
    @PreAuthorize("hasAuthority('wearable_view')")
    @Operation(summary = "List all wearable connections (admin)")
    fun listConnections(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<MemberWearableConnectionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val connectionsPage = wearableService.listConnections(pageable)
        return ResponseEntity.ok(PageResponse(
            content = connectionsPage.content.map { MemberWearableConnectionResponse.from(it) },
            page = connectionsPage.number,
            size = connectionsPage.size,
            totalElements = connectionsPage.totalElements,
            totalPages = connectionsPage.totalPages,
            first = connectionsPage.isFirst,
            last = connectionsPage.isLast
        ))
    }

    @GetMapping("/members/{memberId}/connections")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get member's wearable connections")
    fun getMemberConnections(@PathVariable memberId: UUID): ResponseEntity<List<MemberWearableConnectionResponse>> {
        val connections = wearableService.getMemberConnections(memberId)
        return ResponseEntity.ok(connections.map { MemberWearableConnectionResponse.from(it) })
    }

    @GetMapping("/connections/{id}")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get a wearable connection")
    fun getConnection(@PathVariable id: UUID): ResponseEntity<MemberWearableConnectionResponse> {
        val connection = wearableService.getConnection(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(MemberWearableConnectionResponse.from(connection))
    }

    @PostMapping("/connections")
    @PreAuthorize("hasAuthority('wearable_manage') or hasAuthority('member_portal')")
    @Operation(summary = "Create a wearable connection")
    fun createConnection(
        @Valid @RequestBody request: CreateConnectionRequest
    ): ResponseEntity<MemberWearableConnectionResponse> {
        val command = CreateConnectionCommand(
            memberId = request.memberId,
            platformId = request.platformId,
            externalUserId = request.externalUserId,
            externalUsername = request.externalUsername
        )
        val connection = wearableService.createConnection(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(MemberWearableConnectionResponse.from(connection))
    }

    @PutMapping("/connections/{id}")
    @PreAuthorize("hasAuthority('wearable_manage') or hasAuthority('member_portal')")
    @Operation(summary = "Update a wearable connection")
    fun updateConnection(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateConnectionRequest
    ): ResponseEntity<MemberWearableConnectionResponse> {
        val command = UpdateConnectionCommand(
            externalUserId = request.externalUserId,
            externalUsername = request.externalUsername,
            syncEnabled = request.syncEnabled
        )
        val connection = wearableService.updateConnection(id, command)
        return ResponseEntity.ok(MemberWearableConnectionResponse.from(connection))
    }

    @PostMapping("/connections/{id}/tokens")
    @PreAuthorize("hasAuthority('wearable_manage') or hasAuthority('member_portal')")
    @Operation(summary = "Update connection OAuth tokens")
    fun updateConnectionTokens(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateConnectionTokensRequest
    ): ResponseEntity<MemberWearableConnectionResponse> {
        val command = UpdateConnectionTokensCommand(
            accessToken = request.accessToken,
            refreshToken = request.refreshToken,
            expiresAt = request.expiresAt
        )
        val connection = wearableService.updateConnectionTokens(id, command)
        return ResponseEntity.ok(MemberWearableConnectionResponse.from(connection))
    }

    @PostMapping("/connections/{id}/disconnect")
    @PreAuthorize("hasAuthority('wearable_manage') or hasAuthority('member_portal')")
    @Operation(summary = "Disconnect a wearable (clear tokens)")
    fun disconnectConnection(@PathVariable id: UUID): ResponseEntity<MemberWearableConnectionResponse> {
        val connection = wearableService.disconnectConnection(id)
        return ResponseEntity.ok(MemberWearableConnectionResponse.from(connection))
    }

    @DeleteMapping("/connections/{id}")
    @PreAuthorize("hasAuthority('wearable_manage') or hasAuthority('member_portal')")
    @Operation(summary = "Delete a wearable connection")
    fun deleteConnection(@PathVariable id: UUID): ResponseEntity<Void> {
        wearableService.deleteConnection(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Daily Activities ==========

    @GetMapping("/members/{memberId}/activities")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get member's daily activities")
    fun getMemberActivities(
        @PathVariable memberId: UUID,
        @RequestParam(required = false) startDate: LocalDate?,
        @RequestParam(required = false) endDate: LocalDate?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "30") size: Int
    ): ResponseEntity<*> {
        return if (startDate != null && endDate != null) {
            val activities = wearableService.getMemberActivitiesByDateRange(memberId, startDate, endDate)
            ResponseEntity.ok(activities.map { WearableDailyActivityResponse.from(it) })
        } else {
            val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "activityDate"))
            val activitiesPage = wearableService.listMemberActivities(memberId, pageable)
            ResponseEntity.ok(PageResponse(
                content = activitiesPage.content.map { WearableDailyActivityResponse.from(it) },
                page = activitiesPage.number,
                size = activitiesPage.size,
                totalElements = activitiesPage.totalElements,
                totalPages = activitiesPage.totalPages,
                first = activitiesPage.isFirst,
                last = activitiesPage.isLast
            ))
        }
    }

    @GetMapping("/activities/{id}")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get a daily activity")
    fun getActivity(@PathVariable id: UUID): ResponseEntity<WearableDailyActivityResponse> {
        val activity = wearableService.getActivity(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(WearableDailyActivityResponse.from(activity))
    }

    @GetMapping("/members/{memberId}/activities/latest")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get member's latest activity")
    fun getLatestActivity(@PathVariable memberId: UUID): ResponseEntity<WearableDailyActivityResponse> {
        val activity = wearableService.getLatestActivity(memberId) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(WearableDailyActivityResponse.from(activity))
    }

    @PostMapping("/activities")
    @PreAuthorize("hasAuthority('wearable_manage')")
    @Operation(summary = "Create a daily activity (manual or sync)")
    fun createActivity(
        @Valid @RequestBody request: CreateDailyActivityRequest
    ): ResponseEntity<WearableDailyActivityResponse> {
        val command = CreateDailyActivityCommand(
            memberId = request.memberId,
            connectionId = request.connectionId,
            activityDate = request.activityDate,
            steps = request.steps,
            distanceMeters = request.distanceMeters,
            floorsClimbed = request.floorsClimbed,
            caloriesTotal = request.caloriesTotal,
            caloriesActive = request.caloriesActive,
            activeMinutes = request.activeMinutes,
            sedentaryMinutes = request.sedentaryMinutes,
            sleepMinutes = request.sleepMinutes,
            sleepQualityScore = request.sleepQualityScore,
            restingHeartRate = request.restingHeartRate,
            hrvAverage = request.hrvAverage,
            stressScore = request.stressScore,
            recoveryScore = request.recoveryScore,
            rawData = request.rawData
        )
        val activity = wearableService.createOrUpdateDailyActivity(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(WearableDailyActivityResponse.from(activity))
    }

    // ========== Workouts ==========

    @GetMapping("/members/{memberId}/workouts")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get member's wearable workouts")
    fun getMemberWorkouts(
        @PathVariable memberId: UUID,
        @RequestParam(required = false) startDate: Instant?,
        @RequestParam(required = false) endDate: Instant?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<*> {
        return if (startDate != null && endDate != null) {
            val workouts = wearableService.getMemberWorkoutsByDateRange(memberId, startDate, endDate)
            ResponseEntity.ok(workouts.map { WearableWorkoutResponse.from(it) })
        } else {
            val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"))
            val workoutsPage = wearableService.listMemberWorkouts(memberId, pageable)
            ResponseEntity.ok(PageResponse(
                content = workoutsPage.content.map { WearableWorkoutResponse.from(it) },
                page = workoutsPage.number,
                size = workoutsPage.size,
                totalElements = workoutsPage.totalElements,
                totalPages = workoutsPage.totalPages,
                first = workoutsPage.isFirst,
                last = workoutsPage.isLast
            ))
        }
    }

    @GetMapping("/workouts/{id}")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get a wearable workout")
    fun getWorkout(@PathVariable id: UUID): ResponseEntity<WearableWorkoutResponse> {
        val workout = wearableService.getWorkout(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(WearableWorkoutResponse.from(workout))
    }

    @PostMapping("/workouts")
    @PreAuthorize("hasAuthority('wearable_manage')")
    @Operation(summary = "Create a wearable workout (manual or sync)")
    fun createWorkout(
        @Valid @RequestBody request: CreateWearableWorkoutRequest
    ): ResponseEntity<WearableWorkoutResponse> {
        val command = CreateWorkoutCommand(
            memberId = request.memberId,
            connectionId = request.connectionId,
            externalWorkoutId = request.externalWorkoutId,
            activityType = request.activityType,
            activityName = request.activityName,
            startedAt = request.startedAt,
            endedAt = request.endedAt,
            durationSeconds = request.durationSeconds,
            distanceMeters = request.distanceMeters,
            caloriesBurned = request.caloriesBurned,
            avgHeartRate = request.avgHeartRate,
            maxHeartRate = request.maxHeartRate,
            avgPaceSecondsPerKm = request.avgPaceSecondsPerKm,
            elevationGainMeters = request.elevationGainMeters,
            steps = request.steps,
            rawData = request.rawData
        )
        val workout = wearableService.createWorkout(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(WearableWorkoutResponse.from(workout))
    }

    // ========== Stats ==========

    @GetMapping("/members/{memberId}/stats/workouts")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get member's workout stats")
    fun getMemberWorkoutStats(@PathVariable memberId: UUID): ResponseEntity<WearableWorkoutStatsResponse> {
        val stats = wearableService.getMemberWorkoutStats(memberId)
        return ResponseEntity.ok(WearableWorkoutStatsResponse.from(stats))
    }

    @GetMapping("/members/{memberId}/stats/activities")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get member's activity stats")
    fun getMemberActivityStats(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "30") days: Int
    ): ResponseEntity<WearableActivityStatsResponse> {
        val stats = wearableService.getMemberActivityStats(memberId, days)
        return ResponseEntity.ok(WearableActivityStatsResponse.from(stats))
    }

    // ========== Sync Jobs ==========

    @PostMapping("/connections/{connectionId}/sync")
    @PreAuthorize("hasAuthority('wearable_sync') or hasAuthority('member_portal')")
    @Operation(summary = "Start a sync job for a connection")
    fun startSync(
        @PathVariable connectionId: UUID,
        @Valid @RequestBody request: StartSyncRequest
    ): ResponseEntity<WearableSyncJobResponse> {
        val command = StartSyncJobCommand(
            connectionId = connectionId,
            jobType = request.jobType
        )
        val job = wearableService.startSyncJob(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(WearableSyncJobResponse.from(job))
    }

    @GetMapping("/connections/{connectionId}/sync-jobs")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get sync jobs for a connection")
    fun getSyncJobs(
        @PathVariable connectionId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<WearableSyncJobResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val jobsPage = wearableService.getSyncJobsForConnection(connectionId, pageable)
        return ResponseEntity.ok(PageResponse(
            content = jobsPage.content.map { WearableSyncJobResponse.from(it) },
            page = jobsPage.number,
            size = jobsPage.size,
            totalElements = jobsPage.totalElements,
            totalPages = jobsPage.totalPages,
            first = jobsPage.isFirst,
            last = jobsPage.isLast
        ))
    }

    @GetMapping("/sync-jobs/{id}")
    @PreAuthorize("hasAuthority('wearable_view') or hasAuthority('member_portal')")
    @Operation(summary = "Get a sync job")
    fun getSyncJob(@PathVariable id: UUID): ResponseEntity<WearableSyncJobResponse> {
        val job = wearableService.getSyncJob(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(WearableSyncJobResponse.from(job))
    }
}
