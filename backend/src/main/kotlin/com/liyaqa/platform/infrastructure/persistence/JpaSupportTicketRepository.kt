package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.SupportTicket
import com.liyaqa.platform.domain.model.TicketCategory
import com.liyaqa.platform.domain.model.TicketMessage
import com.liyaqa.platform.domain.model.TicketPriority
import com.liyaqa.platform.domain.model.TicketStatus
import com.liyaqa.platform.domain.ports.SupportTicketRepository
import com.liyaqa.platform.domain.ports.TicketMessageRepository
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA interface for SupportTicket.
 */
interface SpringDataSupportTicketRepository : JpaRepository<SupportTicket, UUID> {
    fun findByStatus(status: TicketStatus, pageable: Pageable): Page<SupportTicket>
    fun findByPriority(priority: TicketPriority, pageable: Pageable): Page<SupportTicket>
    fun findByCategory(category: TicketCategory, pageable: Pageable): Page<SupportTicket>

    @Query("SELECT t FROM SupportTicket t WHERE t.organization.id = :organizationId")
    fun findByOrganizationId(@Param("organizationId") organizationId: UUID, pageable: Pageable): Page<SupportTicket>

    fun findByAssignedToId(assignedToId: UUID, pageable: Pageable): Page<SupportTicket>
    fun countByStatus(status: TicketStatus): Long

    @Query("SELECT COUNT(t) FROM SupportTicket t WHERE t.organization.id = :organizationId AND t.status = :status")
    fun countByOrganizationIdAndStatus(@Param("organizationId") organizationId: UUID, @Param("status") status: TicketStatus): Long

