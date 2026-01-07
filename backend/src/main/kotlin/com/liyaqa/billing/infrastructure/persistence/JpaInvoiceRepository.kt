package com.liyaqa.billing.infrastructure.persistence

import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceSequence
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.billing.domain.ports.InvoiceSequenceRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
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

    fun findBySubscriptionId(subscriptionId: UUID): Optional<Invoice>

    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Invoice>

    fun countByStatus(status: InvoiceStatus): Long

    fun countByMemberId(memberId: UUID): Long
}

interface SpringDataInvoiceSequenceRepository : JpaRepository<InvoiceSequence, UUID> {
    fun findByOrganizationId(organizationId: UUID): Optional<InvoiceSequence>
    fun existsByOrganizationId(organizationId: UUID): Boolean
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

    override fun findBySubscriptionId(subscriptionId: UUID): Optional<Invoice> =
        springDataRepository.findBySubscriptionId(subscriptionId)

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Invoice> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: InvoiceStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countByMemberId(memberId: UUID): Long =
        springDataRepository.countByMemberId(memberId)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)
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
}
