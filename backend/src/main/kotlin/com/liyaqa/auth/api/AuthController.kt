package com.liyaqa.auth.api

import com.liyaqa.auth.application.services.AuthService
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService
) {
    /**
     * Authenticates a user with email and password.
     * Returns JWT access and refresh tokens.
     */
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<AuthResponse> {
        val result = authService.login(request.toCommand())
        return ResponseEntity.ok(AuthResponse.from(result))
    }

    /**
     * Registers a new user account.
     * Returns JWT access and refresh tokens.
     */
    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<AuthResponse> {
        val result = authService.register(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(result))
    }

    /**
     * Refreshes the access token using a valid refresh token.
     */
    @PostMapping("/refresh")
    fun refresh(@Valid @RequestBody request: RefreshTokenRequest): ResponseEntity<AuthResponse> {
        val result = authService.refreshTokens(request.toCommand())
        return ResponseEntity.ok(AuthResponse.from(result))
    }

    /**
     * Logs out by revoking the provided refresh token.
     */
    @PostMapping("/logout")
    fun logout(@Valid @RequestBody request: LogoutRequest): ResponseEntity<Unit> {
        authService.logout(request.refreshToken)
        return ResponseEntity.noContent().build()
    }

    /**
     * Logs out from all devices by revoking all refresh tokens.
     * Requires authentication.
     */
    @PostMapping("/logout-all")
    fun logoutAll(@AuthenticationPrincipal principal: JwtUserPrincipal): ResponseEntity<Unit> {
        authService.logoutAll(principal.userId)
        return ResponseEntity.noContent().build()
    }

    /**
     * Gets the currently authenticated user's profile.
     * Requires authentication.
     */
    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal principal: JwtUserPrincipal): ResponseEntity<UserResponse> {
        val user = authService.getCurrentUser(principal.userId)
        return ResponseEntity.ok(UserResponse.from(user))
    }

    /**
     * Changes the authenticated user's password.
     * Requires authentication.
     */
    @PostMapping("/change-password")
    fun changePassword(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @Valid @RequestBody request: ChangePasswordRequest
    ): ResponseEntity<Unit> {
        authService.changePassword(request.toCommand(principal.userId))
        return ResponseEntity.noContent().build()
    }
}