    @Query("""
        SELECT t FROM SupportTicket t
        WHERE LOWER(t.subject) LIKE LOWER(CONCAT('%', :search, '%'))
        OR LOWER(t.ticketNumber) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    fun searchBySubjectOrTicketNumber(@Param("search") search: String, pageable: Pageable): Page<SupportTicket>

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(t.ticketNumber, 14) AS int)), 0) FROM SupportTicket t WHERE t.ticketNumber LIKE :prefix%")
    fun getMaxSequenceForPrefix(@Param("prefix") prefix: String): Int

    @Query("""
        SELECT t FROM SupportTicket t
        LEFT JOIN FETCH t.organization
        LEFT JOIN FETCH t.assignedTo
        LEFT JOIN FETCH t.createdBy
        WHERE t.id = :id
    """)
    fun findByIdWithRelations(@Param("id") id: UUID): Optional<SupportTicket>
}

/**
 * Spring Data JPA interface for TicketMessage.
 */
interface SpringDataTicketMessageRepository : JpaRepository<TicketMessage, UUID> {
    fun findByTicketId(ticketId: UUID): List<TicketMessage>

    @Query("""
        SELECT m FROM TicketMessage m
        JOIN FETCH m.ticket
        JOIN FETCH m.author
        WHERE m.ticket.id = :ticketId
        ORDER BY m.createdAt ASC
    """)
    fun findByTicketIdOrderByCreatedAtAsc(@Param("ticketId") ticketId: UUID): List<TicketMessage>
}

/**
 * JPA adapter implementation for SupportTicketRepository.
 */
@Repository
class JpaSupportTicketRepository(
    private val springDataRepository: SpringDataSupportTicketRepository
) : SupportTicketRepository {

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    override fun save(ticket: SupportTicket): SupportTicket =
        springDataRepository.save(ticket)

    override fun findById(id: UUID): Optional<SupportTicket> =
        springDataRepository.findByIdWithRelations(id)

    override fun findAll(pageable: Pageable): Page<SupportTicket> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: TicketStatus, pageable: Pageable): Page<SupportTicket> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByPriority(priority: TicketPriority, pageable: Pageable): Page<SupportTicket> =
        springDataRepository.findByPriority(priority, pageable)

    override fun findByCategory(category: TicketCategory, pageable: Pageable): Page<SupportTicket> =
        springDataRepository.findByCategory(category, pageable)

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<SupportTicket> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun findByAssignedToId(assignedToId: UUID, pageable: Pageable): Page<SupportTicket> =
        springDataRepository.findByAssignedToId(assignedToId, pageable)

    override fun searchBySubjectOrTicketNumber(search: String, pageable: Pageable): Page<SupportTicket> =
        springDataRepository.searchBySubjectOrTicketNumber(search, pageable)

    override fun findByFilters(
        status: TicketStatus?,
        priority: TicketPriority?,
        category: TicketCategory?,
        organizationId: UUID?,
        assignedToId: UUID?,
        search: String?,
        pageable: Pageable
    ): Page<SupportTicket> {
        val cb = entityManager.criteriaBuilder
        val cq = cb.createQuery(SupportTicket::class.java)
        val root = cq.from(SupportTicket::class.java)

        // Note: fetch joins removed here because Hibernate @Filter on Club entity
        // causes "UnknownFilterException: No filter named 'organizationFilter'" when
        // generating the fetch. Lazy relationships are initialized in the service layer
        // via Hibernate.initialize() instead.

        val predicates = mutableListOf<jakarta.persistence.criteria.Predicate>()

        status?.let {
            predicates.add(cb.equal(root.get<TicketStatus>("status"), it))
        }
        priority?.let {
            predicates.add(cb.equal(root.get<TicketPriority>("priority"), it))
        }
        category?.let {
            predicates.add(cb.equal(root.get<TicketCategory>("category"), it))
        }
        organizationId?.let {
            predicates.add(cb.equal(root.get<UUID>("organization").get<UUID>("id"), it))
        }
        assignedToId?.let {
            predicates.add(cb.equal(root.get<UUID>("assignedTo").get<UUID>("id"), it))
        }
        search?.let {
            val searchPattern = "%${it.lowercase()}%"
            val subjectPredicate = cb.like(cb.lower(root.get("subject")), searchPattern)
            val ticketNumberPredicate = cb.like(cb.lower(root.get("ticketNumber")), searchPattern)
            predicates.add(cb.or(subjectPredicate, ticketNumberPredicate))
        }

        if (predicates.isNotEmpty()) {
            cq.where(*predicates.toTypedArray())
        }

        // Apply sorting
        val orders = pageable.sort.map { order ->
            if (order.isAscending) {
                cb.asc(root.get<Any>(order.property))
            } else {
                cb.desc(root.get<Any>(order.property))
            }
        }.toList()
        if (orders.isNotEmpty()) {
            cq.orderBy(orders)
        }

        val query = entityManager.createQuery(cq)
        query.firstResult = pageable.offset.toInt()
        query.maxResults = pageable.pageSize

        val results = query.resultList

        // Count query
        val countCq = cb.createQuery(Long::class.java)
        val countRoot = countCq.from(SupportTicket::class.java)
        countCq.select(cb.count(countRoot))

        val countPredicates = mutableListOf<jakarta.persistence.criteria.Predicate>()
        status?.let {
            countPredicates.add(cb.equal(countRoot.get<TicketStatus>("status"), it))
        }
        priority?.let {
            countPredicates.add(cb.equal(countRoot.get<TicketPriority>("priority"), it))
        }
        category?.let {
            countPredicates.add(cb.equal(countRoot.get<TicketCategory>("category"), it))
        }
        organizationId?.let {
            countPredicates.add(cb.equal(countRoot.get<UUID>("organization").get<UUID>("id"), it))
        }
        assignedToId?.let {
            countPredicates.add(cb.equal(countRoot.get<UUID>("assignedTo").get<UUID>("id"), it))
        }
        search?.let {
            val searchPattern = "%${it.lowercase()}%"
            val subjectPredicate = cb.like(cb.lower(countRoot.get("subject")), searchPattern)
            val ticketNumberPredicate = cb.like(cb.lower(countRoot.get("ticketNumber")), searchPattern)
            countPredicates.add(cb.or(subjectPredicate, ticketNumberPredicate))
        }

        if (countPredicates.isNotEmpty()) {
            countCq.where(*countPredicates.toTypedArray())
        }

        val total = entityManager.createQuery(countCq).singleResult

        return PageImpl(results, pageable, total)
    }

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: TicketStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countByOrganizationIdAndStatus(organizationId: UUID, status: TicketStatus): Long =
        springDataRepository.countByOrganizationIdAndStatus(organizationId, status)

    override fun generateTicketNumber(): String {
        val today = LocalDate.now()
        val datePrefix = today.format(DateTimeFormatter.ofPattern("yyyyMMdd"))
        val prefix = "TKT-$datePrefix-"

        // Get max sequence for today
        val maxSeq = springDataRepository.getMaxSequenceForPrefix(prefix)
        val nextSeq = maxSeq + 1

        return "$prefix${nextSeq.toString().padStart(4, '0')}"
    }
}

/**
 * JPA adapter implementation for TicketMessageRepository.
 */
@Repository
class JpaTicketMessageRepository(
    private val springDataRepository: SpringDataTicketMessageRepository
) : TicketMessageRepository {

    override fun save(message: TicketMessage): TicketMessage =
        springDataRepository.save(message)

    override fun findByTicketId(ticketId: UUID): List<TicketMessage> =
        springDataRepository.findByTicketId(ticketId)

    override fun findByTicketIdOrderByCreatedAtAsc(ticketId: UUID): List<TicketMessage> =
        springDataRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
}
