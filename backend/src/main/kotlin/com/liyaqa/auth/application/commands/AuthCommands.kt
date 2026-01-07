package com.liyaqa.auth.application.commands

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.shared.domain.LocalizedText
import java.util.UUID

/**
 * Command for user login.
 */
data class LoginCommand(
    val email: String,
    val password: String,
    val tenantId: UUID,
    val deviceInfo: String? = null
)

/**
 * Command for user registration.
 */
data class RegisterCommand(
    val email: String,
    val password: String,
    val displayName: LocalizedText,
    val tenantId: UUID,
    val role: Role = Role.MEMBER
)

/**
 * Command for refreshing tokens.
 */
data class RefreshTokenCommand(
    val refreshToken: String,
    val deviceInfo: String? = null
)

/**
 * Command for changing password.
 */
data class ChangePasswordCommand(
    val userId: UUID,
    val currentPassword: String,
    val newPassword: String
)

/**
 * Command for creating a user (admin operation).
 */
data class CreateUserCommand(
    val email: String,
    val password: String,
    val displayName: LocalizedText,
    val role: Role,
    val memberId: UUID? = null
)

/**
 * Command for updating a user.
 */
data class UpdateUserCommand(
    val displayName: LocalizedText? = null,
    val role: Role? = null,
    val memberId: UUID? = null
)

/**
 * Command for requesting a password reset.
 */
data class ForgotPasswordCommand(
    val email: String,
    val tenantId: UUID
)

/**
 * Command for resetting password with token.
 */
data class ResetPasswordCommand(
    val token: String,
    val newPassword: String
)