package com.liyaqa.marketing.application.services

import com.liyaqa.marketing.domain.model.TrackingType
import com.liyaqa.marketing.domain.ports.MessageLogRepository
import com.liyaqa.marketing.domain.ports.TrackingPixelRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for handling email open and click tracking.
 */
@Service
@Transactional
class TrackingService(
    private val trackingPixelRepository: TrackingPixelRepository,
    private val messageLogRepository: MessageLogRepository
) {
    private val logger = LoggerFactory.getLogger(TrackingService::class.java)

    // 1x1 transparent GIF pixel
    val TRACKING_PIXEL_GIF = byteArrayOf(
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
        0x80.toByte(), 0x00, 0x00, 0xFF.toByte(), 0xFF.toByte(), 0xFF.toByte(),
        0x00, 0x00, 0x00, 0x21, 0xF9.toByte(), 0x04, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02,
        0x44, 0x01, 0x00, 0x3B
    )

    /**
     * Track an email open event.
     * Returns the tracking pixel GIF.
     */
    fun trackOpen(token: String, userAgent: String?, ipAddress: String?): ByteArray {
        try {
            val pixel = trackingPixelRepository.findByToken(token).orElse(null)
            if (pixel == null) {
                logger.warn("Tracking pixel not found: $token")
                return TRACKING_PIXEL_GIF
            }

            if (pixel.trackingType != TrackingType.OPEN) {
                logger.warn("Invalid tracking type for open: $token")
                return TRACKING_PIXEL_GIF
            }

            // Record the open
            if (!pixel.wasTriggered()) {
                pixel.trigger(userAgent, ipAddress)
                trackingPixelRepository.save(pixel)

                // Update message log
                val messageLog = messageLogRepository.findById(pixel.messageLogId).orElse(null)
                if (messageLog != null) {
                    messageLog.recordOpen()
                    messageLogRepository.save(messageLog)
                    logger.debug("Recorded email open for message ${messageLog.id}")
                }
            }
        } catch (e: Exception) {
            logger.error("Error tracking open: ${e.message}", e)
        }

        return TRACKING_PIXEL_GIF
    }

    /**
     * Track a link click event.
     * Returns the target URL to redirect to.
     */
    fun trackClick(token: String, userAgent: String?, ipAddress: String?): String? {
        try {
            val pixel = trackingPixelRepository.findByToken(token).orElse(null)
            if (pixel == null) {
                logger.warn("Tracking pixel not found: $token")
                return null
            }

            if (pixel.trackingType != TrackingType.CLICK) {
                logger.warn("Invalid tracking type for click: $token")
                return pixel.targetUrl
            }

            // Record the click
            if (!pixel.wasTriggered()) {
                pixel.trigger(userAgent, ipAddress)
                trackingPixelRepository.save(pixel)

                // Update message log
                val messageLog = messageLogRepository.findById(pixel.messageLogId).orElse(null)
                if (messageLog != null) {
                    messageLog.recordClick()
                    messageLogRepository.save(messageLog)
                    logger.debug("Recorded link click for message ${messageLog.id}")
                }
            }

            return pixel.targetUrl
        } catch (e: Exception) {
            logger.error("Error tracking click: ${e.message}", e)
            return null
        }
    }

    /**
     * Create a tracking pixel URL for an email.
     */
    fun createOpenTrackingUrl(baseUrl: String, token: String): String {
        return "$baseUrl/t/o/$token"
    }

    /**
     * Create a click tracking URL.
     */
    fun createClickTrackingUrl(baseUrl: String, token: String): String {
        return "$baseUrl/t/c/$token"
    }

    /**
     * Get tracking statistics.
     */
    @Transactional(readOnly = true)
    fun getTrackingStats(): TrackingStats {
        return TrackingStats(
            totalOpens = trackingPixelRepository.countTriggeredByType(TrackingType.OPEN),
            totalClicks = trackingPixelRepository.countTriggeredByType(TrackingType.CLICK)
        )
    }
}

data class TrackingStats(
    val totalOpens: Long,
    val totalClicks: Long
)
