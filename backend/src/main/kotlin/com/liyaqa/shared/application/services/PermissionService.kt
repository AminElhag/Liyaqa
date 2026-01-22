package com.liyaqa.shared.application.services

import com.liyaqa.shared.domain.model.Permission
import com.liyaqa.shared.domain.model.UserPermission
import com.liyaqa.shared.domain.ports.PermissionRepository
import com.liyaqa.shared.domain.ports.RoleDefaultPermissionRepository
import com.liyaqa.shared.domain.ports.UserPermissionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing user permissions.
 */
@Service
class PermissionService(
    private val permissionRepository: PermissionRepository,
    private val userPermissionRepository: UserPermissionRepository,
    private val roleDefaultPermissionRepository: RoleDefaultPermissionRepository
) {
    private val logger = LoggerFactory.getLogger(PermissionService::class.java)

    /**
     * Gets all available permissions.
     */
    @Transactional(readOnly = true)
    fun getAllPermissions(): List<Permission> {
        return permissionRepository.findAll()
    }

    /**
     * Gets permissions grouped by module.
     */
    @Transactional(readOnly = true)
    fun getPermissionsByModule(): Map<String, List<Permission>> {
        return permissionRepository.findAll().groupBy { it.module }
    }

    /**
     * Gets permission by code.
     */
    @Transactional(readOnly = true)
    fun getPermissionByCode(code: String): Permission? {
        return permissionRepository.findByCode(code).orElse(null)
    }

    /**
     * Gets all permission codes for a user.
     */
    @Transactional(readOnly = true)
    fun getUserPermissionCodes(userId: UUID): List<String> {
        return userPermissionRepository.findPermissionCodesByUserId(userId)
    }

    /**
     * Gets full permission objects for a user.
     */
    @Transactional(readOnly = true)
    fun getUserPermissions(userId: UUID): List<Permission> {
        val userPermissions = userPermissionRepository.findByUserId(userId)
        val permissionIds = userPermissions.map { it.permissionId }
        return permissionRepository.findAll().filter { it.id in permissionIds }
    }

    /**
     * Checks if user has a specific permission.
     */
    @Transactional(readOnly = true)
    fun hasPermission(userId: UUID, permissionCode: String): Boolean {
        val permission = permissionRepository.findByCode(permissionCode).orElse(null)
            ?: return false
        return userPermissionRepository.existsByUserIdAndPermissionId(userId, permission.id)
    }

    /**
     * Grants permissions to a user.
     */
    @Transactional
    fun grantPermissions(userId: UUID, permissionCodes: List<String>, grantedBy: UUID?) {
        val permissions = permissionRepository.findByCodes(permissionCodes)
        if (permissions.isEmpty()) {
            logger.warn("No valid permissions found for codes: $permissionCodes")
            return
        }

        val newPermissions = permissions
            .filter { permission ->
                !userPermissionRepository.existsByUserIdAndPermissionId(userId, permission.id)
            }
            .map { permission ->
                UserPermission(
                    userId = userId,
                    permissionId = permission.id,
                    grantedBy = grantedBy
                )
            }

        if (newPermissions.isNotEmpty()) {
            userPermissionRepository.saveAll(newPermissions)
            logger.info("Granted ${newPermissions.size} permissions to user $userId")
        }
    }

    /**
     * Revokes permissions from a user.
     */
    @Transactional
    fun revokePermissions(userId: UUID, permissionCodes: List<String>) {
        val permissions = permissionRepository.findByCodes(permissionCodes)
        if (permissions.isEmpty()) {
            logger.warn("No valid permissions found for codes: $permissionCodes")
            return
        }

        val permissionIds = permissions.map { it.id }
        userPermissionRepository.deleteByUserIdAndPermissionIds(userId, permissionIds)
        logger.info("Revoked ${permissionIds.size} permissions from user $userId")
    }

    /**
     * Sets user permissions (replaces all existing permissions).
     */
    @Transactional
    fun setUserPermissions(userId: UUID, permissionCodes: List<String>, grantedBy: UUID?) {
        // Delete all existing permissions
        userPermissionRepository.deleteByUserId(userId)

        // Grant new permissions
        if (permissionCodes.isNotEmpty()) {
            grantPermissions(userId, permissionCodes, grantedBy)
        }

        logger.info("Set ${permissionCodes.size} permissions for user $userId")
    }

    /**
     * Grants default permissions for a role to a user.
     * Called when a new user is created.
     */
    @Transactional
    fun grantDefaultPermissionsForRole(userId: UUID, role: String) {
        val defaultPermissionIds = roleDefaultPermissionRepository.findPermissionIdsByRole(role)
        if (defaultPermissionIds.isEmpty()) {
            logger.debug("No default permissions found for role: $role")
            return
        }

        val permissions = permissionRepository.findAll().filter { it.id in defaultPermissionIds }
        val newPermissions = permissions.map { permission ->
            UserPermission(
                userId = userId,
                permissionId = permission.id,
                grantedBy = null
            )
        }

        if (newPermissions.isNotEmpty()) {
            userPermissionRepository.saveAll(newPermissions)
            logger.info("Granted ${newPermissions.size} default permissions to user $userId for role $role")
        }
    }

    /**
     * Clears all permissions for a user.
     */
    @Transactional
    fun clearUserPermissions(userId: UUID) {
        userPermissionRepository.deleteByUserId(userId)
        logger.info("Cleared all permissions for user $userId")
    }
}
