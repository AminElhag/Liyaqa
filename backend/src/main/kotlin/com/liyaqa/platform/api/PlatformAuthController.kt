package com.liyaqa.platform.api

import com.liyaqa.auth.api.RefreshTokenRequest
import com.liyaqa.auth.domain.model.RefreshToken
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserStatus
import com.liyaqa.platform.domain.ports.PlatformUserRepository
import com.liyaqa.shared.domain.LocalizedText
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

/**
 * Platform login request (no tenantId required).
 */
data class PlatformLoginRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    val email: String,

    @field:NotBlank(message = "Password is required")
    val password: String,

    val deviceInfo: String? = null
)

/**
 * Authentication controller for platform (internal team) users.
 * Platform users don't belong to a tenant - they manage the platform itself.
 */
@RestController
@RequestMapping("/api/platform/auth")
@Tag(name = "Platform Authentication", description = "Authentication for internal Liyaqa team")
@Transactional
class PlatformAuthController(
    private val platformUserRepository: PlatformUserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val passwordEncoder: PasswordEncoder
) {
    private val logger = LoggerFactory.getLogger(PlatformAuthController::class.java)

    @Operation(
        summary = "Platform Login",
        description = "Authenticates a platform user (internal team) with email and password. No tenantId required."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Login successful"),
        ApiResponse(responseCode = "401", description = "Invalid credentials"),
        ApiResponse(responseCode = "403", description = "Not a platform user")
    ])
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: PlatformLoginRequest): ResponseEntity<PlatformAuthResponse> {
        // Find platform user by email
        val user = platformUserRepository.findByEmail(request.email)
            .orElseThrow { IllegalArgumentException("Invalid email or password") }

        // Verify password
        if (!passwordEncoder.matches(request.password, user.passwordHash)) {
            throw IllegalArgumentException("Invalid email or password")
        }

        // Check if user can login
        if (!user.isActive()) {
            throw IllegalStateException("Account is ${user.status.name.lowercase()}. Please contact support.")
        }

        // Record successful login
        user.recordLogin()
        platformUserRepository.save(user)

        // Generate tokens using platform user adapter
        val accessToken = jwtTokenProvider.generatePlatformAccessToken(user)
        val (refreshToken, tokenHash) = jwtTokenProvider.generatePlatformRefreshToken(user)

        // Store refresh token (platform users use their own ID as tenant ID)
        val now = Instant.now()
        val refreshTokenEntity = RefreshToken(
            userId = user.id,
            tenantId = user.id, // Platform users use their own ID
            tokenHash = tokenHash,
            expiresAt = now.plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs()),
            absoluteExpiresAt = now.plusMillis(jwtTokenProvider.getAbsoluteSessionTimeoutMs()),
            deviceInfo = request.deviceInfo
        )
        refreshTokenRepository.save(refreshTokenEntity)

        logger.info("Platform user logged in: userId=${user.id} (${user.role})")

        return ResponseEntity.ok(
            PlatformAuthResponse(
                accessToken = accessToken,
                refreshToken = refreshToken,
                expiresIn = jwtTokenProvider.getAccessTokenExpirationMs() / 1000,
                user = PlatformUserResponse.from(user)
            )
        )
    }

    @Operation(
        summary = "Platform Token Refresh",
        description = "Refreshes access token for platform users"
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Tokens refreshed successfully"),
        ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    ])
    @PostMapping("/refresh")
    fun refresh(@Valid @RequestBody request: RefreshTokenRequest): ResponseEntity<PlatformAuthResponse> {
        if (!jwtTokenProvider.validateRefreshToken(request.refreshToken)) {
            throw IllegalArgumentException("Invalid or expired refresh token")
        }

        val tokenHash = jwtTokenProvider.hashToken(request.refreshToken)
        val storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow { IllegalArgumentException("Refresh token not found") }

        if (!storedToken.isValid()) {
            throw IllegalArgumentException("Refresh token has been revoked or expired")
        }

        // Revoke old refresh token
        storedToken.revoke()
        refreshTokenRepository.save(storedToken)

        val user = platformUserRepository.findById(storedToken.userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        if (!user.isActive()) {
            throw IllegalStateException("Account is ${user.status.name.lowercase()}")
        }

        // Generate new tokens
        val accessToken = jwtTokenProvider.generatePlatformAccessToken(user)
        val (refreshToken, newTokenHash) = jwtTokenProvider.generatePlatformRefreshToken(user)

        val now = Instant.now()
        val refreshTokenEntity = RefreshToken(
            userId = user.id,
            tenantId = user.id,
            tokenHash = newTokenHash,
            expiresAt = now.plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs()),
            absoluteExpiresAt = now.plusMillis(jwtTokenProvider.getAbsoluteSessionTimeoutMs()),
            deviceInfo = request.deviceInfo
        )
        refreshTokenRepository.save(refreshTokenEntity)

        return ResponseEntity.ok(
            PlatformAuthResponse(
                accessToken = accessToken,
                refreshToken = refreshToken,
                expiresIn = jwtTokenProvider.getAccessTokenExpirationMs() / 1000,
                user = PlatformUserResponse.from(user)
            )
        )
    }

    @Operation(
        summary = "Get Current Platform User",
        description = "Returns the current authenticated platform user's profile"
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "User profile retrieved"),
        ApiResponse(responseCode = "401", description = "Not authenticated"),
        ApiResponse(responseCode = "403", description = "Not a platform user")
    ])
    @GetMapping("/me")
    fun me(@AuthenticationPrincipal principal: JwtUserPrincipal): ResponseEntity<PlatformUserResponse> {
        val user = platformUserRepository.findById(principal.userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        return ResponseEntity.ok(PlatformUserResponse.from(user))
    }
}

/**
 * Platform authentication response.
 */
data class PlatformAuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: PlatformUserResponse
)

/**
 * Platform user response DTO.
 */
data class PlatformUserResponse(
    val id: UUID,
    val email: String,
    val displayName: LocalizedText,
    val role: String,
    val status: String,
    val phoneNumber: String?,
    val avatarUrl: String?,
    val lastLoginAt: Instant?,
    val isPlatformUser: Boolean = true
) {
    companion object {
        fun from(user: PlatformUser): PlatformUserResponse {
            return PlatformUserResponse(
                id = user.id,
                email = user.email,
                displayName = user.displayName,
                role = user.role.name,
                status = user.status.name,
                phoneNumber = user.phoneNumber,
                avatarUrl = user.avatarUrl,
                lastLoginAt = user.lastLoginAt
            )
        }
    }
}
