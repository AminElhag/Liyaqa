package com.liyaqa.security.application.services

import com.liyaqa.auth.domain.model.LoginAttempt
import com.liyaqa.auth.domain.ports.LoginAttemptRepository
import com.liyaqa.auth.domain.ports.UserSessionRepository
import com.liyaqa.security.domain.model.AlertType
import com.liyaqa.security.domain.model.SecurityAlert
import com.liyaqa.security.domain.model.AlertSeverity
import com.liyaqa.security.domain.ports.SecurityAlertRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.time.LocalTime
import java.util.UUID
import kotlin.math.*

/**
 * Service for detecting suspicious activity and security anomalies.
 */
@Service
@Transactional
class SecurityAnomalyService(
    private val securityAlertRepository: SecurityAlertRepository,
    private val loginAttemptRepository: LoginAttemptRepository,
    private val userSessionRepository: UserSessionRepository
) {
    private val logger = LoggerFactory.getLogger(SecurityAnomalyService::class.java)

    companion object {
        private const val IMPOSSIBLE_TRAVEL_THRESHOLD_KM = 500.0
        private const val IMPOSSIBLE_TRAVEL_WINDOW_HOURS = 1L
        private const val BRUTE_FORCE_THRESHOLD = 10
        private const val BRUTE_FORCE_WINDOW_MINUTES = 5L
        private const val MAX_CONCURRENT_SESSIONS = 5
    }

    /**
     * Detects anomalies for a login attempt and creates alerts.
     *
     * @param loginAttempt The login attempt to analyze
     * @return List of created security alerts
     */
    fun detectAnomalies(loginAttempt: LoginAttempt): List<SecurityAlert> {
        val alerts = mutableListOf<SecurityAlert>()

        try {
            // Skip anomaly detection for failed attempts (already tracked)
            if (!loginAttempt.isSuccess()) {
                return emptyList()
            }

            val userId = loginAttempt.userId ?: return emptyList()

            // 1. Impossible Travel Detection
            detectImpossibleTravel(loginAttempt, userId)?.let { alerts.add(it) }

            // 2. New Device Detection
            detectNewDevice(loginAttempt, userId)?.let { alerts.add(it) }

            // 3. New Location Detection
            detectNewLocation(loginAttempt, userId)?.let { alerts.add(it) }

            // 4. Unusual Time Detection
            detectUnusualTime(loginAttempt, userId)?.let { alerts.add(it) }

            // Save all alerts
            alerts.forEach { alert ->
                securityAlertRepository.save(alert)
                logger.info("Security alert created: ${alert.alertType} for user $userId (severity: ${alert.severity})")
            }

        } catch (e: Exception) {
            logger.error("Error detecting anomalies for login attempt ${loginAttempt.id}: ${e.message}", e)
        }

        return alerts
    }

    /**
     * Detects brute force attacks from an IP address.
     * Called independently of specific user.
     */
    fun detectBruteForce(ipAddress: String): SecurityAlert? {
        try {
            val since = Instant.now().minus(Duration.ofMinutes(BRUTE_FORCE_WINDOW_MINUTES))
            val failedAttempts = loginAttemptRepository.countFailedAttemptsByIpSince(ipAddress, since)

            if (failedAttempts >= BRUTE_FORCE_THRESHOLD) {
                // Find the user ID from the most recent attempt
                val recentAttempt = loginAttemptRepository.findRecentByIp(ipAddress, since).firstOrNull()
                val userId = recentAttempt?.userId ?: return null

                val alert = SecurityAlert(
                    userId = userId,
                    alertType = AlertType.BRUTE_FORCE,
                    severity = AlertSeverity.HIGH,
                    details = "Detected $failedAttempts failed login attempts from IP $ipAddress in the last ${BRUTE_FORCE_WINDOW_MINUTES} minutes",
                    loginAttemptId = recentAttempt.id
                )

                return securityAlertRepository.save(alert)
            }
        } catch (e: Exception) {
            logger.error("Error detecting brute force from IP $ipAddress: ${e.message}", e)
        }

        return null
    }

    /**
     * Detects impossible travel (login from 2 distant locations within short time).
     */
    private fun detectImpossibleTravel(currentAttempt: LoginAttempt, userId: UUID): SecurityAlert? {
        // Get previous successful login
        val since = Instant.now().minus(Duration.ofHours(IMPOSSIBLE_TRAVEL_WINDOW_HOURS))
        val previousAttempts = loginAttemptRepository.findSuccessfulByUserSince(userId, since)
            .filter { it.id != currentAttempt.id }

        if (previousAttempts.isEmpty()) return null

        val previousAttempt = previousAttempts.firstOrNull() ?: return null

        // Check if both attempts have location data
        val currentLat = currentAttempt.latitude
        val currentLon = currentAttempt.longitude
        val previousLat = previousAttempt.latitude
        val previousLon = previousAttempt.longitude

        if (currentLat == null || currentLon == null || previousLat == null || previousLon == null) {
            return null
        }

        // Calculate distance
        val distance = calculateDistance(previousLat, previousLon, currentLat, currentLon)

        if (distance > IMPOSSIBLE_TRAVEL_THRESHOLD_KM) {
            val timeDiff = Duration.between(previousAttempt.timestamp, currentAttempt.timestamp).toMinutes()

            return SecurityAlert(
                userId = userId,
                alertType = AlertType.IMPOSSIBLE_TRAVEL,
                severity = AlertSeverity.CRITICAL,
                details = "Login from ${currentAttempt.city ?: "unknown location"} (${currentAttempt.country}) " +
                        "detected ${timeDiff} minutes after login from ${previousAttempt.city ?: "unknown location"} " +
                        "(${previousAttempt.country}). Distance: ${distance.toInt()} km. IP: ${currentAttempt.ipAddress}",
                loginAttemptId = currentAttempt.id
            )
        }

        return null
    }

    /**
     * Detects login from a new device.
     */
    private fun detectNewDevice(currentAttempt: LoginAttempt, userId: UUID): SecurityAlert? {
        val deviceFingerprint = currentAttempt.deviceFingerprint ?: return null

        // Check if this device has been used before
        val since = Instant.now().minus(Duration.ofDays(90)) // Look back 90 days
        val knownDevices = loginAttemptRepository.findSuccessfulByUserSince(userId, since)
            .mapNotNull { it.deviceFingerprint }
            .toSet()

        if (deviceFingerprint !in knownDevices) {
            return SecurityAlert(
                userId = userId,
                alertType = AlertType.NEW_DEVICE,
                severity = AlertSeverity.MEDIUM,
                details = "Login from a new device. User agent: ${currentAttempt.userAgent}. Location: ${currentAttempt.city}, ${currentAttempt.country}. IP: ${currentAttempt.ipAddress}",
                loginAttemptId = currentAttempt.id
            )
        }

        return null
    }

    /**
     * Detects login from a new location (country or city).
     */
    private fun detectNewLocation(currentAttempt: LoginAttempt, userId: UUID): SecurityAlert? {
        val currentCountry = currentAttempt.country ?: return null
        val currentCity = currentAttempt.city

        // Check if this location has been used before
        val since = Instant.now().minus(Duration.ofDays(90))
        val knownLocations = loginAttemptRepository.findSuccessfulByUserSince(userId, since)
            .map { Pair(it.country, it.city) }
            .toSet()

        val currentLocation = Pair(currentCountry, currentCity)

        if (currentLocation !in knownLocations) {
            return SecurityAlert(
                userId = userId,
                alertType = AlertType.NEW_LOCATION,
                severity = AlertSeverity.MEDIUM,
                details = "Login from a new location: ${currentCity ?: "Unknown city"}, $currentCountry. IP: ${currentAttempt.ipAddress}",
                loginAttemptId = currentAttempt.id
            )
        }

        return null
    }

    /**
     * Detects login at unusual time (outside normal hours).
     * Analyzes user's historical login patterns.
     */
    private fun detectUnusualTime(currentAttempt: LoginAttempt, userId: UUID): SecurityAlert? {
        // Get user's historical login times (last 30 days)
        val since = Instant.now().minus(Duration.ofDays(30))
        val historicalAttempts = loginAttemptRepository.findSuccessfulByUserSince(userId, since)

        if (historicalAttempts.size < 10) {
            // Not enough data to determine normal hours
            return null
        }

        // Extract hours from historical attempts
        val historicalHours = historicalAttempts
            .map { LocalTime.ofInstant(it.timestamp, java.time.ZoneOffset.UTC).hour }

        // Calculate mean and standard deviation
        val mean = historicalHours.average()
        val variance = historicalHours.map { (it - mean).pow(2) }.average()
        val stdDev = sqrt(variance)

        // Get current hour
        val currentHour = LocalTime.ofInstant(currentAttempt.timestamp, java.time.ZoneOffset.UTC).hour

        // Check if current hour is more than 2 standard deviations away from mean
        if (abs(currentHour - mean) > 2 * stdDev) {
            return SecurityAlert(
                userId = userId,
                alertType = AlertType.UNUSUAL_TIME,
                severity = AlertSeverity.LOW,
                details = "Login at unusual time: ${currentHour}:00 UTC. Typical login hours: ${mean.toInt()}:00 ± ${stdDev.toInt()} hours. IP: ${currentAttempt.ipAddress}",
                loginAttemptId = currentAttempt.id
            )
        }

        return null
    }

    /**
     * Calculates distance between two geographic coordinates using Haversine formula.
     * Returns distance in kilometers.
     */
    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val earthRadiusKm = 6371.0

        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)

        val a = sin(dLat / 2).pow(2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2).pow(2)

        val c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return earthRadiusKm * c
    }

    /**
     * Scheduled cleanup of old resolved alerts.
     * Runs daily at 2 AM.
     */
    @Scheduled(cron = "0 0 2 * * *")
    fun cleanupOldAlerts() {
        try {
            // Delete resolved alerts older than 90 days
            val before = Instant.now().minus(Duration.ofDays(90))
            val deletedCount = securityAlertRepository.deleteResolvedBefore(before)

            if (deletedCount > 0) {
                logger.info("Cleaned up $deletedCount old resolved security alerts")
            }
        } catch (e: Exception) {
            logger.error("Error cleaning up old security alerts: ${e.message}", e)
        }
    }
}
