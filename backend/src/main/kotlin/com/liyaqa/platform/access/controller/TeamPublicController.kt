package com.liyaqa.platform.access.controller

import com.liyaqa.platform.access.dto.SetPasswordFromTokenRequest
import com.liyaqa.platform.access.service.TeamService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/platform/auth")
@Tag(name = "Platform Team Public", description = "Public endpoints for accepting invites and resetting passwords")
class TeamPublicController(
    private val teamService: TeamService
) {

    @Operation(summary = "Accept team invite and set password")
    @PostMapping("/accept-invite")
    fun acceptInvite(
        @Valid @RequestBody request: SetPasswordFromTokenRequest
    ): ResponseEntity<Map<String, String>> {
        teamService.acceptInvite(request.token, request.newPassword)
        return ResponseEntity.ok(mapOf("message" to "Password set successfully. You can now log in."))
    }

    @Operation(summary = "Reset password from token")
    @PostMapping("/reset-password-token")
    fun resetPassword(
        @Valid @RequestBody request: SetPasswordFromTokenRequest
    ): ResponseEntity<Map<String, String>> {
        teamService.resetPassword(request.token, request.newPassword)
        return ResponseEntity.ok(mapOf("message" to "Password reset successfully. You can now log in."))
    }
}
