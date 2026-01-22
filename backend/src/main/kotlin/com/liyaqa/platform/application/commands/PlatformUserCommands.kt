package com.liyaqa.platform.application.commands

import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.model.PlatformUserStatus
import com.liyaqa.shared.domain.LocalizedText
import java.util.UUID

/**
 * Command to create a new platform user.
 */
data class CreatePlatformUserCommand(
    val email: String,
    val password: String,
    val displayName: LocalizedText,
    val role: PlatformUserRole,
    val phoneNumber: String? = null,
    val createdById: UUID? = null
)

/**
 * Command to update an existing platform user.
 */
data class UpdatePlatformUserCommand(
    val displayName: LocalizedText? = null,
    val role: PlatformUserRole? = null,
    val phoneNumber: String? = null,
    val avatarUrl: String? = null
)

/**
 * Command to change user status.
 */
data class ChangeUserStatusCommand(
    val status: PlatformUserStatus,
    val reason: String? = null
)

/**
 * Command to reset user password.
 */
data class ResetUserPasswordCommand(
    val newPassword: String
)
