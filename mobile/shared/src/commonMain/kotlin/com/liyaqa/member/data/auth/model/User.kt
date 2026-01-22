package com.liyaqa.member.data.auth.model

import com.liyaqa.member.core.localization.LocalizedText
import kotlinx.serialization.Serializable

/**
 * Domain model representing the authenticated user.
 * Used throughout the app for user information display.
 */
@Serializable
data class User(
    val id: String,
    val email: String,
    val displayName: LocalizedText,
    val role: Role,
    val status: UserStatus,
    val memberId: String? = null,
    val tenantId: String? = null,
    val organizationId: String? = null
) {
    /**
     * Returns the localized display name based on the given locale.
     */
    fun getLocalizedName(locale: String): String {
        return displayName.localized(locale)
    }

    /**
     * Checks if the user has member role.
     */
    val isMember: Boolean
        get() = role == Role.MEMBER

    /**
     * Checks if the user has staff role or higher.
     */
    val isStaffOrHigher: Boolean
        get() = role in listOf(Role.STAFF, Role.CLUB_ADMIN, Role.SUPER_ADMIN)

    /**
     * Checks if the user has admin role (club or super).
     */
    val isAdmin: Boolean
        get() = role in listOf(Role.CLUB_ADMIN, Role.SUPER_ADMIN)

    /**
     * Checks if the user account is active.
     */
    val isActive: Boolean
        get() = status == UserStatus.ACTIVE

    companion object {
        /**
         * Creates a User from a UserResponse DTO.
         */
        fun fromResponse(response: UserResponse): User {
            return User(
                id = response.id,
                email = response.email,
                displayName = response.displayName,
                role = Role.fromString(response.role),
                status = UserStatus.fromString(response.status),
                memberId = response.memberId,
                tenantId = response.tenantId,
                organizationId = response.organizationId
            )
        }
    }
}
