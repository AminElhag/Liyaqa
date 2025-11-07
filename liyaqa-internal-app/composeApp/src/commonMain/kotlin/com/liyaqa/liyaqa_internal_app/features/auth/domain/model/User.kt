package com.liyaqa.liyaqa_internal_app.features.auth.domain.model

/**
 * User domain model.
 * Represents the core business entity for a user.
 * Follows backend's domain model pattern.
 */
data class User(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String,
    val permissions: List<String> = emptyList(),
    val tenantId: String? = null
) {
    val fullName: String
        get() = "$firstName $lastName"

    /**
     * Check if user has a specific permission
     */
    fun hasPermission(permission: String): Boolean {
        return permissions.contains(permission)
    }

    /**
     * Check if user has any of the specified permissions
     */
    fun hasAnyPermission(vararg requiredPermissions: String): Boolean {
        return requiredPermissions.any { permissions.contains(it) }
    }

    /**
     * Check if user has all specified permissions
     */
    fun hasAllPermissions(vararg requiredPermissions: String): Boolean {
        return requiredPermissions.all { permissions.contains(it) }
    }
}
