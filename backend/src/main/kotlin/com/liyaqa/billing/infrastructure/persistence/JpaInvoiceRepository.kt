package com.liyaqa.billing.infrastructure.persistence

import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceSequence
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.billing.domain.ports.InvoiceSequenceRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.Optional
import java.util.UUID

interface SpringDataInvoiceRepository : JpaRepository<Invoice, UUID> {
    fun findByInvoiceNumber(invoiceNumber: String): Optional<Invoice>

    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Invoice>

    fun findByMemberIdAndStatus(memberId: UUID, status: InvoiceStatus, pageable: Pageable): Page<Invoice>

    fun findByStatus(status: InvoiceStatus, pageable: Pageable): Page<Invoice>

    @Query("SELECT i FROM Invoice i WHERE i.status = 'OVERDUE'")
    fun findOverdueInvoices(pageable: Pageable): Page<Invoice>

    @Query("SELECT i FROM Invoice i WHERE i.status = 'ISSUED' AND i.dueDate < :currentDate")
    fun findIssuedInvoicesPastDueDate(@Param("currentDate") currentDate: LocalDate, pageable: Pageable): Page<Invoice>

    @Query("SELECT i FROM Invoice i WHERE i.status = 'ISSUED' AND i.dueDate = :dueDate")
    fun findIssuedInvoicesDueOn(@Param("dueDate") dueDate: LocalDate, pageable: Pageable): Page<Invoice>

    fun findFirstBySubscriptionIdOrderByCreatedAtDesc(subscriptionId: UUID): Optional<Invoice>

    fun findBySubscriptionIdAndStatusIn(subscriptionId: UUID, statuses: List<InvoiceStatus>): List<Invoice>

    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Invoice>

    fun countByStatus(status: InvoiceStatus): Long

    fun countByMemberId(memberId: UUID): Long

    @Query("""
        SELECT COALESCE(SUM(i.paidAmount.amount), 0)
        FROM Invoice i
        WHERE i.status = 'PAID'
        AND i.paidDate >= :startDate
        AND i.paidDate <= :endDate
    """)
    fun sumPaidAmountBetween(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): Long

    // ==================== Saudi Payment Methods ====================

    fun findByStcpayTransactionId(stcpayTransactionId: String): Optional<Invoice>

    fun findBySadadBillNumber(sadadBillNumber: String): Optional<Invoice>

    fun findByTamaraOrderId(tamaraOrderId: String): Optional<Invoice>

    @Query("""
        SELECT i FROM Invoice i
        WHERE (:search IS NULL OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:status IS NULL OR i.status = :status)
        AND (:memberId IS NULL OR i.memberId = :memberId)
        AND (:dateFrom IS NULL OR i.createdAt >= :dateFrom)
        AND (:dateTo IS NULL OR i.createdAt <= :dateTo)
    """)
    fun search(
        @Param("search") search: String?,
        @Param("status") status: InvoiceStatus?,
        @Param("memberId") memberId: UUID?,
        @Param("dateFrom") dateFrom: java.time.Instant?,
        @Param("dateTo") dateTo: java.time.Instant?,
        pageable: Pageable
    ): Page<Invoice>
}

interface SpringDataInvoiceSequenceRepository : JpaRepository<InvoiceSequence, UUID> {
    fun findByOrganizationId(organizationId: UUID): Optional<InvoiceSequence>
    fun existsByOrganizationId(organizationId: UUID): Boolean

