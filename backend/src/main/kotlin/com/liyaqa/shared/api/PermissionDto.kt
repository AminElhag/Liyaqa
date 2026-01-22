package com.liyaqa.shared.api

import com.liyaqa.shared.domain.model.Permission
import jakarta.validation.constraints.NotEmpty
import java.util.UUID

/**
 * Response DTO for a single permission.
 */
data class PermissionResponse(
    val id: UUID,
    val code: String,
    val module: String,
    val action: String,
    val nameEn: String,
    val nameAr: String?,
    val descriptionEn: String?,
    val descriptionAr: String?
) {
    companion object {
        fun from(permission: Permission): PermissionResponse {
            return PermissionResponse(
                id = permission.id,
                code = permission.code,
                module = permission.module,
                action = permission.action,
                nameEn = permission.name.en,
                nameAr = permission.name.ar,
                descriptionEn = permission.description?.en,
                descriptionAr = permission.description?.ar
            )
        }
    }
}

/**
 * Response DTO for permissions grouped by module.
 */
data class PermissionsByModuleResponse(
    val modules: List<ModulePermissions>
)

/**
 * Permissions for a single module.
 */
data class ModulePermissions(
    val module: String,
    val permissions: List<PermissionResponse>
)

/**
 * Response DTO for user permissions.
 */
data class UserPermissionsResponse(
    val userId: UUID,
    val permissions: List<PermissionResponse>,
    val permissionCodes: List<String>
)

/**
 * Request DTO to grant permissions to a user.
 */
data class GrantPermissionsRequest(
    @field:NotEmpty(message = "Permission codes are required")
    val permissionCodes: List<String>
)

/**
 * Request DTO to revoke permissions from a user.
 */
data class RevokePermissionsRequest(
    @field:NotEmpty(message = "Permission codes are required")
    val permissionCodes: List<String>
)

/**
 * Request DTO to set all permissions for a user.
 */
data class SetPermissionsRequest(
    val permissionCodes: List<String>
)
