package com.liyaqa.auth.application.services

import com.liyaqa.auth.domain.model.UserSession
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.domain.ports.UserSessionRepository
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.MessageDigest
import java.time.Instant
import java.util.UUID

/**
 * Service for managing user sessions across devices.
 */
@Service
@Transactional
class SessionService(
    private val sessionRepository: UserSessionRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(SessionService::class.java)

    companion object {
        private const val MAX_CONCURRENT_SESSIONS = 5
    }

    /**
     * Creates a new session for a user.
     * Automatically revokes the oldest session if max concurrent sessions exceeded.
     *
     * @param userId The user ID
     * @param accessToken The JWT access token
     * @param deviceInfo Optional device information string
     * @param ipAddress Optional IP address
     * @param request Optional HttpServletRequest for extracting device info
     * @return The created session
     */
    fun createSession(
        userId: UUID,
        accessToken: String,
        deviceInfo: String? = null,
        ipAddress: String? = null,
        request: HttpServletRequest? = null
    ): UserSession {
        // Check if user has reached max concurrent sessions
        val activeSessionCount = sessionRepository.countActiveSessionsByUserId(userId)
        if (activeSessionCount >= MAX_CONCURRENT_SESSIONS) {
            // Revoke the oldest session
            revokeOldestSession(userId)
            logger.info("Revoked oldest session for user $userId (max sessions reached)")
        }

        // Parse device information
        val userAgent = request?.getHeader("User-Agent") ?: deviceInfo
        val (deviceName, os, browser) = UserSession.parseDeviceInfo(userAgent)

        // Calculate expiration (same as access token)
        val expiresAt = jwtTokenProvider.getExpiration(accessToken)

        // Hash the access token for identification (last 8 chars of hash)
        val tokenHash = hashToken(accessToken).takeLast(8)

        // Create session with originating IP for IP binding validation
        val currentIp = ipAddress ?: request?.remoteAddr
        val session = UserSession(
            userId = userId,
            accessTokenHash = tokenHash,
            deviceName = deviceName,
            os = os,
            browser = browser,
            ipAddress = currentIp,
            originatingIpAddress = currentIp, // Store originating IP for IP binding
            expiresAt = expiresAt
        )

        val savedSession = sessionRepository.save(session)
        logger.info("Created session ${savedSession.sessionId} for user $userId")

        return savedSession
    }

    /**
     * Updates the last active timestamp for a session.
     *
     * @param sessionId The session ID
     */
    fun updateLastActive(sessionId: UUID) {
        val session = sessionRepository.findBySessionId(sessionId)
        if (session != null && session.isValid()) {
            session.updateLastActive()
            sessionRepository.save(session)
        }
    }

    /**
     * Lists all active sessions for a user.
     *
     * @param userId The user ID
     * @return List of active sessions
     */
    @Transactional(readOnly = true)
    fun listActiveSessions(userId: UUID): List<UserSession> {
        return sessionRepository.findActiveSessionsByUserId(userId)
    }

    /**
     * Lists all sessions for a user (including inactive).
     *
     * @param userId The user ID
     * @return List of all sessions
     */
    @Transactional(readOnly = true)
    fun listAllSessions(userId: UUID): List<UserSession> {
        return sessionRepository.findAllByUserId(userId)
    }

    /**
     * Revokes a specific session.
     *
     * @param sessionId The session ID
     * @param userId The user ID (for authorization check)
     * @throws IllegalArgumentException if session not found or doesn't belong to user
     */
    fun revokeSession(sessionId: UUID, userId: UUID) {
        val session = sessionRepository.findBySessionId(sessionId)
            ?: throw IllegalArgumentException("Session not found")

        if (session.userId != userId) {
            throw IllegalArgumentException("Session does not belong to user")
        }

        session.revoke()
        sessionRepository.save(session)

        logger.info("Revoked session $sessionId for user $userId")
    }

    /**
     * Revokes all sessions for a user except the current one.
     *
     * @param userId The user ID
     * @param exceptSessionId Optional session ID to keep active
     */
    fun revokeAllSessions(userId: UUID, exceptSessionId: UUID? = null) {
        sessionRepository.revokeAllExcept(userId, exceptSessionId)

        logger.info("Revoked all sessions for user $userId (except: $exceptSessionId)")
    }

    /**
     * Counts active sessions for a user.
     *
     * @param userId The user ID
     * @return Number of active sessions
     */
    @Transactional(readOnly = true)
    fun countActiveSessions(userId: UUID): Long {
        return sessionRepository.countActiveSessionsByUserId(userId)
    }

    /**
     * Revokes the oldest active session for a user.
     * Called when max concurrent sessions is reached.
     */
    private fun revokeOldestSession(userId: UUID) {
        val sessions = sessionRepository.findActiveSessionsByUserId(userId)
        if (sessions.isNotEmpty()) {
            // Sessions are ordered by lastActiveAt DESC, so the oldest is at the end
            val oldestSession = sessions.last()
            oldestSession.revoke()
            sessionRepository.save(oldestSession)
        }
    }

    /**
     * Scheduled task to cleanup expired sessions.
     * Runs every hour.
     */
    @Scheduled(cron = "0 0 * * * *")
    fun cleanupExpiredSessions() {
        val deletedCount = sessionRepository.deleteExpiredSessions(Instant.now())
        if (deletedCount > 0) {
            logger.info("Cleaned up $deletedCount expired sessions")
        }
    }

    /**
     * Validates IP binding for a user session.
     * Returns true if IP binding is disabled or IP validation passes.
     * Returns false if IP binding is enabled and validation fails.
     *
     * @param userId The user ID
     * @param currentIpAddress The current IP address to validate
     * @return true if validation passes, false otherwise
     */
    fun validateIpBinding(userId: UUID, currentIpAddress: String?): Boolean {
        if (currentIpAddress == null) {
            logger.warn("Cannot validate IP binding for user $userId: current IP is null")
            return true // Allow if IP is not available
        }

        // Get user's IP binding preference
        val user = userRepository.findById(userId).orElse(null)
        if (user == null || !user.ipBindingEnabled) {
            // IP binding not enabled, allow request
            return true
        }

        // Get active sessions for user
        val activeSessions = sessionRepository.findActiveSessionsByUserId(userId)
        if (activeSessions.isEmpty()) {
            // No active sessions, allow (new session will be created)
            return true
        }

        // Check if current IP matches any active session's originating IP
        val matchingSession = activeSessions.find { session ->
            session.validateIpBinding(currentIpAddress)
        }

        if (matchingSession != null) {
            logger.debug("IP binding validation passed for user $userId: IP matches session ${matchingSession.sessionId}")
            return true
        }

        logger.warn("IP binding validation failed for user $userId: IP $currentIpAddress does not match any originating IP")
        return false
    }

    /**
     * Hashes a token using SHA-256.
     */
    private fun hashToken(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(token.toByteArray())
        return hashBytes.joinToString("") { "%02x".format(it) }
    }
}
