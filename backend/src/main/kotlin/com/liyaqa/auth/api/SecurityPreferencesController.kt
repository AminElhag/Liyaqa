package com.liyaqa.auth.api

import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Security preferences controller for managing user security settings.
 */
@RestController
@RequestMapping("/api/auth/security-preferences")
@Tag(name = "Security Preferences", description = "Manage user security preferences")
class SecurityPreferencesController(
    private val userRepository: UserRepository
) {

    @Operation(summary = "Get security preferences", description = "Retrieves the current user's security preferences")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Security preferences retrieved successfully")
    ])
    @GetMapping
    fun getSecurityPreferences(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<SecurityPreferencesResponse> {
        val user = userRepository.findById(principal.userId)
            .orElseThrow { NoSuchElementException("User not found") }

        return ResponseEntity.ok(SecurityPreferencesResponse.from(user))
    }

    @Operation(
        summary = "Update security preferences",
        description = "Updates the current user's security preferences. " +
                "IP binding prevents token refresh from different IP addresses for enhanced security."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Security preferences updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request")
    ])
    @PutMapping
    fun updateSecurityPreferences(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @Valid @RequestBody request: UpdateSecurityPreferencesRequest
    ): ResponseEntity<SecurityPreferencesResponse> {
        val user = userRepository.findById(principal.userId)
            .orElseThrow { NoSuchElementException("User not found") }

        // Update IP binding preference
        request.ipBindingEnabled?.let {
            user.ipBindingEnabled = it
        }

        val updatedUser = userRepository.save(user)

        return ResponseEntity.ok(SecurityPreferencesResponse.from(updatedUser))
    }
}

/**
 * Response containing user's security preferences.
 */
data class SecurityPreferencesResponse(
    val ipBindingEnabled: Boolean
) {
    companion object {
        fun from(user: com.liyaqa.auth.domain.model.User): SecurityPreferencesResponse {
            return SecurityPreferencesResponse(
                ipBindingEnabled = user.ipBindingEnabled
            )
        }
    }
}

/**
 * Request to update security preferences.
 */
data class UpdateSecurityPreferencesRequest(
    @field:NotNull(message = "IP binding enabled flag is required")
    val ipBindingEnabled: Boolean?
)
