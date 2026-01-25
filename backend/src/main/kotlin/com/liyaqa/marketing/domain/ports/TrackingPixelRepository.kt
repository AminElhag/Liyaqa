package com.liyaqa.marketing.domain.ports

import com.liyaqa.marketing.domain.model.TrackingPixel
import com.liyaqa.marketing.domain.model.TrackingType
import java.util.Optional
import java.util.UUID

/**
 * Port for tracking pixel persistence operations.
 */
interface TrackingPixelRepository {
    fun save(trackingPixel: TrackingPixel): TrackingPixel
    fun saveAll(trackingPixels: List<TrackingPixel>): List<TrackingPixel>
    fun findById(id: UUID): Optional<TrackingPixel>
    fun deleteById(id: UUID)

    /**
     * Find tracking pixel by token.
     */
    fun findByToken(token: String): Optional<TrackingPixel>

    /**
     * Find tracking pixels by message log.
     */
    fun findByMessageLogId(messageLogId: UUID): List<TrackingPixel>

    /**
     * Find tracking pixel by message log and type.
     */
    fun findByMessageLogIdAndType(messageLogId: UUID, trackingType: TrackingType): Optional<TrackingPixel>

    /**
     * Delete tracking pixels by message log.
     */
    fun deleteByMessageLogId(messageLogId: UUID)

    /**
     * Count triggered pixels by type.
     */
    fun countTriggeredByType(trackingType: TrackingType): Long
}
