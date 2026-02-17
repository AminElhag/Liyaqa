package com.liyaqa.auth.api

import com.liyaqa.auth.application.commands.CreateUserCommand
import com.liyaqa.auth.application.commands.UpdateUserCommand
import com.liyaqa.auth.domain.model.Role
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.util.UUID

// === Request DTOs ===

data class CreateUserRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    val email: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val password: String,

    @field:NotBlank(message = "Display name (English) is required")
    val displayNameEn: String,

    val displayNameAr: String? = null,

    @field:NotNull(message = "Role is required")
    val role: Role,

    val memberId: UUID? = null
) {
    fun toCommand() = CreateUserCommand(
        email = email,
        password = password,
        displayName = LocalizedText(en = displayNameEn, ar = displayNameAr),
        role = role,
        memberId = memberId
    )
}

data class UpdateUserRequest(
    val displayNameEn: String? = null,
    val displayNameAr: String? = null,
    val role: Role? = null,
    val memberId: UUID? = null
) {
    fun toCommand(): UpdateUserCommand {
        val displayName = if (displayNameEn != null) {
            LocalizedText(en = displayNameEn, ar = displayNameAr)
        } else null

        return UpdateUserCommand(
            displayName = displayName,
            role = role,
            memberId = memberId
        )
    }
}

data class LinkMemberRequest(
    @field:NotNull(message = "Member ID is required")
    val memberId: UUID
)

data class AdminResetPasswordRequest(
    @field:NotBlank(message = "New password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val newPassword: String
)