    /**
     * Finds sequence with pessimistic write lock for concurrent invoice generation.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM InvoiceSequence s WHERE s.organizationId = :organizationId")
    fun findByOrganizationIdForUpdate(@Param("organizationId") organizationId: UUID): Optional<InvoiceSequence>
}

@Repository
class JpaInvoiceRepository(
    private val springDataRepository: SpringDataInvoiceRepository
) : InvoiceRepository {

    override fun save(invoice: Invoice): Invoice =
        springDataRepository.save(invoice)

    override fun findById(id: UUID): Optional<Invoice> =
        springDataRepository.findById(id)

    override fun findByInvoiceNumber(invoiceNumber: String): Optional<Invoice> =
        springDataRepository.findByInvoiceNumber(invoiceNumber)

    override fun findAll(pageable: Pageable): Page<Invoice> =
        springDataRepository.findAll(pageable)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Invoice> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findByMemberIdAndStatus(memberId: UUID, status: InvoiceStatus, pageable: Pageable): Page<Invoice> =
        springDataRepository.findByMemberIdAndStatus(memberId, status, pageable)

    override fun findByStatus(status: InvoiceStatus, pageable: Pageable): Page<Invoice> =
        springDataRepository.findByStatus(status, pageable)

    override fun findOverdueInvoices(pageable: Pageable): Page<Invoice> =
        springDataRepository.findOverdueInvoices(pageable)

    override fun findIssuedInvoicesPastDueDate(currentDate: LocalDate, pageable: Pageable): Page<Invoice> =
        springDataRepository.findIssuedInvoicesPastDueDate(currentDate, pageable)

    override fun findIssuedInvoicesDueOn(dueDate: LocalDate, pageable: Pageable): Page<Invoice> =
        springDataRepository.findIssuedInvoicesDueOn(dueDate, pageable)

    override fun findFirstBySubscriptionIdOrderByCreatedAtDesc(subscriptionId: UUID): Optional<Invoice> =
        springDataRepository.findFirstBySubscriptionIdOrderByCreatedAtDesc(subscriptionId)

    override fun findBySubscriptionIdAndStatusIn(subscriptionId: UUID, statuses: List<InvoiceStatus>): List<Invoice> =
        springDataRepository.findBySubscriptionIdAndStatusIn(subscriptionId, statuses)

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Invoice> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: InvoiceStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countByMemberId(memberId: UUID): Long =
        springDataRepository.countByMemberId(memberId)

    override fun sumPaidAmountBetween(startDate: LocalDate, endDate: LocalDate): Long {
        return springDataRepository.sumPaidAmountBetween(startDate, endDate)
    }

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    // ==================== Saudi Payment Methods ====================

    override fun findByStcpayTransactionId(transactionId: String): Invoice? =
        springDataRepository.findByStcpayTransactionId(transactionId).orElse(null)

    override fun findBySadadBillNumber(billNumber: String): Invoice? =
        springDataRepository.findBySadadBillNumber(billNumber).orElse(null)

    override fun findByTamaraOrderId(orderId: String): Invoice? =
        springDataRepository.findByTamaraOrderId(orderId).orElse(null)

    override fun search(
        search: String?,
        status: InvoiceStatus?,
        memberId: UUID?,
        dateFrom: LocalDate?,
        dateTo: LocalDate?,
        pageable: Pageable
    ): Page<Invoice> {
        val dateFromInstant = dateFrom?.atStartOfDay()?.toInstant(ZoneOffset.UTC)
        val dateToInstant = dateTo?.plusDays(1)?.atStartOfDay()?.toInstant(ZoneOffset.UTC)

        return springDataRepository.search(
            search = search?.takeIf { it.isNotBlank() },
            status = status,
            memberId = memberId,
            dateFrom = dateFromInstant,
            dateTo = dateToInstant,
            pageable = pageable
        )
    }
}

@Repository
class JpaInvoiceSequenceRepository(
    private val springDataRepository: SpringDataInvoiceSequenceRepository
) : InvoiceSequenceRepository {

    override fun save(sequence: InvoiceSequence): InvoiceSequence =
        springDataRepository.save(sequence)

    override fun findByOrganizationId(organizationId: UUID): Optional<InvoiceSequence> =
        springDataRepository.findByOrganizationId(organizationId)

    override fun existsByOrganizationId(organizationId: UUID): Boolean =
        springDataRepository.existsByOrganizationId(organizationId)

    override fun findByOrganizationIdForUpdate(organizationId: UUID): Optional<InvoiceSequence> =
        springDataRepository.findByOrganizationIdForUpdate(organizationId)
}
