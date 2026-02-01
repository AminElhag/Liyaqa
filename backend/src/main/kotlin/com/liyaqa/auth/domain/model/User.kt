package com.liyaqa.auth.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "users")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class User(
    id: UUID = UUID.randomUUID(),

    @Column(name = "email", nullable = false)
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
    var role: Role = Role.MEMBER,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: UserStatus = UserStatus.ACTIVE,

    @Column(name = "member_id")
    var memberId: UUID? = null,

    @Column(name = "last_login_at")
    var lastLoginAt: Instant? = null,

    @Column(name = "password_changed_at")
    var passwordChangedAt: Instant? = null,

    @Column(name = "failed_login_attempts", nullable = false)
    var failedLoginAttempts: Int = 0,

    /** Indicates if this is a platform (internal Liyaqa team) user */
    @Column(name = "is_platform_user", nullable = false)
    var isPlatformUser: Boolean = false,

    /** The platform organization ID for internal users (null for client users) */
    @Column(name = "platform_organization_id")
    var platformOrganizationId: UUID? = null,

    /** Indicates if MFA is enabled for this user */
    @Column(name = "mfa_enabled", nullable = false)
    var mfaEnabled: Boolean = false,

    /** Encrypted TOTP secret for MFA (Base32 encoded) */
    @Column(name = "mfa_secret")
    var mfaSecret: String? = null,

    /** Timestamp when MFA was verified and enabled */
    @Column(name = "mfa_verified_at")
    var mfaVerifiedAt: Instant? = null,

    /** Hashed backup codes for MFA recovery (JSON array) */
    @Column(name = "backup_codes_hash", columnDefinition = "TEXT")
    var backupCodesHash: String? = null,

    /** OAuth provider type if user signed up via OAuth (GOOGLE, MICROSOFT, etc.) */
    @Column(name = "oauth_provider", length = 50)
    var oauthProvider: String? = null,

    /** OAuth provider's unique user ID */
    @Column(name = "oauth_provider_id", length = 255)
    var oauthProviderId: String? = null,

    /** IP binding enabled - validates IP address on token refresh for enhanced security */
    @Column(name = "ip_binding_enabled", nullable = false)
    var ipBindingEnabled: Boolean = false

) : BaseEntity(id) {

    companion object {
        private const val MAX_FAILED_ATTEMPTS = 5
    }

    /**
     * Records a successful login attempt.
     * Resets failed login counter and updates last login timestamp.
     */
    fun recordSuccessfulLogin() {
        lastLoginAt = Instant.now()
        failedLoginAttempts = 0
    }

    /**
     * Records a failed login attempt.
     * Locks the account after MAX_FAILED_ATTEMPTS consecutive failures.
     */
    fun recordFailedLogin() {
        failedLoginAttempts++
        if (failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            status = UserStatus.LOCKED
        }
    }

    /**
     * Unlocks a locked user account.
     * @throws IllegalStateException if user is not locked
     */
    fun unlock() {
        require(status == UserStatus.LOCKED) { "User is not locked" }
        status = UserStatus.ACTIVE
        failedLoginAttempts = 0
    }

    /**
     * Changes the user's password.
     * @param newPasswordHash the new hashed password
     */
    fun changePassword(newPasswordHash: String) {
        passwordHash = newPasswordHash
        passwordChangedAt = Instant.now()
    }

    /**
     * Deactivates the user account.
     */
    fun deactivate() {
        status = UserStatus.INACTIVE
    }

    /**
     * Activates a deactivated user account.
     * @throws IllegalStateException if user is not inactive
     */
    fun activate() {
        require(status == UserStatus.INACTIVE) { "User is not inactive" }
        status = UserStatus.ACTIVE
    }

    /**
     * Verifies a pending user account.
     * @throws IllegalStateException if user is not pending verification
     */
    fun verify() {
        require(status == UserStatus.PENDING_VERIFICATION) { "User is not pending verification" }
        status = UserStatus.ACTIVE
    }

    /**
     * Checks if the user can login.
     */
    fun canLogin(): Boolean = status == UserStatus.ACTIVE

    /**
     * Checks if the user has at least the given role level.
     * Note: Platform roles and client roles are separate hierarchies.
     */
    fun hasRoleAtLeast(requiredRole: Role): Boolean {
        return role.ordinal <= requiredRole.ordinal
    }

    /**
     * Checks if this user has a platform role.
     */
    fun hasPlatformRole(): Boolean = Role.isPlatformRole(role)

    /**
     * Checks if this user has a client role.
     */
    fun hasClientRole(): Boolean = Role.isClientRole(role)

    /**
     * Links this user to a member.
     * @param memberId the member ID to link
     */
    fun linkToMember(memberId: UUID) {
        this.memberId = memberId
    }

    /**
     * Links this user account to an OAuth provider.
     * @param provider OAuth provider name (GOOGLE, MICROSOFT, etc.)
     * @param providerId OAuth provider's unique user ID
     */
    fun linkOAuthProvider(provider: String, providerId: String) {
        this.oauthProvider = provider
        this.oauthProviderId = providerId
    }

    /**
     * Unlinks OAuth provider from this user account.
     */
    fun unlinkOAuthProvider() {
        this.oauthProvider = null
        this.oauthProviderId = null
    }

    /**
     * Checks if this user is linked to an OAuth provider.
     */
    fun isOAuthLinked(): Boolean = oauthProvider != null && oauthProviderId != null

    /**
     * Unlinks this user from any member.
     */
    fun unlinkMember() {
        this.memberId = null
    }

    /**
     * Enables MFA for this user.
     * @param mfaSecret The TOTP secret (Base32 encoded)
     * @param backupCodesHash Hashed backup codes
     */
    fun enableMfa(mfaSecret: String, backupCodesHash: String) {
        this.mfaSecret = mfaSecret
        this.backupCodesHash = backupCodesHash
        this.mfaEnabled = true
        this.mfaVerifiedAt = Instant.now()
    }

    /**
     * Disables MFA for this user.
     */
    fun disableMfa() {
        this.mfaEnabled = false
        this.mfaSecret = null
        this.mfaVerifiedAt = null
        this.backupCodesHash = null
    }

    /**
     * Updates backup codes for MFA.
     * @param backupCodesHash New hashed backup codes
     */
    fun updateBackupCodes(backupCodesHash: String) {
        this.backupCodesHash = backupCodesHash
    }
}