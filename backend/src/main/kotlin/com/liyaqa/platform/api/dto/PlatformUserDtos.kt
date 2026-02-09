package com.liyaqa.platform.api.dto

import com.liyaqa.platform.application.commands.ChangeUserStatusCommand
import com.liyaqa.platform.application.commands.CreatePlatformUserCommand
import com.liyaqa.platform.application.commands.ResetUserPasswordCommand
import com.liyaqa.platform.application.commands.UpdatePlatformUserCommand
import com.liyaqa.platform.application.services.PlatformUserStats
import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserActivity
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.model.PlatformUserStatus
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

// ============================================
// Request DTOs
// ============================================

/**
 * Request to create a new platform user.
 */
data class CreatePlatformUserRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
    val email: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val password: String,

    @field:NotBlank(message = "Display name (English) is required")
    val displayNameEn: String,

    val displayNameAr: String? = null,

    @field:NotNull(message = "Role is required")
    val role: PlatformUserRole,

    val phoneNumber: String? = null
) {
    fun toCommand(createdById: UUID? = null) = CreatePlatformUserCommand(
        email = email,
        password = password,
        displayName = LocalizedText(en = displayNameEn, ar = displayNameAr),
        role = role,
        phoneNumber = phoneNumber,
        createdById = createdById
    )
}

/**
 * Request to update a platform user.
 */
data class UpdatePlatformUserRequest(
    val displayNameEn: String? = null,
    val displayNameAr: String? = null,
    val role: PlatformUserRole? = null,
    val phoneNumber: String? = null,
    val avatarUrl: String? = null
) {
    fun toCommand() = UpdatePlatformUserCommand(
        displayName = if (displayNameEn != null) LocalizedText(en = displayNameEn, ar = displayNameAr) else null,
        role = role,
        phoneNumber = phoneNumber,
        avatarUrl = avatarUrl
    )
}

/**
 * Request to change user status.
 */
data class ChangeUserStatusRequest(
    @field:NotNull(message = "Status is required")
    val status: PlatformUserStatus,

    val reason: String? = null
) {
    fun toCommand() = ChangeUserStatusCommand(
        status = status,
        reason = reason
    )
}

/**
 * Request to reset user password.
 */
data class ResetUserPasswordRequest(
    @field:NotBlank(message = "New password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val newPassword: String
) {
    fun toCommand() = ResetUserPasswordCommand(
        newPassword = newPassword
    )
}

// ============================================
// Response DTOs
// ============================================

/**
 * Full platform user response.
 */
data class PlatformUserResponse(
    val id: UUID,
    val email: String,
    val displayNameEn: String,
    val displayNameAr: String?,
    val role: PlatformUserRole,
    val status: PlatformUserStatus,
    val phoneNumber: String?,
    val avatarUrl: String?,
    val lastLoginAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant,
    val createdById: UUID?,
    val createdByName: String?
) {
    companion object {
        fun from(user: PlatformUser) = PlatformUserResponse(
            id = user.id,
            email = user.email,
            displayNameEn = user.displayName.en,
            displayNameAr = user.displayName.ar,
            role = user.role,
            status = user.status,
            phoneNumber = user.phoneNumber,
            avatarUrl = user.avatarUrl,
            lastLoginAt = user.lastLoginAt,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt,
            createdById = user.createdBy?.id,
            createdByName = user.createdBy?.displayName?.en
        )
    }
}

/**
 * Summary platform user response for lists.
 */
data class PlatformUserSummaryResponse(
    val id: UUID,
    val email: String,
    val displayNameEn: String,
    val displayNameAr: String?,
    val role: PlatformUserRole,
    val status: PlatformUserStatus,
    val lastLoginAt: Instant?,
    val createdAt: Instant
) {
    companion object {
        fun from(user: PlatformUser) = PlatformUserSummaryResponse(
            id = user.id,
            email = user.email,
            displayNameEn = user.displayName.en,
            displayNameAr = user.displayName.ar,
            role = user.role,
            status = user.status,
            lastLoginAt = user.lastLoginAt,
            createdAt = user.createdAt
        )
    }
}

/**
 * Platform user activity response.
 */
data class PlatformUserActivityResponse(
    val id: UUID,
    val userId: UUID,
    val action: String,
    val description: String,
    val ipAddress: String?,
    val userAgent: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(activity: PlatformUserActivity) = PlatformUserActivityResponse(
            id = activity.id,
            userId = activity.user.id,
            action = activity.action,
            description = activity.description,
            ipAddress = activity.ipAddress,
            userAgent = activity.userAgent,
            createdAt = activity.createdAt
        )
    }
}

/**
 * Platform user statistics response.
 */
data class PlatformUserStatsResponse(
    val total: Long,
    val active: Long,
    val inactive: Long,
    val suspended: Long,
    val byRole: RoleCountsResponse
) {
    companion object {
        fun from(stats: PlatformUserStats) = PlatformUserStatsResponse(
            total = stats.total,
            active = stats.active,
            inactive = stats.inactive,
            suspended = stats.suspended,
            byRole = RoleCountsResponse(
                PLATFORM_SUPER_ADMIN = stats.byRole[PlatformUserRole.PLATFORM_SUPER_ADMIN] ?: 0,
                PLATFORM_ADMIN = stats.byRole[PlatformUserRole.PLATFORM_ADMIN] ?: 0,
                ACCOUNT_MANAGER = stats.byRole[PlatformUserRole.ACCOUNT_MANAGER] ?: 0,
                SUPPORT_LEAD = stats.byRole[PlatformUserRole.SUPPORT_LEAD] ?: 0,
                SUPPORT_AGENT = stats.byRole[PlatformUserRole.SUPPORT_AGENT] ?: 0,
                PLATFORM_VIEWER = stats.byRole[PlatformUserRole.PLATFORM_VIEWER] ?: 0
            )
        )
    }
}

data class RoleCountsResponse(
    val PLATFORM_SUPER_ADMIN: Long,
    val PLATFORM_ADMIN: Long,
    val ACCOUNT_MANAGER: Long,
    val SUPPORT_LEAD: Long,
    val SUPPORT_AGENT: Long,
    val PLATFORM_VIEWER: Long
)
