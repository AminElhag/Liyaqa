package com.liyaqa.shared.api

import com.liyaqa.shared.application.services.PermissionService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * Controller for managing permissions.
 */
@RestController
@RequestMapping("/api/permissions")
class PermissionController(
    private val permissionService: PermissionService
) {
    /**
     * Gets all available permissions.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('users_permissions')")
    fun getAllPermissions(): ResponseEntity<List<PermissionResponse>> {
        val permissions = permissionService.getAllPermissions()
        return ResponseEntity.ok(permissions.map { PermissionResponse.from(it) })
    }

    /**
     * Gets all permissions grouped by module.
     */
    @GetMapping("/by-module")
    @PreAuthorize("hasAuthority('users_permissions')")
    fun getPermissionsByModule(): ResponseEntity<PermissionsByModuleResponse> {
        val groupedPermissions = permissionService.getPermissionsByModule()
        val modules = groupedPermissions.map { (module, permissions) ->
            ModulePermissions(
                module = module,
                permissions = permissions.map { PermissionResponse.from(it) }
            )
        }.sortedBy { it.module }

        return ResponseEntity.ok(PermissionsByModuleResponse(modules))
    }

    /**
     * Gets permissions for a specific user.
     */
    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('users_permissions') or #userId.toString() == principal.username")
    fun getUserPermissions(@PathVariable userId: UUID): ResponseEntity<UserPermissionsResponse> {
        val permissions = permissionService.getUserPermissions(userId)
        val codes = permissionService.getUserPermissionCodes(userId)

        return ResponseEntity.ok(
            UserPermissionsResponse(
                userId = userId,
                permissions = permissions.map { PermissionResponse.from(it) },
                permissionCodes = codes
            )
        )
    }

    /**
     * Grants permissions to a user.
     */
    @PostMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('users_permissions')")
    fun grantPermissions(
        @PathVariable userId: UUID,
        @Valid @RequestBody request: GrantPermissionsRequest,
        @AuthenticationPrincipal principal: UserDetails
    ): ResponseEntity<UserPermissionsResponse> {
        val grantedBy = UUID.fromString(principal.username)
        permissionService.grantPermissions(userId, request.permissionCodes, grantedBy)

        // Return updated permissions
        val permissions = permissionService.getUserPermissions(userId)
        val codes = permissionService.getUserPermissionCodes(userId)

        return ResponseEntity.ok(
            UserPermissionsResponse(
                userId = userId,
                permissions = permissions.map { PermissionResponse.from(it) },
                permissionCodes = codes
            )
        )
    }

    /**
     * Revokes permissions from a user.
     */
    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('users_permissions')")
    fun revokePermissions(
        @PathVariable userId: UUID,
        @Valid @RequestBody request: RevokePermissionsRequest
    ): ResponseEntity<UserPermissionsResponse> {
        permissionService.revokePermissions(userId, request.permissionCodes)

        // Return updated permissions
        val permissions = permissionService.getUserPermissions(userId)
        val codes = permissionService.getUserPermissionCodes(userId)

        return ResponseEntity.ok(
            UserPermissionsResponse(
                userId = userId,
                permissions = permissions.map { PermissionResponse.from(it) },
                permissionCodes = codes
            )
        )
    }

    /**
     * Sets all permissions for a user (replaces existing).
     */
    @PutMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('users_permissions')")
    fun setUserPermissions(
        @PathVariable userId: UUID,
        @Valid @RequestBody request: SetPermissionsRequest,
        @AuthenticationPrincipal principal: UserDetails
    ): ResponseEntity<UserPermissionsResponse> {
        val grantedBy = UUID.fromString(principal.username)
        permissionService.setUserPermissions(userId, request.permissionCodes, grantedBy)

        // Return updated permissions
        val permissions = permissionService.getUserPermissions(userId)
        val codes = permissionService.getUserPermissionCodes(userId)

        return ResponseEntity.ok(
            UserPermissionsResponse(
                userId = userId,
                permissions = permissions.map { PermissionResponse.from(it) },
                permissionCodes = codes
            )
        )
    }
}
