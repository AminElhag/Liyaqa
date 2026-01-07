package com.liyaqa.auth.application.services

import com.liyaqa.auth.application.commands.ChangePasswordCommand
import com.liyaqa.auth.application.commands.LoginCommand
import com.liyaqa.auth.application.commands.RefreshTokenCommand
import com.liyaqa.auth.application.commands.RegisterCommand
import com.liyaqa.auth.domain.model.RefreshToken
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * Authentication result containing tokens and user info.
 */
data class AuthResult(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: User
)

@Service
@Transactional
class AuthService(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val passwordEncoder: PasswordEncoder
) {
    /**
     * Authenticates a user with email and password.
     * @throws IllegalArgumentException if credentials are invalid
     * @throws IllegalStateException if user account is not active
     */
    fun login(command: LoginCommand): AuthResult {
        // Set tenant context for query
        TenantContext.setCurrentTenant(TenantId(command.tenantId))

        val user = userRepository.findByEmailAndTenantId(command.email, command.tenantId)
            .orElseThrow { IllegalArgumentException("Invalid email or password") }

        if (!passwordEncoder.matches(command.password, user.passwordHash)) {
            user.recordFailedLogin()
            userRepository.save(user)
            throw IllegalArgumentException("Invalid email or password")
        }

        if (!user.canLogin()) {
            throw IllegalStateException("Account is ${user.status.name.lowercase()}. Please contact support.")
        }

        user.recordSuccessfulLogin()
        userRepository.save(user)

        return generateTokens(user, command.deviceInfo)
    }

    /**
     * Registers a new user.
     * @throws IllegalArgumentException if email is already taken
     */
    fun register(command: RegisterCommand): AuthResult {
        // Set tenant context
        TenantContext.setCurrentTenant(TenantId(command.tenantId))

        if (userRepository.existsByEmailAndTenantId(command.email, command.tenantId)) {
            throw IllegalArgumentException("Email is already registered")
        }

        val user = User(
            email = command.email,
            passwordHash = passwordEncoder.encode(command.password)!!,
            displayName = command.displayName,
            role = command.role,
            status = UserStatus.ACTIVE
        )

        val savedUser = userRepository.save(user)
        return generateTokens(savedUser, null)
    }

    /**
     * Refreshes access token using a valid refresh token.
     * @throws IllegalArgumentException if refresh token is invalid
     */
    fun refreshTokens(command: RefreshTokenCommand): AuthResult {
        if (!jwtTokenProvider.validateRefreshToken(command.refreshToken)) {
            throw IllegalArgumentException("Invalid or expired refresh token")
        }

        val tokenHash = jwtTokenProvider.hashToken(command.refreshToken)
        val storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow { IllegalArgumentException("Refresh token not found") }

        if (!storedToken.isValid()) {
            throw IllegalArgumentException("Refresh token has been revoked or expired")
        }

        // Revoke old refresh token
        storedToken.revoke()
        refreshTokenRepository.save(storedToken)

        val user = userRepository.findById(storedToken.userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        if (!user.canLogin()) {
            throw IllegalStateException("Account is ${user.status.name.lowercase()}")
        }

        return generateTokens(user, command.deviceInfo)
    }

    /**
     * Logs out user by revoking their refresh token.
     */
    fun logout(refreshToken: String) {
        val tokenHash = jwtTokenProvider.hashToken(refreshToken)
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent { token ->
            token.revoke()
            refreshTokenRepository.save(token)
        }
    }

    /**
     * Logs out user from all devices by revoking all refresh tokens.
     */
    fun logoutAll(userId: UUID) {
        refreshTokenRepository.revokeAllByUserId(userId)
    }

    /**
     * Changes user password.
     * @throws IllegalArgumentException if current password is incorrect
     */
    fun changePassword(command: ChangePasswordCommand) {
        val user = userRepository.findById(command.userId)
            .orElseThrow { NoSuchElementException("User not found: ${command.userId}") }

        if (!passwordEncoder.matches(command.currentPassword, user.passwordHash)) {
            throw IllegalArgumentException("Current password is incorrect")
        }

        user.changePassword(passwordEncoder.encode(command.newPassword)!!)
        userRepository.save(user)

        // Revoke all existing refresh tokens for security
        refreshTokenRepository.revokeAllByUserId(user.id)
    }

    /**
     * Gets the currently authenticated user.
     */
    @Transactional(readOnly = true)
    fun getCurrentUser(userId: UUID): User {
        return userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }
    }

    private fun generateTokens(user: User, deviceInfo: String?): AuthResult {
        val accessToken = jwtTokenProvider.generateAccessToken(user)
        val (refreshToken, tokenHash) = jwtTokenProvider.generateRefreshToken(user)

        // Store refresh token
        val refreshTokenEntity = RefreshToken(
            userId = user.id,
            tenantId = user.tenantId,
            tokenHash = tokenHash,
            expiresAt = Instant.now().plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs()),
            deviceInfo = deviceInfo
        )
        refreshTokenRepository.save(refreshTokenEntity)

        return AuthResult(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresIn = jwtTokenProvider.getAccessTokenExpirationMs() / 1000,
            user = user
        )
    }
}