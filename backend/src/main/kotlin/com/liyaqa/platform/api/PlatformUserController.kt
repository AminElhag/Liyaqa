package com.liyaqa.platform.api

import com.liyaqa.platform.api.dto.ChangeUserStatusRequest
import com.liyaqa.platform.api.dto.CreatePlatformUserRequest
import com.liyaqa.platform.api.dto.PlatformUserActivityResponse
import com.liyaqa.platform.api.dto.PlatformUserResponse
import com.liyaqa.platform.api.dto.PlatformUserStatsResponse
import com.liyaqa.platform.api.dto.PlatformUserSummaryResponse
import com.liyaqa.platform.api.dto.ResetUserPasswordRequest
import com.liyaqa.platform.api.dto.UpdatePlatformUserRequest
import com.liyaqa.platform.application.services.PlatformUserService
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.model.PlatformUserStatus
import com.liyaqa.platform.api.dto.PageResponse
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * REST controller for platform user management.
 */
@RestController
@RequestMapping("/api/platform/users")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
class PlatformUserController(
    private val platformUserService: PlatformUserService
) {

    /**
     * Create a new platform user.
     * Only PLATFORM_ADMIN can create users.
     */
    @PostMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun createUser(
        @Valid @RequestBody request: CreatePlatformUserRequest,
        @AuthenticationPrincipal userDetails: UserDetails?
    ): ResponseEntity<PlatformUserResponse> {
        val createdById = getCurrentUserId(userDetails)
        val user = platformUserService.createUser(request.toCommand(createdById))
        return ResponseEntity.status(HttpStatus.CREATED).body(PlatformUserResponse.from(user))
    }

    /**
     * Get all platform users with optional filters.
     */
    @GetMapping
    fun getAllUsers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String,
        @RequestParam(required = false) status: PlatformUserStatus?,
        @RequestParam(required = false) role: PlatformUserRole?,
        @RequestParam(required = false) search: String?
    ): ResponseEntity<PageResponse<PlatformUserSummaryResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)

        val usersPage = platformUserService.getAllUsers(
            status = status,
            role = role,
            search = search,
            pageable = pageable
        )

        return ResponseEntity.ok(
            PageResponse(
                content = usersPage.content.map { PlatformUserSummaryResponse.from(it) },
                page = usersPage.number,
                size = usersPage.size,
                totalElements = usersPage.totalElements,
                totalPages = usersPage.totalPages,
                first = usersPage.isFirst,
                last = usersPage.isLast
            )
        )
    }

    /**
     * Get user by ID.
     */
    @GetMapping("/{id}")
    fun getUser(@PathVariable id: UUID): ResponseEntity<PlatformUserResponse> {
        val user = platformUserService.getUser(id)
        return ResponseEntity.ok(PlatformUserResponse.from(user))
    }

    /**
     * Update user profile.
     * Only PLATFORM_ADMIN can update users.
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun updateUser(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdatePlatformUserRequest
    ): ResponseEntity<PlatformUserResponse> {
        val user = platformUserService.updateUser(id, request.toCommand())
        return ResponseEntity.ok(PlatformUserResponse.from(user))
    }

    /**
     * Change user status.
     * Only PLATFORM_ADMIN can change status.
     */
    @PostMapping("/{id}/status")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun changeStatus(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ChangeUserStatusRequest,
        @AuthenticationPrincipal userDetails: UserDetails?
    ): ResponseEntity<PlatformUserResponse> {
        val performedById = getCurrentUserId(userDetails)
        val user = platformUserService.changeStatus(id, request.toCommand(), performedById)
        return ResponseEntity.ok(PlatformUserResponse.from(user))
    }

    /**
     * Reset user password.
     * Only PLATFORM_ADMIN can reset passwords.
     */
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun resetPassword(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ResetUserPasswordRequest,
        @AuthenticationPrincipal userDetails: UserDetails?
    ): ResponseEntity<Unit> {
        val performedById = getCurrentUserId(userDetails)
        platformUserService.resetPassword(id, request.toCommand(), performedById)
        return ResponseEntity.noContent().build()
    }

    /**
     * Get user activities.
     */
    @GetMapping("/{id}/activities")
    fun getUserActivities(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<PlatformUserActivityResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val activitiesPage = platformUserService.getUserActivities(id, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = activitiesPage.content.map { PlatformUserActivityResponse.from(it) },
                page = activitiesPage.number,
                size = activitiesPage.size,
                totalElements = activitiesPage.totalElements,
                totalPages = activitiesPage.totalPages,
                first = activitiesPage.isFirst,
                last = activitiesPage.isLast
            )
        )
    }

    /**
     * Delete user.
     * Only PLATFORM_ADMIN can delete users.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun deleteUser(@PathVariable id: UUID): ResponseEntity<Unit> {
        platformUserService.deleteUser(id)
        return ResponseEntity.noContent().build()
    }

    /**
     * Get user statistics.
     */
    @GetMapping("/stats")
    fun getStats(): ResponseEntity<PlatformUserStatsResponse> {
        val stats = platformUserService.getStats()
        return ResponseEntity.ok(PlatformUserStatsResponse.from(stats))
    }

    /**
     * Helper to get current user ID from authentication.
     */
    private fun getCurrentUserId(userDetails: UserDetails?): UUID? {
        // Try to extract user ID from the authentication principal
        // This depends on your JWT token structure
        return try {
            userDetails?.username?.let { UUID.fromString(it) }
        } catch (e: IllegalArgumentException) {
            null
        }
    }
}
