package com.liyaqa.marketing.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.security.SecureRandom
import java.time.Instant
import java.util.UUID

/**
 * Tracking pixel for email open/click tracking.
 */
@Entity
@Table(name = "marketing_tracking_pixels")
class TrackingPixel(
    @Column(name = "message_log_id", nullable = false)
    val messageLogId: UUID,

    @Column(name = "token", nullable = false, unique = true, length = 64)
    val token: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "tracking_type", nullable = false)
    val trackingType: TrackingType,

    @Column(name = "target_url", columnDefinition = "text")
    val targetUrl: String? = null,

    @Column(name = "triggered_at")
    var triggeredAt: Instant? = null,

    @Column(name = "user_agent", columnDefinition = "text")
    var userAgent: String? = null,

    @Column(name = "ip_address", length = 45)
    var ipAddress: String? = null,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Record that the pixel was triggered.
     */
    fun trigger(userAgent: String? = null, ipAddress: String? = null) {
        if (this.triggeredAt == null) {
            this.triggeredAt = Instant.now()
            this.userAgent = userAgent
            this.ipAddress = ipAddress
        }
    }

    /**
     * Check if pixel was triggered.
     */
    fun wasTriggered(): Boolean = triggeredAt != null

    /**
     * Check if this is an open tracking pixel.
     */
    fun isOpenPixel(): Boolean = trackingType == TrackingType.OPEN

    /**
     * Check if this is a click tracking pixel.
     */
    fun isClickPixel(): Boolean = trackingType == TrackingType.CLICK

    companion object {
        private val SECURE_RANDOM = SecureRandom()
        private const val TOKEN_LENGTH = 32
        private const val HEX_CHARS = "0123456789abcdef"

        /**
         * Generate a secure random token.
         */
        fun generateToken(): String {
            val bytes = ByteArray(TOKEN_LENGTH)
            SECURE_RANDOM.nextBytes(bytes)
            return bytes.joinToString("") { String.format("%02x", it) }
        }

        /**
         * Create an open tracking pixel.
         */
        fun createOpenPixel(messageLogId: UUID): TrackingPixel {
            return TrackingPixel(
                messageLogId = messageLogId,
                token = generateToken(),
                trackingType = TrackingType.OPEN
            )
        }

        /**
         * Create a click tracking pixel.
         */
        fun createClickPixel(messageLogId: UUID, targetUrl: String): TrackingPixel {
            return TrackingPixel(
                messageLogId = messageLogId,
                token = generateToken(),
                trackingType = TrackingType.CLICK,
                targetUrl = targetUrl
            )
        }
    }
}
