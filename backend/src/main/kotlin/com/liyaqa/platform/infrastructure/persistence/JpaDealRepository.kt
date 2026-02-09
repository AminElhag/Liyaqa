package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.Deal
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStage
import com.liyaqa.platform.domain.ports.DealRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataDealRepository : JpaRepository<Deal, UUID> {

    fun findByStage(stage: DealStage, pageable: Pageable): Page<Deal>

    @Query("""
        SELECT d FROM Deal d
        WHERE d.assignedTo.id = :userId
    """)
    fun findByAssignedToId(
        @Param("userId") userId: UUID,
        pageable: Pageable
    ): Page<Deal>

    @Query("""
        SELECT d FROM Deal d
        WHERE d.assignedTo.id = :userId
        AND d.stage NOT IN ('WON', 'LOST', 'CHURNED')
        ORDER BY d.expectedCloseDate ASC NULLS LAST, d.createdAt DESC
    """)
    fun findOpenByAssignedToId(
        @Param("userId") userId: UUID,
        pageable: Pageable
    ): Page<Deal>

    fun findBySource(source: DealSource, pageable: Pageable): Page<Deal>

    fun findByContactEmail(email: String): List<Deal>

    @Query("""
        SELECT d FROM Deal d
        WHERE d.stage NOT IN ('WON', 'LOST', 'CHURNED')
        ORDER BY d.expectedCloseDate ASC NULLS LAST, d.createdAt DESC
    """)
    fun findOpen(pageable: Pageable): Page<Deal>

    fun countByStage(stage: DealStage): Long

    @Query("""
        SELECT COUNT(d) FROM Deal d
        WHERE d.stage = :stage
        AND d.createdAt > :after
    """)
    fun countByStageAndCreatedAtAfter(
        @Param("stage") stage: DealStage,
        @Param("after") after: Instant
    ): Long
}

@Repository
class JpaDealRepository(
    private val springDataRepository: SpringDataDealRepository
) : DealRepository {

    override fun save(deal: Deal): Deal =
        springDataRepository.save(deal)

    override fun findById(id: UUID): Optional<Deal> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<Deal> =
        springDataRepository.findAll(pageable)

    override fun findByStage(stage: DealStage, pageable: Pageable): Page<Deal> =
        springDataRepository.findByStage(stage, pageable)

    override fun findByAssignedToId(userId: UUID, pageable: Pageable): Page<Deal> =
        springDataRepository.findByAssignedToId(userId, pageable)

    override fun findOpenByAssignedToId(userId: UUID, pageable: Pageable): Page<Deal> =
        springDataRepository.findOpenByAssignedToId(userId, pageable)

    override fun findBySource(source: DealSource, pageable: Pageable): Page<Deal> =
        springDataRepository.findBySource(source, pageable)

    override fun findByContactEmail(email: String): List<Deal> =
        springDataRepository.findByContactEmail(email)

    override fun findOpen(pageable: Pageable): Page<Deal> =
        springDataRepository.findOpen(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStage(stage: DealStage): Long =
        springDataRepository.countByStage(stage)

    override fun countByStageAndCreatedAfter(stage: DealStage, after: Instant): Long =
        springDataRepository.countByStageAndCreatedAtAfter(stage, after)

    override fun getOpenDeals(pageable: Pageable): Page<Deal> =
        springDataRepository.findOpen(pageable)

    override fun countByStageGrouped(): Map<DealStage, Long> =
        DealStage.entries.associateWith { springDataRepository.countByStage(it) }
}
