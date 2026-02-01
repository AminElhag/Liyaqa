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

/**
 * Result indicating MFA is required before completing login.
 */
data class MfaRequiredResult(
    val userId: UUID,
    val email: String
)

/**
 * Sealed class representing login result - either success with tokens or MFA required.
 */
sealed class LoginResult {
    data class Success(val authResult: AuthResult) : LoginResult()
    data class MfaRequired(val mfaResult: MfaRequiredResult) : LoginResult()
}

@Service
@Transactional
class AuthService(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val passwordResetTokenRepository: PasswordResetTokenRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val passwordEncoder: PasswordEncoder,
    private val emailService: EmailService,
    private val permissionService: PermissionService,
    private val passwordPolicyService: PasswordPolicyService,
    private val auditService: com.liyaqa.shared.application.services.AuditService,
    private val securityEmailService: com.liyaqa.notification.application.services.SecurityEmailService,
    private val sessionService: SessionService
) {
    private val logger = LoggerFactory.getLogger(AuthService::class.java)
    /**
     * Authenticates a user with email and password.
     * Returns MfaRequired if MFA is enabled, otherwise returns tokens.
     * @throws IllegalArgumentException if credentials are invalid
     * @throws IllegalStateException if user account is not active
     */
    fun login(command: LoginCommand): LoginResult {
        // Set tenant context for query
        TenantContext.setCurrentTenant(TenantId(command.tenantId))

        val user = userRepository.findByEmailAndTenantId(command.email, command.tenantId)
            .orElseThrow { IllegalArgumentException("Invalid email or password") }

        if (!passwordEncoder.matches(command.password, user.passwordHash)) {
            val wasLocked = user.status == com.liyaqa.auth.domain.model.UserStatus.LOCKED
            user.recordFailedLogin()
            val isNowLocked = user.status == com.liyaqa.auth.domain.model.UserStatus.LOCKED
            userRepository.save(user)

            // Send account locked notification if this failed attempt triggered the lock
            if (!wasLocked && isNowLocked) {
                sendAccountLockedNotification(user, command.deviceInfo ?: "Unknown")
            }

            throw IllegalArgumentException("Invalid email or password")
        }

        if (!user.canLogin()) {
            throw IllegalStateException("Account is ${user.status.name.lowercase()}. Please contact support.")
        }

        // Check if MFA is enabled
        if (user.mfaEnabled) {
            logger.info("MFA required for user: ${user.id}")
            return LoginResult.MfaRequired(
                MfaRequiredResult(
                    userId = user.id,
                    email = user.email
                )
            )
        }

        user.recordSuccessfulLogin()
        userRepository.save(user)

        return LoginResult.Success(generateTokens(user, command.deviceInfo))
    }

    /**
     * Verifies MFA code and completes login.
     * @param userId The user ID from MFA required response
     * @param code The TOTP code or backup code
     * @param deviceInfo Optional device information
     * @throws IllegalArgumentException if code is invalid
     */
    fun verifyMfaAndLogin(userId: UUID, code: String, deviceInfo: String?): AuthResult {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        if (!user.mfaEnabled) {
            throw IllegalStateException("MFA is not enabled for this user")
        }

        // Set tenant context
        TenantContext.setCurrentTenant(TenantId(user.tenantId))

        // Verify MFA code (this will be delegated to MfaService via controller)
        // For now, we assume the code has been verified
        user.recordSuccessfulLogin()
        userRepository.save(user)

        return generateTokens(user, deviceInfo)
    }

    /**
     * Registers a new user.
     * @throws IllegalArgumentException if email is already taken or password violates policy
     */
    fun register(command: RegisterCommand): AuthResult {
        // Set tenant context
        TenantContext.setCurrentTenant(TenantId(command.tenantId))

        if (userRepository.existsByEmailAndTenantId(command.email, command.tenantId)) {
            throw IllegalArgumentException("Email is already registered")
        }

        // Validate password against policy (no history check for new users)
        val isPlatformUser = command.role.name.startsWith("PLATFORM_")
        val policyConfig = passwordPolicyService.getPolicyForUser(isPlatformUser)
        val validationResult = passwordPolicyService.validatePassword(command.password, policyConfig)

        if (!validationResult.isValid) {
            throw IllegalArgumentException(validationResult.violations.joinToString(". "))
        }

        val passwordHash = passwordEncoder.encode(command.password)!!

        val user = User(
            email = command.email,
            passwordHash = passwordHash,
            displayName = command.displayName,
            role = command.role,
            status = UserStatus.ACTIVE,
            isPlatformUser = isPlatformUser
        )

        val savedUser = userRepository.save(user)

        // Record password in history
        passwordPolicyService.recordPasswordInHistory(savedUser.id, passwordHash, policyConfig)

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

        // Check if token has been revoked
        if (storedToken.isRevoked()) {
            throw IllegalArgumentException("Refresh token has been revoked")
        }

        // Check if absolute session timeout has been exceeded
        if (storedToken.isAbsoluteExpired()) {
            storedToken.revoke()
            refreshTokenRepository.save(storedToken)
            throw IllegalStateException("Session has exceeded maximum duration (${jwtTokenProvider.getAbsoluteSessionTimeoutMs() / 3600000} hours). Please log in again.")
        }

        // Check if regular token expiration
        if (storedToken.isExpired()) {
            throw IllegalArgumentException("Refresh token has expired")
        }

        // Revoke old refresh token
        storedToken.revoke()
        refreshTokenRepository.save(storedToken)

        val user = userRepository.findById(storedToken.userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        if (!user.canLogin()) {
            throw IllegalStateException("Account is ${user.status.name.lowercase()}")
        }

        // Set tenant context for permission queries
        TenantContext.setCurrentTenant(TenantId(user.tenantId))

        // Validate IP binding if enabled
        if (!sessionService.validateIpBinding(user.id, command.ipAddress)) {
            storedToken.revoke()
            refreshTokenRepository.save(storedToken)
            throw IllegalStateException("IP address validation failed. Your session may have been compromised. Please log in again from your original location.")
        }

        return generateTokens(user, command.deviceInfo, command.ipAddress)
    }

    /**
     * Logs out user by revoking their refresh token and session.
     */
    fun logout(refreshToken: String, userId: UUID? = null) {
        val tokenHash = jwtTokenProvider.hashToken(refreshToken)
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent { token ->
            token.revoke()
            refreshTokenRepository.save(token)

            // Also revoke the current session if userId is provided
            userId?.let {
                try {
                    sessionService.revokeAllSessions(it, exceptSessionId = null)
                    logger.debug("Session revoked for user: $it")
                } catch (e: Exception) {
                    logger.error("Failed to revoke session for user $it: ${e.message}", e)
                }
            }
        }
    }

    /**
     * Logs out user from all devices by revoking all refresh tokens and sessions.
     */
    fun logoutAll(userId: UUID) {
        refreshTokenRepository.revokeAllByUserId(userId)

        // Also revoke all sessions
        try {
            sessionService.revokeAllSessions(userId, exceptSessionId = null)
            logger.info("All sessions revoked for user: $userId")
        } catch (e: Exception) {
            logger.error("Failed to revoke all sessions for user $userId: ${e.message}", e)
        }
    }

    /**
     * Changes user password.
     * @throws IllegalArgumentException if current password is incorrect or new password violates policy
     */
    fun changePassword(command: ChangePasswordCommand) {
        val user = userRepository.findById(command.userId)
            .orElseThrow { NoSuchElementException("User not found: ${command.userId}") }

        if (!passwordEncoder.matches(command.currentPassword, user.passwordHash)) {
            throw IllegalArgumentException("Current password is incorrect")
        }

        // Validate new password against policy including history check
        val policyConfig = passwordPolicyService.getPolicyForUser(user.isPlatformUser)
        val validationResult = passwordPolicyService.validatePasswordWithHistory(
            command.newPassword,
            user.id,
            policyConfig
        )

        if (!validationResult.isValid) {
            throw IllegalArgumentException(validationResult.violations.joinToString(". "))
        }

        val newPasswordHash = passwordEncoder.encode(command.newPassword)!!
        user.changePassword(newPasswordHash)
        userRepository.save(user)

        // Record new password in history
        passwordPolicyService.recordPasswordInHistory(user.id, newPasswordHash, policyConfig)

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
     * @throws IllegalArgumentException if token is invalid, expired, or new password violates policy
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

        // Validate new password against policy including history check
        val policyConfig = passwordPolicyService.getPolicyForUser(user.isPlatformUser)
        val validationResult = passwordPolicyService.validatePasswordWithHistory(
            command.newPassword,
            user.id,
            policyConfig
        )

        if (!validationResult.isValid) {
            throw IllegalArgumentException(validationResult.violations.joinToString(". "))
        }

        // Update password
        val newPasswordHash = passwordEncoder.encode(command.newPassword)!!
        user.changePassword(newPasswordHash)
        userRepository.save(user)

        // Record new password in history
        passwordPolicyService.recordPasswordInHistory(user.id, newPasswordHash, policyConfig)

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

    /**
     * Generates tokens for a user (used by OAuth flow).
     * Public method for external use.
     */
    fun generateTokensForUser(user: User, deviceInfo: String?): AuthResult {
        return generateTokens(user, deviceInfo, null)
    }

    private fun generateTokens(user: User, deviceInfo: String?, ipAddress: String? = null): AuthResult {
        // Load user's permissions
        val permissions = permissionService.getUserPermissionCodes(user.id)

        val accessToken = jwtTokenProvider.generateAccessToken(user, permissions)
        val (refreshToken, tokenHash) = jwtTokenProvider.generateRefreshToken(user)

        // Store refresh token with absolute session timeout
        val now = Instant.now()
        val refreshTokenEntity = RefreshToken(
            userId = user.id,
            tenantId = user.tenantId,
            tokenHash = tokenHash,
            expiresAt = now.plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs()),
            absoluteExpiresAt = now.plusMillis(jwtTokenProvider.getAbsoluteSessionTimeoutMs()),
            deviceInfo = deviceInfo
        )
        refreshTokenRepository.save(refreshTokenEntity)

        // Create session tracking
        try {
            sessionService.createSession(
                userId = user.id,
                accessToken = accessToken,
                deviceInfo = deviceInfo,
                ipAddress = ipAddress,
                request = null // Will be enhanced when HttpServletRequest is available in controller
            )
            logger.debug("Session created for user: ${user.id}")
        } catch (e: Exception) {
            // Log but don't fail login if session creation fails
            logger.error("Failed to create session for user ${user.id}: ${e.message}", e)
        }

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

    /**
     * Sends an account locked notification email to the user.
     *
     * @param user The user whose account was locked
     * @param deviceInfo Optional device information
     */
    private fun sendAccountLockedNotification(user: User, deviceInfo: String) {
        try {
            val userName = user.displayName.en ?: user.email
            securityEmailService.sendAccountLockedNotification(
                email = user.email,
                userName = userName,
                lockTimestamp = Instant.now(),
                ipAddress = "Unknown", // Will be enhanced when HttpServletRequest is available
                deviceInfo = deviceInfo,
                failedAttempts = user.failedLoginAttempts
            )
            logger.info("Account locked notification sent for user: ${user.id}")
        } catch (e: Exception) {
            // Log error but don't fail the lockout process
            logger.error("Failed to send account locked notification for user ${user.id}: ${e.message}", e)
        }
    }
}