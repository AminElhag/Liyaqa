package com.liyaqa.membership.api

import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.membership.application.services.ActivityService
import com.liyaqa.membership.domain.model.ActivityType
import com.liyaqa.shared.api.PageResponse
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api")
class MemberActivityController(
    private val activityService: ActivityService,
    private val userRepository: UserRepository
) {

    /**
     * Get activity timeline for a member.
     */
    @GetMapping("/members/{memberId}/activities")
    @PreAuthorize("hasAnyAuthority('members_view', 'activities_view')")
    fun getActivityTimeline(
        @PathVariable memberId: UUID,
        @RequestParam types: List<ActivityType>?,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?,
        @PageableDefault(size = 20, sort = ["createdAt"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<PageResponse<MemberActivityResponse>> {
        val page = activityService.getActivityTimeline(
            memberId = memberId,
            types = types?.takeIf { it.isNotEmpty() },
            startDate = startDate,
            endDate = endDate,
            pageable = pageable
        )

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { MemberActivityResponse.from(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get recent activities for a member (for quick display).
     */
    @GetMapping("/members/{memberId}/activities/recent")
    @PreAuthorize("hasAnyAuthority('members_view', 'activities_view')")
    fun getRecentActivities(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<List<MemberActivityResponse>> {
        val activities = activityService.getRecentActivities(memberId, limit.coerceIn(1, 50))
        return ResponseEntity.ok(activities.map { MemberActivityResponse.from(it) })
    }

    /**
     * Get activity summary for a member.
     */
    @GetMapping("/members/{memberId}/activities/summary")
    @PreAuthorize("hasAnyAuthority('members_view', 'activities_view')")
    fun getActivitySummary(
        @PathVariable memberId: UUID
    ): ResponseEntity<ActivitySummaryResponse> {
        val totalActivities = activityService.countActivities(memberId)
        val recentActivities = activityService.getRecentActivities(memberId, 5)

        // Get counts for common activity types
        val activityCounts = mapOf(
            ActivityType.CHECK_IN to activityService.countActivitiesByType(memberId, ActivityType.CHECK_IN),
            ActivityType.PAYMENT_RECEIVED to activityService.countActivitiesByType(memberId, ActivityType.PAYMENT_RECEIVED),
            ActivityType.STATUS_CHANGED to activityService.countActivitiesByType(memberId, ActivityType.STATUS_CHANGED),
            ActivityType.PROFILE_UPDATED to activityService.countActivitiesByType(memberId, ActivityType.PROFILE_UPDATED)
        )

        val lastActivity = recentActivities.firstOrNull()

        return ResponseEntity.ok(
            ActivitySummaryResponse(
                totalActivities = totalActivities,
                recentActivities = recentActivities.map { MemberActivityResponse.from(it) },
                activityCounts = activityCounts,
                lastActivity = lastActivity?.let { MemberActivityResponse.from(it) }
            )
        )
    }

    /**
     * Log a manual activity (staff note, call logged, etc.).
     */
    @PostMapping("/members/{memberId}/activities")
    @PreAuthorize("hasAnyAuthority('members_manage', 'activities_manage')")
    fun logActivity(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: CreateActivityRequest,
        @AuthenticationPrincipal user: UserDetails?
    ): ResponseEntity<MemberActivityResponse> {
        val staffUserId = user?.let {
            try {
                UUID.fromString(it.username)
            } catch (e: Exception) {
                null
            }
        }

        val staffUser = staffUserId?.let { userRepository.findById(it).orElse(null) }
        val staffName = staffUser?.displayName?.en

        activityService.logGenericActivity(
            memberId = memberId,
            activityType = request.activityType,
            title = request.title,
            description = request.description,
            metadata = request.metadata,
            performedByUserId = staffUserId,
            performedByName = staffName
        )

        // Return the most recent activity (the one we just created)
        val latestActivity = activityService.getLatestActivityByType(memberId, request.activityType)
            ?: throw IllegalStateException("Activity was not created")

        return ResponseEntity.status(HttpStatus.CREATED).body(MemberActivityResponse.from(latestActivity))
    }

    /**
     * Get available activity types.
     */
    @GetMapping("/activities/types")
    @PreAuthorize("isAuthenticated()")
    fun getActivityTypes(): ResponseEntity<List<ActivityType>> {
        return ResponseEntity.ok(ActivityType.entries)
    }

    /**
     * Get activities performed by a specific staff member (audit trail).
     */
    @GetMapping("/activities/by-staff/{userId}")
    @PreAuthorize("hasAuthority('audit_view')")
    fun getActivitiesByStaff(
        @PathVariable userId: UUID,
        @PageableDefault(size = 20, sort = ["createdAt"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<PageResponse<MemberActivityResponse>> {
        val page = activityService.getActivitiesByPerformer(userId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { MemberActivityResponse.from(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }
}
