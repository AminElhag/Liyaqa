package com.liyaqa.auth.application.services

import com.liyaqa.auth.application.commands.ChangePasswordCommand
import com.liyaqa.auth.application.commands.ForgotPasswordCommand
import com.liyaqa.auth.application.commands.LoginCommand
import com.liyaqa.auth.application.commands.RefreshTokenCommand
import com.liyaqa.auth.application.commands.RegisterCommand
import com.liyaqa.auth.application.commands.ResetPasswordCommand
import com.liyaqa.auth.domain.model.PasswordResetToken
import com.liyaqa.auth.domain.model.RefreshToken
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.PasswordResetTokenRepository
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.shared.application.services.PermissionService
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import com.liyaqa.shared.infrastructure.email.EmailService
import org.slf4j.LoggerFactory
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
    private val passwordResetTokenRepository: PasswordResetTokenRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val passwordEncoder: PasswordEncoder,
    private val emailService: EmailService,
    private val permissionService: PermissionService
) {
    private val logger = LoggerFactory.getLogger(AuthService::class.java)
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

        // Grant default permissions for the user's role
        permissionService.grantDefaultPermissionsForRole(savedUser.id, savedUser.role.name)

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

        // Send password changed notification email
        sendPasswordChangedNotification(user)
    }

    /**
     * Gets the currently authenticated user.
     */
    @Transactional(readOnly = true)
    fun getCurrentUser(userId: UUID): User {
        return userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }
    }

    /**
     * Initiates password reset flow.
     * Generates a reset token and sends email (or logs if email disabled).
     * Always returns success to prevent email enumeration.
     * Token is NEVER exposed in API response - only sent via email.
     */
    fun forgotPassword(command: ForgotPasswordCommand, locale: String = "en") {
        TenantContext.setCurrentTenant(TenantId(command.tenantId))

        val user = userRepository.findByEmailAndTenantId(command.email, command.tenantId)
            .orElse(null)

        // Always return success to prevent email enumeration attacks
        if (user == null) {
            logger.info("Password reset requested for unknown email")
            return
        }

        // Delete any existing reset tokens for this user
        passwordResetTokenRepository.deleteByUserId(user.id)

        // Generate new token
        val rawToken = UUID.randomUUID().toString()
        val tokenHash = jwtTokenProvider.hashToken(rawToken)

        val resetToken = PasswordResetToken(
            userId = user.id,
            tenantId = user.tenantId,
            tokenHash = tokenHash,
            expiresAt = Instant.now().plusSeconds(3600) // 1 hour
        )

        passwordResetTokenRepository.save(resetToken)

        // Send password reset email (or log if email service is disabled)
        try {
            emailService.sendPasswordResetEmail(user.email, rawToken, locale)
            logger.info("Password reset initiated for user: ${user.id}")
        } catch (e: Exception) {
            logger.error("Failed to send password reset email for user: ${user.id}", e)
            // Token is only sent via email - never exposed in API
        }
    }

    /**
     * Resets password using a valid reset token.
     * @throws IllegalArgumentException if token is invalid or expired
     */
    fun resetPassword(command: ResetPasswordCommand) {
        val tokenHash = jwtTokenProvider.hashToken(command.token)

        val resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow { IllegalArgumentException("Invalid or expired reset token") }

        if (!resetToken.isValid()) {
            throw IllegalArgumentException("Reset token has expired or already been used")
        }

        val user = userRepository.findById(resetToken.userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        // Update password
        user.changePassword(passwordEncoder.encode(command.newPassword)!!)
        userRepository.save(user)

        // Mark token as used
        resetToken.markUsed()
        passwordResetTokenRepository.save(resetToken)

        // Revoke all refresh tokens for security
        refreshTokenRepository.revokeAllByUserId(user.id)

        logger.info("Password reset successful for user: ${user.id}")
    }

    /**
     * Cleans up expired password reset tokens.
     */
    fun cleanupExpiredResetTokens() {
        passwordResetTokenRepository.deleteExpiredTokens(Instant.now())
    }

    private fun generateTokens(user: User, deviceInfo: String?): AuthResult {
        // Load user's permissions
        val permissions = permissionService.getUserPermissionCodes(user.id)

        val accessToken = jwtTokenProvider.generateAccessToken(user, permissions)
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

    /**
     * Sends a password changed notification email for security purposes.
     */
    private fun sendPasswordChangedNotification(user: User) {
        try {
            val htmlBody = """
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Password Changed Successfully</h2>
                    <p>Hello,</p>
                    <p>Your password has been changed successfully.</p>
                    <p>If you did not make this change, please contact support immediately.</p>
                    <p>For security, all your active sessions have been logged out.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">This is a security notification from Liyaqa.</p>

                    <h2 dir="rtl" style="text-align: right;">تم تغيير كلمة المرور بنجاح</h2>
                    <p dir="rtl" style="text-align: right;">مرحباً،</p>
                    <p dir="rtl" style="text-align: right;">تم تغيير كلمة المرور الخاصة بك بنجاح.</p>
                    <p dir="rtl" style="text-align: right;">إذا لم تقم بهذا التغيير، يرجى التواصل مع الدعم فوراً.</p>
                    <p dir="rtl" style="text-align: right;">لأسباب أمنية، تم تسجيل خروجك من جميع الجلسات النشطة.</p>
                    <hr>
                    <p dir="rtl" style="color: #666; font-size: 12px; text-align: right;">هذا إشعار أمني من لياقة.</p>
                </body>
                </html>
            """.trimIndent()

            emailService.sendHtmlEmail(
                to = user.email,
                subject = "Password Changed - تم تغيير كلمة المرور - Liyaqa",
                htmlBody = htmlBody
            )
            logger.info("Password changed notification sent for user: ${user.id}")
        } catch (e: Exception) {
            // Log error but don't fail the password change operation
            logger.error("Failed to send password changed notification for user ${user.id}: ${e.message}", e)
        }
    }
}