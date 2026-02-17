package com.liyaqa.auth.api

import com.liyaqa.auth.application.commands.ForgotPasswordCommand
import com.liyaqa.auth.application.services.AuthService
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
class UserController(
    private val userService: UserService,
    private val authService: AuthService
) {
    /**
     * Creates a new user.
     * Requires users_create permission.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('users_create')")
    fun createUser(@Valid @RequestBody request: CreateUserRequest): ResponseEntity<UserResponse> {
        val user = userService.createUser(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user))
    }

    /**
     * Gets a user by ID.
     * Requires users_view permission.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('users_view')")
    fun getUser(@PathVariable id: UUID): ResponseEntity<UserResponse> {
        val user = userService.getUser(id)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Lists all users with pagination.
     * Requires users_view permission.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('users_view')")
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
     * Requires users_view permission.
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('users_view')")
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
     * Requires users_view permission.
     */
    @GetMapping("/role/{role}")
    @PreAuthorize("hasAuthority('users_view')")
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
     * Requires users_update permission.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('users_update')")
    fun updateUser(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateUserRequest
    ): ResponseEntity<UserResponse> {
        val user = userService.updateUser(id, request.toCommand())
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Deactivates a user.
     * Requires users_update permission.
     */
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('users_update')")
    fun deactivateUser(@PathVariable id: UUID): ResponseEntity<UserResponse> {
        val user = userService.deactivateUser(id)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Activates a deactivated user.
     * Requires users_update permission.
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('users_update')")
    fun activateUser(@PathVariable id: UUID): ResponseEntity<UserResponse> {
        val user = userService.activateUser(id)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Unlocks a locked user.
     * Requires users_update permission.
     */
    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasAuthority('users_update')")
    fun unlockUser(@PathVariable id: UUID): ResponseEntity<UserResponse> {
        val user = userService.unlockUser(id)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Deletes a user.
     * Requires users_delete permission.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('users_delete')")
    fun deleteUser(@PathVariable id: UUID): ResponseEntity<Unit> {
        userService.deleteUser(id)
        return ResponseEntity.noContent().build()
    }

    /**
     * Links a user to a member.
     * Requires users_update permission.
     */
    @PostMapping("/{id}/link-member")
    @PreAuthorize("hasAuthority('users_update')")
    fun linkToMember(
        @PathVariable id: UUID,
        @Valid @RequestBody request: LinkMemberRequest
    ): ResponseEntity<UserResponse> {
        val user = userService.linkToMember(id, request.memberId)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Unlinks a user from their member.
     * Requires users_update permission.
     */
    @PostMapping("/{id}/unlink-member")
    @PreAuthorize("hasAuthority('users_update')")
    fun unlinkMember(@PathVariable id: UUID): ResponseEntity<UserResponse> {
        val user = userService.unlinkMember(id)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Admin-initiated password reset (sets new password directly).
     * Requires users_update permission.
     */
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('users_update')")
    fun adminResetPassword(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AdminResetPasswordRequest
    ): ResponseEntity<MessageResponse> {
        userService.adminResetPassword(id, request.newPassword)
        return ResponseEntity.ok(MessageResponse(
            message = "Password reset successfully",
            messageAr = "تم إعادة تعيين كلمة المرور بنجاح"
        ))
    }

    /**
     * Sends a password reset email to the user.
     * Requires users_update permission.
     */
    @PostMapping("/{id}/send-reset-email")
    @PreAuthorize("hasAuthority('users_update')")
    fun sendResetEmail(@PathVariable id: UUID): ResponseEntity<MessageResponse> {
        val user = userService.getUser(id)
        authService.forgotPassword(
            ForgotPasswordCommand(
                email = user.email,
                tenantId = user.tenantId
            )
        )
        return ResponseEntity.ok(MessageResponse(
            message = "Password reset email sent",
            messageAr = "تم إرسال بريد إعادة تعيين كلمة المرور"
        ))
    }
}