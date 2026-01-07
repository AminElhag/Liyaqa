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
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
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
    var failedLoginAttempts: Int = 0

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
     */
    fun hasRoleAtLeast(requiredRole: Role): Boolean {
        return role.ordinal <= requiredRole.ordinal
    }

    /**
     * Links this user to a member.
     * @param memberId the member ID to link
     */
    fun linkToMember(memberId: UUID) {
        this.memberId = memberId
    }

    /**
     * Unlinks this user from any member.
     */
    fun unlinkMember() {
        this.memberId = null
    }
}