package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.Deal
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
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
    fun findByStatus(status: DealStatus, pageable: Pageable): Page<Deal>
    fun findBySalesRepId(salesRepId: UUID, pageable: Pageable): Page<Deal>
    fun findOpenBySalesRepId(salesRepId: UUID, pageable: Pageable): Page<Deal>
    fun findBySource(source: DealSource, pageable: Pageable): Page<Deal>
    fun findByContactEmail(email: String): List<Deal>
    fun findByConvertedOrganizationId(organizationId: UUID): Optional<Deal>
    fun findOpen(pageable: Pageable): Page<Deal>
    fun findExpectedToCloseWithin(days: Int): List<Deal>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByStatus(status: DealStatus): Long
    fun countBySalesRepId(salesRepId: UUID): Long
    fun countOpenBySalesRepId(salesRepId: UUID): Long
    fun countByStatusAndCreatedAfter(status: DealStatus, after: Instant): Long
    fun getOpenDeals(pageable: Pageable): Page<Deal>
    fun getDealStats(): DealStats
}

/**
 * Statistics about deals in the pipeline.
 */
data class DealStats(
    val leads: Long,
    val qualified: Long,
    val proposal: Long,
    val negotiation: Long,
    val won: Long,
    val lost: Long,
    val totalValue: BigDecimal,
    val weightedValue: BigDecimal
)
