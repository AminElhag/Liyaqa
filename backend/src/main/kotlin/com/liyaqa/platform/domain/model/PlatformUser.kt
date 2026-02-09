package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Platform team user entity.
 * Represents users who manage the Liyaqa platform (admins, sales reps, support reps).
 */
@Entity
@Table(name = "platform_users")
class PlatformUser(
    id: UUID = UUID.randomUUID(),

    @Column(name = "email", unique = true, nullable = false)
    var email: String,

    @Column(name = "password_hash", nullable = false)
    var passwordHash: String,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "display_name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "display_name_ar"))
    )
    var displayName: LocalizedText,

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    var role: PlatformUserRole = PlatformUserRole.SUPPORT_AGENT,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: PlatformUserStatus = PlatformUserStatus.ACTIVE,

    @Column(name = "phone_number")
    var phoneNumber: String? = null,

    @Column(name = "avatar_url")
    var avatarUrl: String? = null,

    @Column(name = "last_login_at")
    var lastLoginAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    var createdBy: PlatformUser? = null

) : OrganizationLevelEntity(id) {

    // ============================================
    // Status Management
    // ============================================

    /**
     * Activate the user account.
     */
    fun activate() {
        status = PlatformUserStatus.ACTIVE
    }

    /**
     * Deactivate the user account (voluntary).
     */
    fun deactivate() {
        status = PlatformUserStatus.INACTIVE
    }

    /**
     * Suspend the user account (administrative action).
     */
    fun suspend() {
        status = PlatformUserStatus.SUSPENDED
    }

    /**
     * Record a successful login.
     */
    fun recordLogin() {
        lastLoginAt = Instant.now()
    }

    // ============================================
    // Queries
    // ============================================

    /**
     * Check if the user account is active.
     */
    fun isActive(): Boolean = status == PlatformUserStatus.ACTIVE

    /**
     * Check if the user is a super admin.
     */
    fun isSuperAdmin(): Boolean = role == PlatformUserRole.PLATFORM_SUPER_ADMIN

    /**
     * Check if the user is any kind of admin (super or regular).
     */
    fun isAdmin(): Boolean = role == PlatformUserRole.PLATFORM_SUPER_ADMIN || role == PlatformUserRole.PLATFORM_ADMIN

    /**
     * Check if the user is an account manager.
     */
    fun isAccountManager(): Boolean = role == PlatformUserRole.ACCOUNT_MANAGER

    /**
     * Check if the user is a support lead.
     */
    fun isSupportLead(): Boolean = role == PlatformUserRole.SUPPORT_LEAD

    /**
     * Check if the user is a support agent.
     */
    fun isSupportAgent(): Boolean = role == PlatformUserRole.SUPPORT_AGENT

    /**
     * Check if the user is a viewer.
     */
    fun isViewer(): Boolean = role == PlatformUserRole.PLATFORM_VIEWER

    /**
     * Check if the user has a specific platform permission.
     */
    fun hasPermission(permission: PlatformPermission): Boolean =
        PlatformRolePermissions.hasPermission(role, permission)

    // ============================================
    // Updates
    // ============================================

    /**
     * Update the user's password hash.
     */
    fun updatePassword(newPasswordHash: String) {
        passwordHash = newPasswordHash
    }

    /**
     * Update the user's profile.
     */
    fun updateProfile(
        displayName: LocalizedText? = null,
        phoneNumber: String? = null,
        avatarUrl: String? = null
    ) {
        displayName?.let { this.displayName = it }
        phoneNumber?.let { this.phoneNumber = it }
        avatarUrl?.let { this.avatarUrl = it }
    }

    /**
     * Update the user's role.
     */
    fun updateRole(newRole: PlatformUserRole) {
        role = newRole
    }

    companion object {
        /**
         * Create a new platform user.
         */
        fun create(
            email: String,
            passwordHash: String,
            displayName: LocalizedText,
            role: PlatformUserRole,
            phoneNumber: String? = null,
            createdBy: PlatformUser? = null
        ): PlatformUser {
            return PlatformUser(
                email = email,
                passwordHash = passwordHash,
                displayName = displayName,
                role = role,
                status = PlatformUserStatus.ACTIVE,
                phoneNumber = phoneNumber,
                createdBy = createdBy
            )
        }
    }
}
