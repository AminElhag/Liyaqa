package com.liyaqa.auth.api

import com.liyaqa.auth.application.commands.ChangePasswordCommand
import com.liyaqa.auth.application.commands.LoginCommand
import com.liyaqa.auth.application.commands.RefreshTokenCommand
import com.liyaqa.auth.application.commands.RegisterCommand
import com.liyaqa.auth.application.services.AuthResult
import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.organization.api.LocalizedTextResponse
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

// === Request DTOs ===

data class LoginRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    val email: String,

    @field:NotBlank(message = "Password is required")
    val password: String,

    /**
     * Tenant ID can be optional when accessed via subdomain.
     * If null, the tenant will be resolved from the subdomain.
     */
    val tenantId: UUID? = null,

    val deviceInfo: String? = null
) {
    /**
     * Creates a command with the provided tenant ID (from subdomain resolution).
     */
    fun toCommand(resolvedTenantId: UUID) = LoginCommand(
        email = email,
        password = password,
        tenantId = resolvedTenantId,
        deviceInfo = deviceInfo
    )
}

data class RegisterRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    val email: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val password: String,

    @field:NotBlank(message = "Display name (English) is required")
    val displayNameEn: String,

    val displayNameAr: String? = null,

    @field:NotNull(message = "Tenant ID is required")
    val tenantId: UUID
) {
    fun toCommand() = RegisterCommand(
        email = email,
        password = password,
        displayName = LocalizedText(en = displayNameEn, ar = displayNameAr),
        tenantId = tenantId,
        role = Role.MEMBER
    )
}

data class RefreshTokenRequest(
    @field:NotBlank(message = "Refresh token is required")
    val refreshToken: String,

    val deviceInfo: String? = null
) {
    fun toCommand() = RefreshTokenCommand(
        refreshToken = refreshToken,
        deviceInfo = deviceInfo
    )
}

data class LogoutRequest(
    @field:NotBlank(message = "Refresh token is required")
    val refreshToken: String
)

data class ChangePasswordRequest(
    @field:NotBlank(message = "Current password is required")
    val currentPassword: String,

    @field:NotBlank(message = "New password is required")
    @field:Size(min = 8, message = "New password must be at least 8 characters")
    val newPassword: String
) {
    fun toCommand(userId: UUID) = ChangePasswordCommand(
        userId = userId,
        currentPassword = currentPassword,
        newPassword = newPassword
    )
}

data class ForgotPasswordRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    val email: String,

    @field:NotNull(message = "Tenant ID is required")
    val tenantId: UUID
) {
    fun toCommand() = com.liyaqa.auth.application.commands.ForgotPasswordCommand(
        email = email,
        tenantId = tenantId
    )
}

data class ResetPasswordRequest(
    @field:NotBlank(message = "Token is required")
    val token: String,

    @field:NotBlank(message = "New password is required")
    @field:Size(min = 8, message = "New password must be at least 8 characters")
    val newPassword: String
) {
    fun toCommand() = com.liyaqa.auth.application.commands.ResetPasswordCommand(
        token = token,
        newPassword = newPassword
    )
}

data class MessageResponse(
    val message: String,
    val messageAr: String? = null
)

// === Response DTOs ===

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
    val user: UserResponse
) {
    companion object {
        fun from(result: AuthResult, organizationId: UUID? = null, permissions: List<String> = emptyList()) = AuthResponse(
            accessToken = result.accessToken,
            refreshToken = result.refreshToken,
            expiresIn = result.expiresIn,
            user = UserResponse.from(result.user, organizationId, permissions)
        )
    }
}

data class UserResponse(
    val id: UUID,
    val email: String,
    val displayName: LocalizedTextResponse,
    val role: Role,
    val status: UserStatus,
    val memberId: UUID?,
    val tenantId: UUID?,
    val organizationId: UUID?,
    val isPlatformUser: Boolean,
    val permissions: List<String>,
    val lastLoginAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        /**
         * Creates a UserResponse from a User entity.
         * @param user The user entity
         * @param organizationId Optional organization ID (looked up from club if needed)
         * @param permissions Optional list of permission codes
         */
        fun from(user: User, organizationId: UUID? = null, permissions: List<String> = emptyList()) = UserResponse(
            id = user.id,
            email = user.email,
            displayName = LocalizedTextResponse.from(user.displayName),
            role = user.role,
            status = user.status,
            memberId = user.memberId,
            tenantId = if (user.isPlatformUser) null else user.tenantId,
            organizationId = organizationId,
            isPlatformUser = user.isPlatformUser,
            permissions = permissions,
            lastLoginAt = user.lastLoginAt,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt
        )
    }
}

/**
 * Response for subdomain-based tenant resolution.
 * Used by frontend to determine if tenant ID field should be shown on login.
 */
data class TenantInfoResponse(
    /**
     * True if the tenant was resolved from subdomain.
     */
    val resolved: Boolean,

    /**
     * The resolved tenant (club) ID, if resolved is true.
     */
    val tenantId: UUID? = null,

    /**
     * The club name (bilingual).
     */
    val clubName: LocalizedTextResponse? = null,

    /**
     * The subdomain slug used to resolve the tenant.
     */
    val slug: String? = null
)