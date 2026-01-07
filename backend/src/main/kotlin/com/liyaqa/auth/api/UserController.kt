package com.liyaqa.auth.api

import com.liyaqa.auth.application.services.UserService
import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.organization.api.PageResponse
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN')")
class UserController(
    private val userService: UserService
) {
    /**
     * Creates a new user.
     * Requires CLUB_ADMIN or higher role.
     */
    @PostMapping
    fun createUser(@Valid @RequestBody request: CreateUserRequest): ResponseEntity<UserResponse> {
        val user = userService.createUser(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user))
    }

    /**
     * Gets a user by ID.
     * Requires CLUB_ADMIN or higher role.
     */
    @GetMapping("/{id}")
    fun getUser(@PathVariable id: UUID): ResponseEntity<UserResponse> {
        val user = userService.getUser(id)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Lists all users with pagination.
     * Requires CLUB_ADMIN or higher role.
     */
    @GetMapping
    fun getAllUsers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<UserResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val usersPage = userService.getAllUsers(pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = usersPage.content.map { UserResponse.from(it) },
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
     * Lists users by status.
     * Requires CLUB_ADMIN or higher role.
     */
    @GetMapping("/status/{status}")
    fun getUsersByStatus(
        @PathVariable status: UserStatus,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<UserResponse>> {
        val pageable = PageRequest.of(page, size)
        val usersPage = userService.getUsersByStatus(status, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = usersPage.content.map { UserResponse.from(it) },
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
     * Lists users by role.
     * Requires CLUB_ADMIN or higher role.
     */
    @GetMapping("/role/{role}")
    fun getUsersByRole(
        @PathVariable role: Role,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<UserResponse>> {
        val pageable = PageRequest.of(page, size)
        val usersPage = userService.getUsersByRole(role, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = usersPage.content.map { UserResponse.from(it) },
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
     * Updates a user.
     * Requires CLUB_ADMIN or higher role.
     */
    @PutMapping("/{id}")
    fun updateUser(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateUserRequest
    ): ResponseEntity<UserResponse> {
        val user = userService.updateUser(id, request.toCommand())
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Deactivates a user.
     * Requires CLUB_ADMIN or higher role.
     */
    @PostMapping("/{id}/deactivate")
    fun deactivateUser(@PathVariable id: UUID): ResponseEntity<UserResponse> {
        val user = userService.deactivateUser(id)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Activates a deactivated user.
     * Requires CLUB_ADMIN or higher role.
     */
    @PostMapping("/{id}/activate")
    fun activateUser(@PathVariable id: UUID): ResponseEntity<UserResponse> {
        val user = userService.activateUser(id)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Unlocks a locked user.
     * Requires CLUB_ADMIN or higher role.
     */
    @PostMapping("/{id}/unlock")
    fun unlockUser(@PathVariable id: UUID): ResponseEntity<UserResponse> {
        val user = userService.unlockUser(id)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Deletes a user.
     * Requires SUPER_ADMIN role.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    fun deleteUser(@PathVariable id: UUID): ResponseEntity<Unit> {
        userService.deleteUser(id)
        return ResponseEntity.noContent().build()
    }

    /**
     * Links a user to a member.
     * Requires CLUB_ADMIN or higher role.
     */
    @PostMapping("/{id}/link-member")
    fun linkToMember(
        @PathVariable id: UUID,
        @Valid @RequestBody request: LinkMemberRequest
    ): ResponseEntity<UserResponse> {
        val user = userService.linkToMember(id, request.memberId)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Unlinks a user from their member.
     * Requires CLUB_ADMIN or higher role.
     */
    @PostMapping("/{id}/unlink-member")
    fun unlinkMember(@PathVariable id: UUID): ResponseEntity<UserResponse> {
        val user = userService.unlinkMember(id)
        return ResponseEntity.ok(UserResponse.from(user))
    }
}