package com.liyaqa.shared.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * UserPermission entity representing a permission granted to a user.
 * This is a global entity - not tenant-scoped.
 */
@Entity
@Table(name = "user_permissions")
class UserPermission(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "permission_id", nullable = false)
    val permissionId: UUID,

    @Column(name = "granted_by")
    val grantedBy: UUID? = null,

    @Column(name = "granted_at", nullable = false)
    val grantedAt: Instant = Instant.now()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is UserPermission) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}

/**
 * RoleDefaultPermission entity representing default permissions for a role.
 * Used to auto-grant permissions when a new user is created with a specific role.
 */
@Entity
@Table(name = "role_default_permissions")
class RoleDefaultPermission(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "role", nullable = false)
    val role: String,

    @Column(name = "permission_id", nullable = false)
    val permissionId: UUID
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is RoleDefaultPermission) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
