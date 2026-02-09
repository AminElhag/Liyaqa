package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.Deal
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStage
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for Deal entity.
 * Deals are platform-level (not tenant-scoped) and represent
 * sales pipeline leads and opportunities.
 */
interface DealRepository {
    fun save(deal: Deal): Deal
    fun findById(id: UUID): Optional<Deal>
    fun findAll(pageable: Pageable): Page<Deal>
    fun findByStage(stage: DealStage, pageable: Pageable): Page<Deal>
    fun findByAssignedToId(userId: UUID, pageable: Pageable): Page<Deal>
    fun findOpenByAssignedToId(userId: UUID, pageable: Pageable): Page<Deal>
    fun findBySource(source: DealSource, pageable: Pageable): Page<Deal>
    fun findByContactEmail(email: String): List<Deal>
    fun findOpen(pageable: Pageable): Page<Deal>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByStage(stage: DealStage): Long
    fun countByStageAndCreatedAfter(stage: DealStage, after: Instant): Long
    fun getOpenDeals(pageable: Pageable): Page<Deal>
    fun countByStageGrouped(): Map<DealStage, Long>
}
