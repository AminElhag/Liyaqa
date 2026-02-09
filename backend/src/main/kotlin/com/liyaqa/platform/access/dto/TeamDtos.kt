package com.liyaqa.platform.access.dto

import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserRole
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class InviteTeamMemberRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    val email: String,

    @field:NotBlank(message = "Display name (English) is required")
    val displayNameEn: String,

    val displayNameAr: String? = null,

    val role: PlatformUserRole,

    val phoneNumber: String? = null
)

data class ChangeRoleRequest(
    val role: PlatformUserRole
)

data class SetPasswordFromTokenRequest(
    @field:NotBlank(message = "Token is required")
    val token: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val newPassword: String
)

data class TeamMemberResponse(
    val id: UUID,
    val email: String,
    val displayNameEn: String,
    val displayNameAr: String?,
    val role: PlatformUserRole,
    val status: String,
    val lastLoginAt: Instant?,
    val createdAt: Instant
) {
    companion object {
        fun from(user: PlatformUser): TeamMemberResponse {
            return TeamMemberResponse(
                id = user.id,
                email = user.email,
                displayNameEn = user.displayName.en,
                displayNameAr = user.displayName.ar,
                role = user.role,
                status = user.status.name,
                lastLoginAt = user.lastLoginAt,
                createdAt = user.createdAt
            )
        }
    }
}

data class InviteResponse(
    val email: String,
    val message: String,
    val expiresAt: Instant
)

data class PasswordResetResponse(
    val email: String,
    val message: String,
    val expiresAt: Instant
)
