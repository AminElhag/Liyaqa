package com.liyaqa.marketing.infrastructure.persistence

import com.liyaqa.marketing.domain.model.TrackingPixel
import com.liyaqa.marketing.domain.model.TrackingType
import com.liyaqa.marketing.domain.ports.TrackingPixelRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataTrackingPixelRepository : JpaRepository<TrackingPixel, UUID> {

    fun findByToken(token: String): Optional<TrackingPixel>

    fun findByMessageLogId(messageLogId: UUID): List<TrackingPixel>

    fun findByMessageLogIdAndTrackingType(
        messageLogId: UUID,
        trackingType: TrackingType
    ): Optional<TrackingPixel>

    @Modifying
    @Query("DELETE FROM TrackingPixel t WHERE t.messageLogId = :messageLogId")
    fun deleteByMessageLogId(@Param("messageLogId") messageLogId: UUID)

    @Query("SELECT COUNT(t) FROM TrackingPixel t WHERE t.trackingType = :trackingType AND t.triggeredAt IS NOT NULL")
    fun countTriggeredByType(@Param("trackingType") trackingType: TrackingType): Long
}

@Repository
class JpaTrackingPixelRepository(
    private val springDataRepository: SpringDataTrackingPixelRepository
) : TrackingPixelRepository {

    override fun save(trackingPixel: TrackingPixel): TrackingPixel = springDataRepository.save(trackingPixel)

    override fun saveAll(trackingPixels: List<TrackingPixel>): List<TrackingPixel> =
        springDataRepository.saveAll(trackingPixels)

    override fun findById(id: UUID): Optional<TrackingPixel> = springDataRepository.findById(id)

    override fun deleteById(id: UUID) = springDataRepository.deleteById(id)

    override fun findByToken(token: String): Optional<TrackingPixel> =
        springDataRepository.findByToken(token)

    override fun findByMessageLogId(messageLogId: UUID): List<TrackingPixel> =
        springDataRepository.findByMessageLogId(messageLogId)

    override fun findByMessageLogIdAndType(
        messageLogId: UUID,
        trackingType: TrackingType
    ): Optional<TrackingPixel> =
        springDataRepository.findByMessageLogIdAndTrackingType(messageLogId, trackingType)

    override fun deleteByMessageLogId(messageLogId: UUID) =
        springDataRepository.deleteByMessageLogId(messageLogId)

    override fun countTriggeredByType(trackingType: TrackingType): Long =
        springDataRepository.countTriggeredByType(trackingType)
}
