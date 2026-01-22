package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.Deal
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStatus
import com.liyaqa.platform.domain.ports.DealRepository
import com.liyaqa.platform.domain.ports.DealStats
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataDealRepository : JpaRepository<Deal, UUID> {

    fun findByStatus(status: DealStatus, pageable: Pageable): Page<Deal>

    fun findBySalesRepId(salesRepId: UUID, pageable: Pageable): Page<Deal>

    @Query("""
        SELECT d FROM Deal d
        WHERE d.salesRepId = :salesRepId
        AND d.status NOT IN ('WON', 'LOST')
        ORDER BY d.expectedCloseDate ASC NULLS LAST, d.createdAt DESC
    """)
    fun findOpenBySalesRepId(
        @Param("salesRepId") salesRepId: UUID,
        pageable: Pageable
    ): Page<Deal>

    fun findBySource(source: DealSource, pageable: Pageable): Page<Deal>

    fun findByContactEmail(email: String): List<Deal>

    fun findByConvertedOrganizationId(organizationId: UUID): Optional<Deal>

    @Query("""
        SELECT d FROM Deal d
        WHERE d.status NOT IN ('WON', 'LOST')
        ORDER BY d.expectedCloseDate ASC NULLS LAST, d.createdAt DESC
    """)
    fun findOpen(pageable: Pageable): Page<Deal>

    @Query("""
        SELECT d FROM Deal d
        WHERE d.status NOT IN ('WON', 'LOST')
        AND d.expectedCloseDate IS NOT NULL
        AND d.expectedCloseDate <= :closeDate
        ORDER BY d.expectedCloseDate ASC
    """)
    fun findExpectedToCloseBefore(@Param("closeDate") closeDate: LocalDate): List<Deal>

    fun countByStatus(status: DealStatus): Long

    fun countBySalesRepId(salesRepId: UUID): Long

    @Query("""
        SELECT COUNT(d) FROM Deal d
        WHERE d.salesRepId = :salesRepId
        AND d.status NOT IN ('WON', 'LOST')
    """)
    fun countOpenBySalesRepId(@Param("salesRepId") salesRepId: UUID): Long

    @Query("""
        SELECT COUNT(d) FROM Deal d
        WHERE d.status = :status
        AND d.createdAt > :after
    """)
    fun countByStatusAndCreatedAtAfter(
        @Param("status") status: DealStatus,
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

    override fun findByStatus(status: DealStatus, pageable: Pageable): Page<Deal> =
        springDataRepository.findByStatus(status, pageable)

    override fun findBySalesRepId(salesRepId: UUID, pageable: Pageable): Page<Deal> =
        springDataRepository.findBySalesRepId(salesRepId, pageable)

    override fun findOpenBySalesRepId(salesRepId: UUID, pageable: Pageable): Page<Deal> =
        springDataRepository.findOpenBySalesRepId(salesRepId, pageable)

    override fun findBySource(source: DealSource, pageable: Pageable): Page<Deal> =
        springDataRepository.findBySource(source, pageable)

    override fun findByContactEmail(email: String): List<Deal> =
        springDataRepository.findByContactEmail(email)

    override fun findByConvertedOrganizationId(organizationId: UUID): Optional<Deal> =
        springDataRepository.findByConvertedOrganizationId(organizationId)

    override fun findOpen(pageable: Pageable): Page<Deal> =
        springDataRepository.findOpen(pageable)

    override fun findExpectedToCloseWithin(days: Int): List<Deal> {
        val closeDate = LocalDate.now().plusDays(days.toLong())
        return springDataRepository.findExpectedToCloseBefore(closeDate)
    }

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: DealStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countBySalesRepId(salesRepId: UUID): Long =
        springDataRepository.countBySalesRepId(salesRepId)

    override fun countOpenBySalesRepId(salesRepId: UUID): Long =
        springDataRepository.countOpenBySalesRepId(salesRepId)

    override fun countByStatusAndCreatedAfter(status: DealStatus, after: Instant): Long =
        springDataRepository.countByStatusAndCreatedAtAfter(status, after)

    override fun getOpenDeals(pageable: Pageable): Page<Deal> =
        springDataRepository.findOpen(pageable)

    override fun getDealStats(): DealStats {
        val leads = springDataRepository.countByStatus(DealStatus.LEAD)
        val qualified = springDataRepository.countByStatus(DealStatus.QUALIFIED)
        val proposal = springDataRepository.countByStatus(DealStatus.PROPOSAL)
        val negotiation = springDataRepository.countByStatus(DealStatus.NEGOTIATION)
        val won = springDataRepository.countByStatus(DealStatus.WON)
        val lost = springDataRepository.countByStatus(DealStatus.LOST)

        // Get all open deals to calculate values
        val openDeals = springDataRepository.findOpen(Pageable.unpaged()).content

        val totalValue = openDeals.sumOf { it.estimatedValue.amount }
        val weightedValue = openDeals.sumOf {
            it.estimatedValue.amount.multiply(BigDecimal(it.probability).divide(BigDecimal(100)))
        }

        return DealStats(
            leads = leads,
            qualified = qualified,
            proposal = proposal,
            negotiation = negotiation,
            won = won,
            lost = lost,
            totalValue = totalValue,
            weightedValue = weightedValue
        )
    }
}
