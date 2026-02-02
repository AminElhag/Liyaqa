package com.liyaqa.auth.application.services

import com.liyaqa.auth.domain.model.UserSession
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.domain.ports.UserSessionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.MessageDigest
import java.time.Duration
import java.time.Instant
import java.util.UUID

@Service
class SessionService(
    private val sessionRepository: UserSessionRepository,
    private val userRepository: UserRepository
) {
    private val log = LoggerFactory.getLogger(SessionService::class.java)

    companion object {
        private const val MAX_SESSIONS_PER_USER = 5
        private val SESSION_DURATION = Duration.ofDays(7)
    }

    @Transactional
    fun createSession(
        userId: UUID,
        accessToken: String,
        deviceInfo: String?,
        ipAddress: String?,
        location: LocationInfo? = null
    ): UserSession {
        val parsedDeviceInfo = parseDeviceInfo(deviceInfo)
        // Check active session count
        val activeSessionCount = sessionRepository.countActiveSessionsByUserId(userId)

        if (activeSessionCount >= MAX_SESSIONS_PER_USER) {
            // Revoke oldest session
            val sessions = sessionRepository.findActiveSessionsByUserId(userId)
                .sortedBy { it.createdAt }

            if (sessions.isNotEmpty()) {
                val oldestSession = sessions.first()
                oldestSession.revoke()
                sessionRepository.save(oldestSession)
                log.info("Revoked oldest session for user {} due to session limit", userId)
            }
        }

        val session = UserSession(
            userId = userId,
            accessTokenHash = hashToken(accessToken),
            deviceName = parsedDeviceInfo.deviceName,
            os = parsedDeviceInfo.os,
            browser = parsedDeviceInfo.browser,
            ipAddress = ipAddress ?: "unknown",
            country = location?.country,
            city = location?.city,
            expiresAt = Instant.now().plus(SESSION_DURATION)
        )

        val savedSession = sessionRepository.save(session)
        log.info("Created session {} for user {}", savedSession.sessionId, userId)
        return savedSession
    }

    @Transactional
    fun updateLastActive(sessionId: UUID) {
        val session = sessionRepository.findBySessionId(sessionId) ?: return
        
        if (session.isActive && !session.isExpired()) {
            session.updateActivity()
            sessionRepository.save(session)
        }
    }

    @Transactional(readOnly = true)
    fun listActiveSessions(userId: UUID): List<UserSession> {
        return sessionRepository.findActiveSessionsByUserId(userId)
            .filter { !it.isExpired() }
    }

    @Transactional
    fun revokeSession(sessionId: UUID, userId: UUID) {
        val session = sessionRepository.findBySessionId(sessionId)
        
        if (session != null && session.userId == userId) {
            session.revoke()
            sessionRepository.save(session)
            log.info("Revoked session {} for user {}", sessionId, userId)
        }
    }

    @Transactional
    fun revokeAllSessions(userId: UUID, exceptSessionId: UUID? = null) {
        sessionRepository.revokeAllExcept(userId, exceptSessionId)
        if (exceptSessionId != null) {
            log.info("Revoked all sessions for user {} except {}", userId, exceptSessionId)
        } else {
            log.info("Revoked all sessions for user {}", userId)
        }
    }

    @Transactional
    fun cleanupExpiredSessions() {
        val cutoffDate = Instant.now().minus(Duration.ofDays(30))
        sessionRepository.deleteExpiredSessions(cutoffDate)
        log.info("Cleaned up expired sessions older than {}", cutoffDate)
    }

    /**
     * Validates IP binding for a user's session.
     * If user has IP binding enabled, validates that the current IP matches the session's originating IP.
     *
     * @param userId The user ID
     * @param ipAddress The current IP address to validate
     * @return true if IP is valid (or IP binding is disabled), false if IP mismatch detected
     */
    fun validateIpBinding(userId: UUID, ipAddress: String?): Boolean {
        try {
            // If no IP provided, allow (can't validate)
            if (ipAddress == null) {
                return true
            }

            // Check if user has IP binding enabled
            val user = userRepository.findById(userId).orElse(null) ?: return true

            if (!user.ipBindingEnabled) {
                // IP binding disabled for this user
                return true
            }

            // Find user's active sessions
            val activeSessions = sessionRepository.findActiveSessionsByUserId(userId)

            if (activeSessions.isEmpty()) {
                // No active sessions, allow (will create new session)
                return true
            }

            // Check if any active session matches the current IP
            val ipMatches = activeSessions.any { it.ipAddress == ipAddress }

            if (!ipMatches) {
                log.warn("IP binding violation for user {}: current IP {} does not match any active session IPs",
                    userId, ipAddress)
                return false
            }

            return true
        } catch (e: Exception) {
            log.error("Error validating IP binding for user {}: {}", userId, e.message, e)
            // On error, allow access (fail open for availability)
            return true
        }
    }

    private fun parseDeviceInfo(deviceInfoString: String?): DeviceInfo {
        if (deviceInfoString == null) {
            return DeviceInfo(null, null, null)
        }
        // Simple parsing - can be enhanced with User-Agent parsing library
        return DeviceInfo(
            deviceName = deviceInfoString,
            os = null,
            browser = null
        )
    }

    private fun hashToken(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(token.takeLast(20).toByteArray())
        return hashBytes.joinToString("") { "%02x".format(it) }
    }
}

data class DeviceInfo(
    val deviceName: String? = null,
    val os: String? = null,
    val browser: String? = null
)

data class LocationInfo(
    val country: String? = null,
    val city: String? = null
)
