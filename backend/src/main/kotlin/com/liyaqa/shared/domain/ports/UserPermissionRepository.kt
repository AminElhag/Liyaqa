package com.liyaqa.shared.domain.ports

import com.liyaqa.shared.domain.model.RoleDefaultPermission
import com.liyaqa.shared.domain.model.UserPermission
import java.util.UUID

/**
 * Repository port for user permission operations.
 */
interface UserPermissionRepository {
    /**
     * Saves a user permission.
     */
    fun save(userPermission: UserPermission): UserPermission

    /**
     * Saves multiple user permissions.
     */
    fun saveAll(userPermissions: List<UserPermission>): List<UserPermission>

    /**
     * Finds all permissions for a user.
     */
    fun findByUserId(userId: UUID): List<UserPermission>

    /**
     * Finds permission codes for a user.
     */
    fun findPermissionCodesByUserId(userId: UUID): List<String>

    /**
     * Checks if user has a specific permission.
     */
    fun existsByUserIdAndPermissionId(userId: UUID, permissionId: UUID): Boolean

    /**
     * Deletes a user permission.
     */
    fun deleteByUserIdAndPermissionId(userId: UUID, permissionId: UUID)

    /**
     * Deletes all permissions for a user.
     */
    fun deleteByUserId(userId: UUID)

    /**
     * Deletes permissions by user ID and permission IDs.
     */
    fun deleteByUserIdAndPermissionIds(userId: UUID, permissionIds: List<UUID>)
}

/**
 * Repository port for role default permission operations.
 */
interface RoleDefaultPermissionRepository {
    /**
     * Finds all default permission IDs for a role.
     */
    fun findPermissionIdsByRole(role: String): List<UUID>

    /**
     * Finds all default permissions for a role.
     */
    fun findByRole(role: String): List<RoleDefaultPermission>
}
