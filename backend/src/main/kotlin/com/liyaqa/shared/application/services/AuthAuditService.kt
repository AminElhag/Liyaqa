package com.liyaqa.shared.application.services

import com.liyaqa.auth.domain.model.LoginAttempt
import com.liyaqa.auth.domain.model.LoginAttemptType
import com.liyaqa.auth.domain.ports.LoginAttemptRepository
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.security.MessageDigest
import java.time.Instant
import java.util.UUID

/**
 * Device information extracted from user agent and request headers.
 */
data class DeviceInfo(
    val deviceName: String?,
    val os: String?,
    val browser: String?,
    val userAgent: String?
)

/**
 * Geolocation information for a login attempt.
 * In production, this would be populated by GeoIP2 or similar service.
 */
data class GeoLocation(
    val country: String?,
    val city: String?,
    val latitude: Double?,
    val longitude: Double?
)

/**
 * Service responsible for audit logging of authentication events.
 * All logging operations are performed asynchronously to not impact user-facing performance.
 */
@Service
class AuthAuditService(
    private val loginAttemptRepository: LoginAttemptRepository,
    private val securityAnomalyService: com.liyaqa.security.application.services.SecurityAnomalyService
) {
    private val logger = LoggerFactory.getLogger(AuthAuditService::class.java)

    /**
     * Logs a login attempt asynchronously.
     * This method returns immediately and the actual logging happens in the background.
     *
     * @param userId The user ID (null for failed attempts where user doesn't exist)
     * @param email The email address used for login
     * @param attemptType Type of attempt (SUCCESS, FAILED, etc.)
     * @param request HTTP request containing IP, user agent, etc.
     * @param failureReason Optional reason for failure
     * @param tenantId Optional tenant ID
     */
    @Async
    fun logLoginAttempt(
        userId: UUID?,
        email: String,
        attemptType: LoginAttemptType,
        request: HttpServletRequest,
        failureReason: String? = null,
        tenantId: UUID? = null
    ) {
        try {
            val ipAddress = extractIpAddress(request)
            val userAgent = request.getHeader("User-Agent")
            val deviceInfo = parseDeviceInfo(userAgent)
            val deviceFingerprint = generateDeviceFingerprint(request)
            val geoLocation = resolveGeoLocation(ipAddress)

            val loginAttempt = LoginAttempt(
                userId = userId,
                email = email,
                ipAddress = ipAddress,
                userAgent = userAgent,
                deviceFingerprint = deviceFingerprint,
                deviceName = deviceInfo.deviceName,
                os = deviceInfo.os,
                browser = deviceInfo.browser,
                country = geoLocation.country,
                city = geoLocation.city,
                latitude = geoLocation.latitude,
                longitude = geoLocation.longitude,
                attemptType = attemptType,
                failureReason = failureReason,
                timestamp = Instant.now(),
                tenantId = tenantId
            )

            val savedAttempt = loginAttemptRepository.save(loginAttempt)

            logger.info(
                "Login attempt logged: userId={}, email={}, type={}, ip={}, location={}",
                userId,
                email,
                attemptType,
                ipAddress,
                geoLocation.city ?: "Unknown"
            )

            // Detect security anomalies asynchronously
            try {
                securityAnomalyService.detectAnomalies(savedAttempt)

                // Also check for brute force from this IP
                securityAnomalyService.detectBruteForce(ipAddress)
            } catch (e: Exception) {
                logger.error("Failed to detect anomalies for login attempt: ${e.message}", e)
            }
        } catch (e: Exception) {
            // Never fail the login flow due to audit logging errors
            logger.error("Failed to log login attempt for email: $email", e)
        }
    }

    /**
     * Extracts the real IP address from the request.
     * Handles proxy headers like X-Forwarded-For.
     *
     * @param request The HTTP request
     * @return The IP address
     */
    private fun extractIpAddress(request: HttpServletRequest): String {
        val headers = listOf(
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED"
        )

        for (header in headers) {
            val ip = request.getHeader(header)
            if (!ip.isNullOrBlank() && !"unknown".equals(ip, ignoreCase = true)) {
                // X-Forwarded-For can contain multiple IPs, take the first one
                return ip.split(",").firstOrNull()?.trim() ?: request.remoteAddr
            }
        }

        return request.remoteAddr
    }

    /**
     * Parses device information from User-Agent string.
     * This is a basic implementation. In production, consider using a library like UserAgentUtils or UAParser.
     *
     * @param userAgent The User-Agent header
     * @return DeviceInfo with parsed information
     */
    private fun parseDeviceInfo(userAgent: String?): DeviceInfo {
        if (userAgent.isNullOrBlank()) {
            return DeviceInfo(null, null, null, null)
        }

        val ua = userAgent.lowercase()

        // Detect OS
        val os = when {
            ua.contains("windows nt 10") -> "Windows 10"
            ua.contains("windows nt 6.3") -> "Windows 8.1"
            ua.contains("windows nt 6.2") -> "Windows 8"
            ua.contains("windows nt 6.1") -> "Windows 7"
            ua.contains("windows") -> "Windows"
            ua.contains("mac os x") -> "macOS"
            ua.contains("android") -> "Android"
            ua.contains("iphone") || ua.contains("ipad") -> "iOS"
            ua.contains("linux") -> "Linux"
            else -> null
        }

        // Detect Browser
        val browser = when {
            ua.contains("edg/") -> "Edge"
            ua.contains("chrome/") && !ua.contains("edg/") -> "Chrome"
            ua.contains("safari/") && !ua.contains("chrome/") -> "Safari"
            ua.contains("firefox/") -> "Firefox"
            ua.contains("opera/") || ua.contains("opr/") -> "Opera"
            else -> null
        }

        // Detect Device Type
        val deviceName = when {
            ua.contains("iphone") -> "iPhone"
            ua.contains("ipad") -> "iPad"
            ua.contains("android") && ua.contains("mobile") -> "Android Phone"
            ua.contains("android") -> "Android Tablet"
            ua.contains("mobile") -> "Mobile Device"
            else -> "Desktop"
        }

        return DeviceInfo(
            deviceName = deviceName,
            os = os,
            browser = browser,
            userAgent = userAgent
        )
    }

    /**
     * Generates a device fingerprint from request headers.
     * This is a hash of User-Agent + Accept headers to identify unique devices.
     *
     * @param request The HTTP request
     * @return Device fingerprint hash
     */
    private fun generateDeviceFingerprint(request: HttpServletRequest): String {
        val components = listOf(
            request.getHeader("User-Agent") ?: "",
            request.getHeader("Accept-Language") ?: "",
            request.getHeader("Accept-Encoding") ?: ""
        )

        val fingerprintString = components.joinToString("|")
        return hashString(fingerprintString)
    }

    /**
     * Resolves geolocation from IP address.
     * This is a stub implementation. In production, integrate with GeoIP2 or similar service.
     *
     * @param ipAddress The IP address
     * @return GeoLocation information
     */
    private fun resolveGeoLocation(ipAddress: String): GeoLocation {
        // TODO: Integrate with GeoIP2 or MaxMind GeoIP database
        // For now, return null values
        // In production:
        // val geoIpReader = DatabaseReader.Builder(File("GeoLite2-City.mmdb")).build()
        // val response = geoIpReader.city(InetAddress.getByName(ipAddress))
        // return GeoLocation(
        //     country = response.country.isoCode,
        //     city = response.city.name,
        //     latitude = response.location.latitude,
        //     longitude = response.location.longitude
        // )

        logger.debug("GeoIP lookup for IP: $ipAddress (not implemented)")

        return GeoLocation(
            country = null,
            city = null,
            latitude = null,
            longitude = null
        )
    }

    /**
     * Hashes a string using SHA-256.
     *
     * @param input The input string
     * @return Hexadecimal hash string
     */
    private fun hashString(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }

    /**
     * Cleans up old login attempts before a given date.
     * Should be called periodically (e.g., monthly) to prevent unlimited database growth.
     *
     * @param before Timestamp threshold (e.g., 90 days ago)
     */
    fun cleanupOldLoginAttempts(before: Instant) {
        try {
            loginAttemptRepository.deleteByTimestampBefore(before)
            logger.info("Cleaned up login attempts before: $before")
        } catch (e: Exception) {
            logger.error("Failed to cleanup old login attempts", e)
        }
    }
}
