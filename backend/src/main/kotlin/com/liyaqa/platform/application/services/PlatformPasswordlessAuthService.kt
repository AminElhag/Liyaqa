package com.liyaqa.platform.application.services

import com.liyaqa.auth.domain.model.RefreshToken
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.notification.application.services.PlatformLoginEmailService
import com.liyaqa.platform.api.PlatformAuthResponse
import com.liyaqa.platform.api.PlatformUserResponse
import com.liyaqa.platform.domain.model.PlatformRolePermissions
import com.liyaqa.platform.domain.model.PlatformLoginToken
import com.liyaqa.platform.domain.ports.PlatformLoginTokenRepository
import com.liyaqa.platform.domain.ports.PlatformUserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

/**
 * Service for platform passwordless authentication via email OTP codes.
 * Implements security features: rate limiting, brute force protection, one-time use codes.
 */
@Service
@Transactional
class PlatformPasswordlessAuthService(
    private val platformUserRepository: PlatformUserRepository,
    private val loginTokenRepository: PlatformLoginTokenRepository,
    private val emailService: PlatformLoginEmailService,
    private val jwtTokenProvider: JwtTokenProvider,
    private val refreshTokenRepository: RefreshTokenRepository
) {
    private val logger = LoggerFactory.getLogger(PlatformPasswordlessAuthService::class.java)

    // In-memory rate limiting cache: email -> list of request timestamps
    private val rateLimitCache = ConcurrentHashMap<String, MutableList<Instant>>()

    companion object {
        private const val MAX_REQUESTS_PER_WINDOW = 3
        private const val RATE_LIMIT_WINDOW_MINUTES = 15L
        private const val CODE_VALIDITY_MINUTES = 10L
    }

    /**
     * Send a login code to the user's email.
     * Implements rate limiting to prevent abuse.
     *
     * @param email User's email address
     * @return Response with expiration time
     * @throws IllegalStateException if rate limit exceeded or email sending fails
     */
    fun sendLoginCode(email: String): SendCodeResponse {
        val normalizedEmail = email.trim().lowercase()

        // Check rate limiting (in-memory for now)
        if (isRateLimited(normalizedEmail)) {
            logger.warn("Rate limit exceeded for email: $normalizedEmail")
            throw IllegalStateException("Too many requests. Please wait before requesting another code.")
        }

        // Verify user exists and is a platform user
        val user = platformUserRepository.findByEmail(normalizedEmail)
            .orElseThrow {
                // Generic error to prevent email enumeration
                logger.warn("Login code requested for non-existent email: $normalizedEmail")
                IllegalArgumentException("If this email is registered, you will receive a code shortly.")
            }

        // Verify user can login
        if (!user.isActive()) {
            logger.warn("Login code requested for inactive user: ${user.id}")
            throw IllegalStateException("Account is ${user.status.name.lowercase()}. Please contact support.")
        }

        // Delete any existing tokens for this email (invalidate old codes)
        loginTokenRepository.deleteByEmail(normalizedEmail)

        // Generate new code
        val code = PlatformLoginToken.generateCode()
        val token = PlatformLoginToken.create(normalizedEmail, code)

        // Log code for development (remove in production)
        logger.info("🔐 LOGIN CODE for $normalizedEmail: $code (valid for $CODE_VALIDITY_MINUTES minutes)")

        // Save token
        loginTokenRepository.save(token)

        // Send email with code
        try {
            emailService.sendLoginCode(normalizedEmail, code, CODE_VALIDITY_MINUTES.toInt())
        } catch (e: Exception) {
            logger.error("Failed to send login code email to $normalizedEmail", e)
            // Delete the token since email failed
            loginTokenRepository.deleteByEmail(normalizedEmail)
            throw IllegalStateException("Failed to send login code. Please try again later.")
        }

        // Record this request for rate limiting
        recordRateLimitRequest(normalizedEmail)

        logger.info("Login code sent to: $normalizedEmail")

        return SendCodeResponse(
            email = normalizedEmail,
            expiresIn = CODE_VALIDITY_MINUTES * 60,
            message = "Login code sent to your email"
        )
    }

    /**
     * Verify a login code and issue JWT tokens.
     *
     * @param email User's email address
     * @param code The 6-digit OTP code
     * @param deviceInfo Optional device information
     * @return Authentication response with JWT tokens
     * @throws IllegalArgumentException if code is invalid, expired, or already used
     */
    fun verifyLoginCode(email: String, code: String, deviceInfo: String? = null): PlatformAuthResponse {
        val normalizedEmail = email.trim().lowercase()
        val normalizedCode = code.trim()

        // Validate code format
        if (!normalizedCode.matches(Regex("^\\d{6}$"))) {
            logger.warn("Invalid code format attempted for email: $normalizedEmail")
            throw IllegalArgumentException("Invalid code format")
        }

        // Find token by code hash
        val codeHash = PlatformLoginToken.hashCode(normalizedCode)
        val token = loginTokenRepository.findByCodeHash(codeHash)
            .orElseThrow {
                logger.warn("Code verification failed: code not found for email $normalizedEmail")
                IllegalArgumentException("Invalid or expired code")
            }

        // Verify email matches
        if (token.email != normalizedEmail) {
            logger.warn("Code verification failed: email mismatch for token ${token.id}")
            throw IllegalArgumentException("Invalid or expired code")
        }

        // Check if token is valid (not expired, not used, not locked)
        if (!token.isValid()) {
            when {
                token.isExpired() -> {
                    logger.warn("Code verification failed: token expired for email $normalizedEmail")
                    throw IllegalArgumentException("Code has expired. Please request a new one.")
                }
                token.isUsed() -> {
                    logger.warn("Code verification failed: token already used for email $normalizedEmail")
                    throw IllegalArgumentException("Code has already been used. Please request a new one.")
                }
                token.isLocked() -> {
                    logger.warn("Code verification failed: token locked for email $normalizedEmail")
                    throw IllegalArgumentException("Too many failed attempts. Please request a new code.")
                }
                else -> {
                    throw IllegalArgumentException("Invalid or expired code")
                }
            }
        }

        // Verify the code
        if (!token.verifyCode(normalizedCode)) {
            // Record failed attempt
            token.recordFailedAttempt()
            loginTokenRepository.save(token)

            logger.warn("Code verification failed: incorrect code for email $normalizedEmail (attempt ${token.failedAttempts})")
            throw IllegalArgumentException("Invalid code. ${5 - token.failedAttempts} attempts remaining.")
        }

        // Mark token as used (one-time use)
        token.markAsUsed()
        loginTokenRepository.save(token)

        // Get user
        val user = platformUserRepository.findByEmail(normalizedEmail)
            .orElseThrow { IllegalStateException("User not found") }

        // Verify user is still active
        if (!user.isActive()) {
            throw IllegalStateException("Account is ${user.status.name.lowercase()}")
        }

        // Record successful login
        user.recordLogin()
        platformUserRepository.save(user)

        // Generate JWT tokens
        val accessToken = jwtTokenProvider.generatePlatformAccessToken(user)
        val (refreshToken, tokenHash) = jwtTokenProvider.generatePlatformRefreshToken(user)

        // Store refresh token
        val now = Instant.now()
        val refreshTokenEntity = RefreshToken(
            userId = user.id,
            tenantId = user.id, // Platform users use their own ID
            tokenHash = tokenHash,
            expiresAt = now.plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs()),
            absoluteExpiresAt = now.plusMillis(jwtTokenProvider.getAbsoluteSessionTimeoutMs()),
            deviceInfo = deviceInfo
        )
        refreshTokenRepository.save(refreshTokenEntity)

        logger.info("Platform user logged in via passwordless: userId=${user.id} (${user.role})")

        val permissions = PlatformRolePermissions.permissionsFor(user.role).map { it.name }

        return PlatformAuthResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresIn = jwtTokenProvider.getAccessTokenExpirationMs() / 1000,
            scope = "platform",
            permissions = permissions,
            user = PlatformUserResponse.from(user)
        )
    }

    /**
     * Check if an email is currently rate limited.
     */
    private fun isRateLimited(email: String): Boolean {
        val now = Instant.now()
        val windowStart = now.minusSeconds(RATE_LIMIT_WINDOW_MINUTES * 60)

        // Get or create request list
        val requests = rateLimitCache.getOrPut(email) { mutableListOf() }

        // Remove old requests outside the window
        requests.removeIf { it.isBefore(windowStart) }

        // Check if limit exceeded
        return requests.size >= MAX_REQUESTS_PER_WINDOW
    }

    /**
     * Record a code request for rate limiting.
     */
    private fun recordRateLimitRequest(email: String) {
        val now = Instant.now()
        val requests = rateLimitCache.getOrPut(email) { mutableListOf() }
        requests.add(now)
    }

    /**
     * Clean up expired rate limit cache entries (called by scheduled task).
     */
    fun cleanupRateLimitCache() {
        val now = Instant.now()
        val windowStart = now.minusSeconds(RATE_LIMIT_WINDOW_MINUTES * 60)

        rateLimitCache.entries.removeIf { (_, requests) ->
            requests.removeIf { it.isBefore(windowStart) }
            requests.isEmpty()
        }

        logger.debug("Rate limit cache cleaned up. Remaining entries: ${rateLimitCache.size}")
    }

    /**
     * Clean up expired tokens (called by scheduled task).
     */
    fun cleanupExpiredTokens() {
        val cutoff = Instant.now().minusSeconds(60 * 60) // Delete tokens older than 1 hour
        loginTokenRepository.deleteByExpiresAtBefore(cutoff)
        logger.info("Expired login tokens cleaned up (older than 1 hour)")
    }
}

/**
 * Response when sending a login code.
 */
data class SendCodeResponse(
    val email: String,
    val expiresIn: Long, // seconds
    val message: String
)
