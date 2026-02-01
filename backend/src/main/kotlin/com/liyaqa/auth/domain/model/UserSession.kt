package com.liyaqa.auth.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Represents an active user session across devices.
 * Tracks user login sessions for security monitoring and device management.
 */
@Entity
@Table(name = "user_sessions")
class UserSession(
    id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "session_id", nullable = false, unique = true)
    val sessionId: UUID = UUID.randomUUID(),

    @Column(name = "access_token_hash", length = 64)
    var accessTokenHash: String? = null,

    @Column(name = "device_name", length = 100)
    var deviceName: String? = null,

    @Column(name = "os", length = 50)
    var os: String? = null,

    @Column(name = "browser", length = 50)
    var browser: String? = null,

    @Column(name = "ip_address", length = 45)
    var ipAddress: String? = null,

    @Column(name = "originating_ip_address", length = 45)
    val originatingIpAddress: String? = null,

    @Column(name = "country", length = 2)
    var country: String? = null,

    @Column(name = "city", length = 100)
    var city: String? = null,

    @Column(name = "last_active_at", nullable = false)
    var lastActiveAt: Instant = Instant.now(),

    @Column(name = "expires_at", nullable = false)
    var expiresAt: Instant,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "revoked_at")
    var revokedAt: Instant? = null

) : BaseEntity(id) {

    /**
     * Updates the last active timestamp to current time.
     */
    fun updateLastActive() {
        lastActiveAt = Instant.now()
    }

    /**
     * Revokes this session, marking it as inactive.
     */
    fun revoke() {
        isActive = false
        revokedAt = Instant.now()
    }

    /**
     * Checks if the session is still valid (active and not expired).
     */
    fun isValid(): Boolean {
        return isActive && Instant.now().isBefore(expiresAt)
    }

    /**
     * Gets a human-readable device description.
     */
    fun getDeviceDescription(): String {
        val parts = mutableListOf<String>()

        deviceName?.let { parts.add(it) }
        browser?.let { parts.add(it) }
        os?.let { parts.add(it) }

        return if (parts.isNotEmpty()) {
            parts.joinToString(" • ")
        } else {
            "Unknown Device"
        }
    }

    /**
     * Gets a human-readable location description.
     */
    fun getLocationDescription(): String {
        val parts = mutableListOf<String>()

        city?.let { parts.add(it) }
        country?.let { parts.add(it) }

        return if (parts.isNotEmpty()) {
            parts.joinToString(", ")
        } else {
            "Unknown Location"
        }
    }

    /**
     * Checks if the current IP address matches the originating IP address.
     * Returns true if IP binding validation passes, false otherwise.
     */
    fun validateIpBinding(currentIp: String?): Boolean {
        if (originatingIpAddress == null || currentIp == null) {
            return true // Cannot validate if IPs are missing
        }
        return originatingIpAddress == currentIp
    }

    /**
     * Checks if the current IP is within the same subnet as the originating IP.
     * Useful for relaxed IP binding validation (e.g., corporate networks).
     * Returns true if IPs are in the same /24 subnet, false otherwise.
     */
    fun validateSameSubnet(currentIp: String?): Boolean {
        val origIp = originatingIpAddress
        if (origIp == null || currentIp == null) {
            return true // Cannot validate if IPs are missing
        }

        // For IPv4, check if first 3 octets match (same /24 subnet)
        val originatingParts = origIp.split(".")
        val currentParts = currentIp.split(".")

        if (originatingParts.size == 4 && currentParts.size == 4) {
            return originatingParts.take(3) == currentParts.take(3)
        }

        // For IPv6 or invalid format, fall back to exact match
        return origIp == currentIp
    }

    companion object {
        /**
         * Creates a device description from user agent string.
         * This is a simplified parser - in production, use a library like UAParser.
         */
        fun parseDeviceInfo(userAgent: String?): Triple<String?, String?, String?> {
            if (userAgent.isNullOrBlank()) {
                return Triple(null, null, null)
            }

            val ua = userAgent.lowercase()

            // Parse browser
            val browser = when {
                ua.contains("edg/") -> "Edge"
                ua.contains("chrome/") -> "Chrome"
                ua.contains("safari/") && !ua.contains("chrome/") -> "Safari"
                ua.contains("firefox/") -> "Firefox"
                ua.contains("opera/") || ua.contains("opr/") -> "Opera"
                else -> "Unknown Browser"
            }

            // Parse OS
            val os = when {
                ua.contains("windows") -> "Windows"
                ua.contains("mac os x") || ua.contains("macos") -> "macOS"
                ua.contains("iphone") || ua.contains("ipad") -> "iOS"
                ua.contains("android") -> "Android"
                ua.contains("linux") -> "Linux"
                else -> "Unknown OS"
            }

            // Parse device name
            val deviceName = when {
                ua.contains("iphone") -> "iPhone"
                ua.contains("ipad") -> "iPad"
                ua.contains("android") && ua.contains("mobile") -> "Android Phone"
                ua.contains("android") -> "Android Tablet"
                ua.contains("windows") -> "Windows PC"
                ua.contains("mac") -> "Mac"
                ua.contains("linux") -> "Linux PC"
                else -> "Desktop"
            }

            return Triple(deviceName, os, browser)
        }
    }
}
