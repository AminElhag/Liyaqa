package com.liyaqa.marketing.infrastructure.persistence

import com.liyaqa.marketing.domain.model.MessageLog
import com.liyaqa.marketing.domain.model.MessageStatus
import com.liyaqa.marketing.domain.ports.CampaignMessageStats
import com.liyaqa.marketing.domain.ports.MessageLogRepository
import com.liyaqa.marketing.domain.ports.StepMessageStats
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataMessageLogRepository : JpaRepository<MessageLog, UUID> {

    fun findByCampaignId(campaignId: UUID, pageable: Pageable): Page<MessageLog>

    fun findByEnrollmentId(enrollmentId: UUID): List<MessageLog>

    fun findByStepId(stepId: UUID, pageable: Pageable): Page<MessageLog>

    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MessageLog>

    fun findByStatus(status: MessageStatus, pageable: Pageable): Page<MessageLog>

    fun countByCampaignIdAndStatus(campaignId: UUID, status: MessageStatus): Long

    fun countByStepIdAndStatus(stepId: UUID, status: MessageStatus): Long

    @Query("SELECT COUNT(m) FROM MessageLog m WHERE m.campaignId = :campaignId AND m.openedAt IS NOT NULL")
    fun countOpenedByCampaignId(@Param("campaignId") campaignId: UUID): Long

    @Query("SELECT COUNT(m) FROM MessageLog m WHERE m.campaignId = :campaignId AND m.clickedAt IS NOT NULL")
    fun countClickedByCampaignId(@Param("campaignId") campaignId: UUID): Long

    fun findBySentAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<MessageLog>

    @Query("""
        SELECT COUNT(m) FROM MessageLog m WHERE m.campaignId = :campaignId
    """)
    fun countByCampaignId(@Param("campaignId") campaignId: UUID): Long

    @Query("""
        SELECT COUNT(m) FROM MessageLog m
        WHERE m.campaignId = :campaignId AND m.status = 'SENT'
    """)
    fun countSentByCampaignId(@Param("campaignId") campaignId: UUID): Long

    @Query("""
        SELECT COUNT(m) FROM MessageLog m
        WHERE m.campaignId = :campaignId AND m.status = 'DELIVERED'
    """)
    fun countDeliveredByCampaignId(@Param("campaignId") campaignId: UUID): Long

    @Query("""
        SELECT COUNT(m) FROM MessageLog m
        WHERE m.campaignId = :campaignId AND m.status = 'FAILED'
    """)
    fun countFailedByCampaignId(@Param("campaignId") campaignId: UUID): Long

    @Query("""
        SELECT COUNT(m) FROM MessageLog m
        WHERE m.campaignId = :campaignId AND m.status = 'BOUNCED'
    """)
    fun countBouncedByCampaignId(@Param("campaignId") campaignId: UUID): Long

    @Query("""
        SELECT COUNT(m) FROM MessageLog m WHERE m.stepId = :stepId
    """)
    fun countByStepId(@Param("stepId") stepId: UUID): Long

    @Query("""
        SELECT COUNT(m) FROM MessageLog m WHERE m.stepId = :stepId AND m.status = 'SENT'
    """)
    fun countSentByStepId(@Param("stepId") stepId: UUID): Long

    @Query("""
        SELECT COUNT(m) FROM MessageLog m WHERE m.stepId = :stepId AND m.status = 'DELIVERED'
    """)
    fun countDeliveredByStepId(@Param("stepId") stepId: UUID): Long

    @Query("""
        SELECT COUNT(m) FROM MessageLog m WHERE m.stepId = :stepId AND m.status = 'FAILED'
    """)
    fun countFailedByStepId(@Param("stepId") stepId: UUID): Long

    @Query("SELECT COUNT(m) FROM MessageLog m WHERE m.stepId = :stepId AND m.openedAt IS NOT NULL")
    fun countOpenedByStepId(@Param("stepId") stepId: UUID): Long

    @Query("SELECT COUNT(m) FROM MessageLog m WHERE m.stepId = :stepId AND m.clickedAt IS NOT NULL")
    fun countClickedByStepId(@Param("stepId") stepId: UUID): Long
}

@Repository
class JpaMessageLogRepository(
    private val springDataRepository: SpringDataMessageLogRepository
) : MessageLogRepository {

    override fun save(messageLog: MessageLog): MessageLog = springDataRepository.save(messageLog)

    override fun findById(id: UUID): Optional<MessageLog> = springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<MessageLog> = springDataRepository.findAll(pageable)

    override fun deleteById(id: UUID) = springDataRepository.deleteById(id)

    override fun findByCampaignId(campaignId: UUID, pageable: Pageable): Page<MessageLog> =
        springDataRepository.findByCampaignId(campaignId, pageable)

    override fun findByEnrollmentId(enrollmentId: UUID): List<MessageLog> =
        springDataRepository.findByEnrollmentId(enrollmentId)

    override fun findByStepId(stepId: UUID, pageable: Pageable): Page<MessageLog> =
        springDataRepository.findByStepId(stepId, pageable)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MessageLog> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findByStatus(status: MessageStatus, pageable: Pageable): Page<MessageLog> =
        springDataRepository.findByStatus(status, pageable)

    override fun countByCampaignIdAndStatus(campaignId: UUID, status: MessageStatus): Long =
        springDataRepository.countByCampaignIdAndStatus(campaignId, status)

    override fun countByStepIdAndStatus(stepId: UUID, status: MessageStatus): Long =
        springDataRepository.countByStepIdAndStatus(stepId, status)

    override fun countOpenedByCampaignId(campaignId: UUID): Long =
        springDataRepository.countOpenedByCampaignId(campaignId)

    override fun countClickedByCampaignId(campaignId: UUID): Long =
        springDataRepository.countClickedByCampaignId(campaignId)

    override fun findBySentAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<MessageLog> =
        springDataRepository.findBySentAtBetween(start, end, pageable)

    override fun getCampaignStats(campaignId: UUID): CampaignMessageStats {
        return CampaignMessageStats(
            total = springDataRepository.countByCampaignId(campaignId),
            sent = springDataRepository.countSentByCampaignId(campaignId),
            delivered = springDataRepository.countDeliveredByCampaignId(campaignId),
            failed = springDataRepository.countFailedByCampaignId(campaignId),
            bounced = springDataRepository.countBouncedByCampaignId(campaignId),
            opened = springDataRepository.countOpenedByCampaignId(campaignId),
            clicked = springDataRepository.countClickedByCampaignId(campaignId)
        )
    }

    override fun getStepStats(stepId: UUID): StepMessageStats {
        return StepMessageStats(
            stepId = stepId,
            total = springDataRepository.countByStepId(stepId),
            sent = springDataRepository.countSentByStepId(stepId),
            delivered = springDataRepository.countDeliveredByStepId(stepId),
            failed = springDataRepository.countFailedByStepId(stepId),
            opened = springDataRepository.countOpenedByStepId(stepId),
            clicked = springDataRepository.countClickedByStepId(stepId)
        )
    }
}
