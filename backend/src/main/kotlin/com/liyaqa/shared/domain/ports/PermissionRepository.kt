package com.liyaqa.shared.domain.ports

import com.liyaqa.shared.domain.model.Permission
import java.util.Optional
import java.util.UUID

/**
 * Repository port for permission operations.
 */
interface PermissionRepository {
    /**
     * Finds all permissions.
     */
    fun findAll(): List<Permission>

    /**
     * Finds permission by ID.
     */
    fun findById(id: UUID): Optional<Permission>

    /**
     * Finds permission by code.
     */
    fun findByCode(code: String): Optional<Permission>

    /**
     * Finds permissions by IDs (optimized - uses IN clause).
     */
    fun findByIds(ids: List<UUID>): List<Permission>

    /**
     * Finds permissions by codes.
     */
    fun findByCodes(codes: List<String>): List<Permission>

    /**
     * Finds permissions by module.
     */
    fun findByModule(module: String): List<Permission>

    /**
     * Checks if permission exists by code.
     */
    fun existsByCode(code: String): Boolean
}
